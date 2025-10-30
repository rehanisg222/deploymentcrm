import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { activities, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const VALID_ACTIONS = ['created', 'deleted', 'updated', 'stage-changed', 'description-added', 'description-updated', 'description-deleted'];
const VALID_ENTITY_TYPES = ['lead', 'pipeline', 'comment', 'project'];

function validateAction(action: string): boolean {
  return VALID_ACTIONS.includes(action);
}

function validateEntityType(entityType: string): boolean {
  return VALID_ENTITY_TYPES.includes(entityType);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const activity = await db
        .select()
        .from(activities)
        .where(eq(activities.id, parseInt(id)))
        .limit(1);

      if (activity.length === 0) {
        return NextResponse.json(
          { error: 'Activity not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      // Parse metadata if present
      const result = activity[0];
      if (result.metadata) {
        try {
          result.metadata = JSON.parse(result.metadata as string);
        } catch (e) {
          result.metadata = null;
        }
      }

      return NextResponse.json(result, { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const leadId = searchParams.get('leadId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    let query = db.select().from(activities);
    const conditions = [];

    if (leadId && !isNaN(parseInt(leadId))) {
      conditions.push(eq(activities.leadId, parseInt(leadId)));
    }

    if (userId && !isNaN(parseInt(userId))) {
      conditions.push(eq(activities.userId, parseInt(userId)));
    }

    if (action) {
      if (!validateAction(action)) {
        return NextResponse.json(
          {
            error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`,
            code: 'INVALID_ACTION',
          },
          { status: 400 }
        );
      }
      conditions.push(eq(activities.action, action));
    }

    if (entityType) {
      if (!validateEntityType(entityType)) {
        return NextResponse.json(
          {
            error: `Invalid entityType. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
            code: 'INVALID_ENTITY_TYPE',
          },
          { status: 400 }
        );
      }
      conditions.push(eq(activities.entityType, entityType));
    }

    if (entityId && !isNaN(parseInt(entityId))) {
      conditions.push(eq(activities.entityId, parseInt(entityId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(activities.createdAt))
      .limit(limit)
      .offset(offset);

    // Parse metadata for all results
    const parsedResults = results.map((activity) => {
      if (activity.metadata) {
        try {
          return {
            ...activity,
            metadata: JSON.parse(activity.metadata as string),
          };
        } catch (e) {
          return {
            ...activity,
            metadata: null,
          };
        }
      }
      return activity;
    });

    return NextResponse.json(parsedResults, { status: 200 });
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
    const { action, entityType, entityId, entityName, description, metadata, userId, leadId } = body;

    // Validate required fields
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required', code: 'MISSING_ACTION' },
        { status: 400 }
      );
    }

    if (!validateAction(action)) {
      return NextResponse.json(
        {
          error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`,
          code: 'INVALID_ACTION',
        },
        { status: 400 }
      );
    }

    if (!entityType) {
      return NextResponse.json(
        { error: 'EntityType is required', code: 'MISSING_ENTITY_TYPE' },
        { status: 400 }
      );
    }

    if (!validateEntityType(entityType)) {
      return NextResponse.json(
        {
          error: `Invalid entityType. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`,
          code: 'INVALID_ENTITY_TYPE',
        },
        { status: 400 }
      );
    }

    if (entityId === undefined || entityId === null) {
      return NextResponse.json(
        { error: 'EntityId is required', code: 'MISSING_ENTITY_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(entityId))) {
      return NextResponse.json(
        { error: 'EntityId must be a valid integer', code: 'INVALID_ENTITY_ID' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required', code: 'MISSING_DESCRIPTION' },
        { status: 400 }
      );
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length === 0) {
      return NextResponse.json(
        { error: 'Description cannot be empty', code: 'EMPTY_DESCRIPTION' },
        { status: 400 }
      );
    }

    // Fetch user details if userId provided
    let userName: string | null = null;
    let userEmail: string | null = null;

    if (userId !== undefined && userId !== null) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Invalid userId. Must be a valid integer', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      const userResult = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);

      if (userResult.length > 0) {
        userName = userResult[0].name;
        userEmail = userResult[0].email;
      }
    }

    const insertData: any = {
      action,
      entityType,
      entityId: parseInt(entityId),
      entityName: entityName || null,
      description: trimmedDescription,
      metadata: metadata ? JSON.stringify(metadata) : null,
      userName,
      userEmail,
      createdAt: new Date().toISOString(),
    };

    if (userId !== undefined && userId !== null) {
      insertData.userId = parseInt(userId);
    }

    if (leadId !== undefined && leadId !== null) {
      if (isNaN(parseInt(leadId))) {
        return NextResponse.json(
          { error: 'Invalid leadId. Must be a valid integer', code: 'INVALID_LEAD_ID' },
          { status: 400 }
        );
      }
      insertData.leadId = parseInt(leadId);
    }

    const newActivity = await db.insert(activities).values(insertData).returning();

    // Parse metadata before returning
    const result = newActivity[0];
    if (result.metadata) {
      try {
        result.metadata = JSON.parse(result.metadata as string);
      } catch (e) {
        result.metadata = null;
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}