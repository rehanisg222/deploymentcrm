import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leadComments, leads } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required', code: 'MISSING_LEAD_ID' },
        { status: 400 }
      );
    }

    const leadIdInt = parseInt(leadId);
    if (isNaN(leadIdInt)) {
      return NextResponse.json(
        { error: 'Lead ID must be a valid integer', code: 'INVALID_LEAD_ID' },
        { status: 400 }
      );
    }

    const comments = await db
      .select()
      .from(leadComments)
      .where(eq(leadComments.leadId, leadIdInt))
      .orderBy(desc(leadComments.createdAt));

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      leadId: comment.leadId,
      userId: comment.userId,
      description: comment.description,
      createdAt: comment.createdAt,
    }));

    return NextResponse.json(formattedComments);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, userId, description } = body;

    if (leadId === undefined || leadId === null) {
      return NextResponse.json(
        { error: 'Lead ID is required', code: 'MISSING_LEAD_ID' },
        { status: 400 }
      );
    }

    const leadIdInt = parseInt(leadId);
    if (isNaN(leadIdInt)) {
      return NextResponse.json(
        { error: 'Lead ID must be a valid integer', code: 'INVALID_LEAD_ID' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required', code: 'MISSING_DESCRIPTION' },
        { status: 400 }
      );
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      return NextResponse.json(
        { error: 'Description cannot be empty', code: 'EMPTY_DESCRIPTION' },
        { status: 400 }
      );
    }

    let userIdValue: number | null = null;
    if (userId !== undefined && userId !== null) {
      const userIdInt = parseInt(userId);
      if (isNaN(userIdInt)) {
        return NextResponse.json(
          { error: 'User ID must be a valid integer', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      userIdValue = userIdInt;
    }

    // Get lead name for activity logging
    const lead = await db.select().from(leads).where(eq(leads.id, leadIdInt)).limit(1);
    const leadName = lead.length > 0 ? `${lead[0].firstName} ${lead[0].lastName}` : `Lead #${leadIdInt}`;

    const insertData: any = {
      leadId: leadIdInt,
      description: trimmedDescription,
      createdAt: new Date().toISOString(),
    };

    if (userIdValue !== null) {
      insertData.userId = userIdValue;
    }

    const newComment = await db
      .insert(leadComments)
      .values(insertData)
      .returning();

    // Log activity
    await logActivity({
      action: 'description-added',
      entityType: 'comment',
      entityId: newComment[0].id,
      entityName: leadName,
      description: `Comment added to lead - ${leadName}`,
      metadata: { commentLength: trimmedDescription.length },
      userId: userIdValue || undefined,
      leadId: leadIdInt,
    });

    const formattedComment = {
      id: newComment[0].id,
      leadId: newComment[0].leadId,
      userId: newComment[0].userId ?? null,
      description: newComment[0].description,
      createdAt: newComment[0].createdAt,
    };

    return NextResponse.json(formattedComment, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Comment ID is required', code: 'MISSING_COMMENT_ID' },
        { status: 400 }
      );
    }

    const commentId = parseInt(id);
    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: 'Comment ID must be a valid integer', code: 'INVALID_COMMENT_ID' },
        { status: 400 }
      );
    }

    // Get comment details before deletion for activity logging
    const comment = await db
      .select()
      .from(leadComments)
      .where(eq(leadComments.id, commentId))
      .limit(1);

    if (comment.length > 0) {
      const leadId = comment[0].leadId;
      const userId = comment[0].userId;

      // Get lead name
      const lead = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
      const leadName = lead.length > 0 ? `${lead[0].firstName} ${lead[0].lastName}` : `Lead #${leadId}`;

      // Delete the comment
      await db
        .delete(leadComments)
        .where(eq(leadComments.id, commentId));

      // Log activity
      await logActivity({
        action: 'description-deleted',
        entityType: 'comment',
        entityId: commentId,
        entityName: leadName,
        description: `Comment deleted from lead - ${leadName}`,
        metadata: { reason: 'manual_deletion' },
        userId: userId || undefined,
        leadId: leadId,
      });
    } else {
      // Comment not found, just try to delete anyway
      await db
        .delete(leadComments)
        .where(eq(leadComments.id, commentId));
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}