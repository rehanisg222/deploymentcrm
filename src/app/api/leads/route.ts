import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, user } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import { logActivity } from '@/lib/activity-logger';

const VALID_SOURCES = ['organic', 'paid', 'referral', 'walk-in'];
const VALID_STATUSES = ['hot lead', 'new lead', 'booked lead', 'dead lead', 'duplicate lead'];
const VALID_STAGES = ['new', 'attempted 1', 'attempted 2', 'unqualified', 'site visited', 'closed won'];

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateScore(score: number): boolean {
  return Number.isInteger(score) && score >= 0 && score <= 100;
}

function validateISOTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && date.toISOString() === timestamp;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    // NEW: Get current user info for role-based filtering
    const currentUserId = searchParams.get('currentUserId'); // Auth user ID from session
    let userRole: string | null = null;
    let linkedBrokerId: number | null = null;
    
    if (currentUserId) {
      const currentUser = await db.select()
        .from(user)
        .where(eq(user.id, currentUserId))
        .limit(1);
      
      if (currentUser.length > 0) {
        userRole = currentUser[0].role;
        linkedBrokerId = currentUser[0].brokerId;
      }
    }

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      // NEW: Build base query with role-based filtering for single lead
      let singleLeadQuery = db.select().from(leads).where(eq(leads.id, parseInt(id)));
      
      // Apply broker filtering if user is a broker
      if (userRole === 'broker' && linkedBrokerId) {
        singleLeadQuery = singleLeadQuery.where(
          and(
            eq(leads.id, parseInt(id)),
            eq(leads.brokerId, linkedBrokerId)
          )
        ) as typeof singleLeadQuery;
      }
      
      const lead = await singleLeadQuery.limit(1);
      
      if (lead.length === 0) {
        return NextResponse.json({ 
          error: 'Lead not found',
          code: 'NOT_FOUND'
        }, { status: 404 });
      }

      // Parse tags if present
      const result = lead[0];
      if (result.tags) {
        try {
          result.tags = JSON.parse(result.tags as string);
        } catch (e) {
          result.tags = [];
        }
      }

      return NextResponse.json(result);
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const stage = searchParams.get('stage');
    const source = searchParams.get('source');
    const projectId = searchParams.get('projectId');

    let query = db.select().from(leads);
    const conditions = [];
    
    // NEW: Apply broker filtering for list queries
    if (userRole === 'broker' && linkedBrokerId) {
      conditions.push(eq(leads.brokerId, linkedBrokerId));
    }

    if (search) {
      conditions.push(
        or(
          like(leads.firstName, `%${search}%`),
          like(leads.lastName, `%${search}%`),
          like(leads.email, `%${search}%`)
        )
      );
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { 
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS'
          },
          { status: 400 }
        );
      }
      conditions.push(eq(leads.status, status));
    }

    if (stage) {
      if (!VALID_STAGES.includes(stage)) {
        return NextResponse.json(
          { 
            error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`,
            code: 'INVALID_STAGE'
          },
          { status: 400 }
        );
      }
      conditions.push(eq(leads.stage, stage));
    }

    if (source) conditions.push(eq(leads.source, source));

    if (projectId && !isNaN(parseInt(projectId))) {
      conditions.push(eq(leads.projectId, parseInt(projectId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(leads.createdAt)).limit(limit).offset(offset);

    // Parse tags for all results
    const parsedResults = results.map((lead) => {
      if (lead.tags) {
        try {
          return {
            ...lead,
            tags: JSON.parse(lead.tags as string),
          };
        } catch (e) {
          return {
            ...lead,
            tags: [],
          };
        }
      }
      return lead;
    });

    return NextResponse.json(parsedResults);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      firstName, lastName, email, phone, source, subSource, status = 'new lead', stage = 'new',
      budget, interestedIn, projectId, assignedTo, brokerId, score = 0, tags, notes, followUp,
      lastContactedAt, nextCallDate 
    } = body;

    if (!firstName || !lastName || !email || !phone || !source) {
      return NextResponse.json({ 
        error: 'Missing required fields: firstName, lastName, email, phone, source',
        code: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      }, { status: 400 });
    }

    if (!VALID_SOURCES.includes(source)) {
      return NextResponse.json({ 
        error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}`,
        code: 'INVALID_SOURCE'
      }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    if (!VALID_STAGES.includes(stage)) {
      return NextResponse.json({ 
        error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`,
        code: 'INVALID_STAGE'
      }, { status: 400 });
    }

    if (score !== undefined && !validateScore(score)) {
      return NextResponse.json({ 
        error: 'Score must be an integer between 0 and 100',
        code: 'INVALID_SCORE'
      }, { status: 400 });
    }

    if (projectId !== undefined && projectId !== null && isNaN(parseInt(projectId))) {
      return NextResponse.json({ 
        error: 'Invalid projectId. Must be a valid integer',
        code: 'INVALID_PROJECT_ID'
      }, { status: 400 });
    }

    if (assignedTo !== undefined && assignedTo !== null && isNaN(parseInt(assignedTo))) {
      return NextResponse.json({ 
        error: 'Invalid assignedTo. Must be a valid integer',
        code: 'INVALID_ASSIGNED_TO'
      }, { status: 400 });
    }

    if (brokerId !== undefined && brokerId !== null && isNaN(parseInt(brokerId))) {
      return NextResponse.json({ 
        error: 'Invalid brokerId. Must be a valid integer',
        code: 'INVALID_BROKER_ID'
      }, { status: 400 });
    }

    if (lastContactedAt && !validateISOTimestamp(lastContactedAt)) {
      return NextResponse.json({ 
        error: 'Invalid lastContactedAt format. Must be ISO 8601 timestamp',
        code: 'INVALID_LAST_CONTACTED_AT'
      }, { status: 400 });
    }

    if (nextCallDate && !validateISOTimestamp(nextCallDate)) {
      return NextResponse.json({ 
        error: 'Invalid nextCallDate format. Must be ISO 8601 timestamp',
        code: 'INVALID_NEXT_CALL_DATE'
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const insertData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      source,
      status,
      stage,
      score,
      createdAt: now,
      updatedAt: now
    };

    if (subSource) insertData.subSource = subSource.trim();
    if (budget) insertData.budget = budget;
    if (interestedIn) insertData.interestedIn = interestedIn;
    if (projectId !== undefined && projectId !== null) insertData.projectId = parseInt(projectId);
    if (assignedTo !== undefined && assignedTo !== null) insertData.assignedTo = parseInt(assignedTo);
    if (brokerId !== undefined && brokerId !== null) insertData.brokerId = parseInt(brokerId);
    if (tags) insertData.tags = JSON.stringify(tags);
    if (notes) insertData.notes = notes;
    if (followUp) insertData.followUp = followUp;
    if (lastContactedAt) insertData.lastContactedAt = lastContactedAt;
    if (nextCallDate) insertData.nextCallDate = nextCallDate;

    const newLead = await db.insert(leads).values(insertData).returning();

    // Log activity
    await logActivity({
      action: 'created',
      entityType: 'lead',
      entityId: newLead[0].id,
      entityName: `${firstName.trim()} ${lastName.trim()}`,
      description: `Lead created - ${firstName.trim()} ${lastName.trim()}`,
      metadata: { source, status, stage },
      userId: assignedTo || undefined,
      leadId: newLead[0].id,
    });

    // Parse tags in response
    const result = newLead[0];
    if (result.tags) {
      try {
        result.tags = JSON.parse(result.tags as string);
      } catch (e) {
        result.tags = [];
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const existing = await db.select().from(leads).where(eq(leads.id, parseInt(id))).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Lead not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    const body = await request.json();
    const updates: any = { 
      updatedAt: new Date().toISOString() 
    };

    // Track changes for activity logging
    const changes: Array<{ field: string; from: any; to: any }> = [];

    if (body.firstName !== undefined) {
      if (typeof body.firstName !== 'string' || body.firstName.trim() === '') {
        return NextResponse.json({ 
          error: 'firstName must be a non-empty string',
          code: 'INVALID_FIRST_NAME'
        }, { status: 400 });
      }
      if (existing[0].firstName !== body.firstName.trim()) {
        changes.push({ field: 'firstName', from: existing[0].firstName, to: body.firstName.trim() });
      }
      updates.firstName = body.firstName.trim();
    }

    if (body.lastName !== undefined) {
      if (typeof body.lastName !== 'string' || body.lastName.trim() === '') {
        return NextResponse.json({ 
          error: 'lastName must be a non-empty string',
          code: 'INVALID_LAST_NAME'
        }, { status: 400 });
      }
      if (existing[0].lastName !== body.lastName.trim()) {
        changes.push({ field: 'lastName', from: existing[0].lastName, to: body.lastName.trim() });
      }
      updates.lastName = body.lastName.trim();
    }

    if (body.email !== undefined) {
      if (!validateEmail(body.email)) {
        return NextResponse.json({ 
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        }, { status: 400 });
      }
      if (existing[0].email !== body.email.trim().toLowerCase()) {
        changes.push({ field: 'email', from: existing[0].email, to: body.email.trim().toLowerCase() });
      }
      updates.email = body.email.trim().toLowerCase();
    }

    if (body.phone !== undefined) {
      if (typeof body.phone !== 'string' || body.phone.trim() === '') {
        return NextResponse.json({ 
          error: 'phone must be a non-empty string',
          code: 'INVALID_PHONE'
        }, { status: 400 });
      }
      if (existing[0].phone !== body.phone.trim()) {
        changes.push({ field: 'phone', from: existing[0].phone, to: body.phone.trim() });
      }
      updates.phone = body.phone.trim();
    }

    if (body.source !== undefined) {
      if (!VALID_SOURCES.includes(body.source)) {
        return NextResponse.json({ 
          error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}`,
          code: 'INVALID_SOURCE'
        }, { status: 400 });
      }
      if (existing[0].source !== body.source) {
        changes.push({ field: 'source', from: existing[0].source, to: body.source });
      }
      updates.source = body.source;
    }

    if (body.subSource !== undefined) {
      updates.subSource = body.subSource ? body.subSource.trim() : null;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS'
        }, { status: 400 });
      }
      if (existing[0].status !== body.status) {
        changes.push({ field: 'status', from: existing[0].status, to: body.status });
      }
      updates.status = body.status;
    }

    // Track stage changes separately for special logging
    let stageChanged = false;
    let oldStage = existing[0].stage;
    let newStage = existing[0].stage;
    
    if (body.stage !== undefined) {
      if (!VALID_STAGES.includes(body.stage)) {
        return NextResponse.json({ 
          error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}`,
          code: 'INVALID_STAGE'
        }, { status: 400 });
      }
      if (existing[0].stage !== body.stage) {
        stageChanged = true;
        oldStage = existing[0].stage;
        newStage = body.stage;
      }
      updates.stage = body.stage;
    }

    if (body.budget !== undefined) {
      if (existing[0].budget !== body.budget) {
        changes.push({ field: 'budget', from: existing[0].budget, to: body.budget });
      }
      updates.budget = body.budget;
    }
    
    if (body.interestedIn !== undefined) {
      if (existing[0].interestedIn !== body.interestedIn) {
        changes.push({ field: 'interestedIn', from: existing[0].interestedIn, to: body.interestedIn });
      }
      updates.interestedIn = body.interestedIn;
    }

    if (body.projectId !== undefined) {
      if (body.projectId === null) {
        updates.projectId = null;
      } else if (isNaN(parseInt(body.projectId))) {
        return NextResponse.json({ 
          error: 'Invalid projectId. Must be a valid integer',
          code: 'INVALID_PROJECT_ID'
        }, { status: 400 });
      } else {
        updates.projectId = parseInt(body.projectId);
      }
    }

    if (body.assignedTo !== undefined) {
      if (body.assignedTo === null) {
        updates.assignedTo = null;
      } else if (isNaN(parseInt(body.assignedTo))) {
        return NextResponse.json({ 
          error: 'Invalid assignedTo. Must be a valid integer',
          code: 'INVALID_ASSIGNED_TO'
        }, { status: 400 });
      } else {
        updates.assignedTo = parseInt(body.assignedTo);
      }
    }

    if (body.brokerId !== undefined) {
      if (body.brokerId === null) {
        updates.brokerId = null;
      } else if (isNaN(parseInt(body.brokerId))) {
        return NextResponse.json({ 
          error: 'Invalid brokerId. Must be a valid integer',
          code: 'INVALID_BROKER_ID'
        }, { status: 400 });
      } else {
        updates.brokerId = parseInt(body.brokerId);
      }
    }

    if (body.score !== undefined) {
      if (!validateScore(body.score)) {
        return NextResponse.json({ 
          error: 'Score must be an integer between 0 and 100',
          code: 'INVALID_SCORE'
        }, { status: 400 });
      }
      updates.score = body.score;
    }

    if (body.tags !== undefined) {
      if (body.tags && Array.isArray(body.tags)) {
        updates.tags = JSON.stringify(body.tags);
      } else {
        updates.tags = null;
      }
    }

    if (body.notes !== undefined) updates.notes = body.notes;
    
    if (body.followUp !== undefined) updates.followUp = body.followUp;

    if (body.lastContactedAt !== undefined) {
      if (body.lastContactedAt === null) {
        updates.lastContactedAt = null;
      } else if (!validateISOTimestamp(body.lastContactedAt)) {
        return NextResponse.json({ 
          error: 'Invalid lastContactedAt format. Must be ISO 8601 timestamp',
          code: 'INVALID_LAST_CONTACTED_AT'
        }, { status: 400 });
      } else {
        updates.lastContactedAt = body.lastContactedAt;
      }
    }

    if (body.nextCallDate !== undefined) {
      if (body.nextCallDate === null) {
        updates.nextCallDate = null;
      } else if (!validateISOTimestamp(body.nextCallDate)) {
        return NextResponse.json({ 
          error: 'Invalid nextCallDate format. Must be ISO 8601 timestamp',
          code: 'INVALID_NEXT_CALL_DATE'
        }, { status: 400 });
      } else {
        updates.nextCallDate = body.nextCallDate;
      }
    }

    const updated = await db.update(leads).set(updates).where(eq(leads.id, parseInt(id))).returning();

    // Log stage change activity (special case)
    if (stageChanged) {
      await logActivity({
        action: 'stage-changed',
        entityType: 'lead',
        entityId: parseInt(id),
        entityName: `${updated[0].firstName} ${updated[0].lastName}`,
        description: `Lead stage changed from ${oldStage} to ${newStage}`,
        metadata: { from: oldStage, to: newStage },
        userId: updated[0].assignedTo || undefined,
        leadId: parseInt(id),
      });
    }

    // Log general update activity if other fields changed
    if (changes.length > 0) {
      const fieldsList = changes.map(c => c.field).join(', ');
      await logActivity({
        action: 'updated',
        entityType: 'lead',
        entityId: parseInt(id),
        entityName: `${updated[0].firstName} ${updated[0].lastName}`,
        description: `Lead updated - fields changed: ${fieldsList}`,
        metadata: { changes },
        userId: updated[0].assignedTo || undefined,
        leadId: parseInt(id),
      });
    }

    // Parse tags in response
    const result = updated[0];
    if (result.tags) {
      try {
        result.tags = JSON.parse(result.tags as string);
      } catch (e) {
        result.tags = [];
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const existing = await db.select().from(leads).where(eq(leads.id, parseInt(id))).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Lead not found',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    const leadName = `${existing[0].firstName} ${existing[0].lastName}`;
    const assignedTo = existing[0].assignedTo;

    const deleted = await db.delete(leads).where(eq(leads.id, parseInt(id))).returning();

    // Log deletion activity
    await logActivity({
      action: 'deleted',
      entityType: 'lead',
      entityId: parseInt(id),
      entityName: leadName,
      description: `Lead deleted - ${leadName}`,
      metadata: { reason: 'manual_deletion' },
      userId: assignedTo || undefined,
      leadId: null, // No leadId since it's deleted
    });

    // Parse tags in response
    const result = deleted[0];
    if (result.tags) {
      try {
        result.tags = JSON.parse(result.tags as string);
      } catch (e) {
        result.tags = [];
      }
    }

    return NextResponse.json({ 
      message: 'Lead deleted successfully',
      lead: result
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}