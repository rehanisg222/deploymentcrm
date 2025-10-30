import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { campaigns } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

const VALID_TYPES = ['email', 'sms', 'social'];
const VALID_STATUSES = ['draft', 'active', 'paused', 'completed'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const campaign = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, parseInt(id)))
        .limit(1);

      if (campaign.length === 0) {
        return NextResponse.json(
          { error: 'Campaign not found', code: 'CAMPAIGN_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Parse leads JSON if present
      const result = campaign[0];
      if (result.leads) {
        try {
          result.leads = JSON.parse(result.leads as string);
        } catch (e) {
          result.leads = [];
        }
      }

      return NextResponse.json(result, { status: 200 });
    }

    // List with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    let query = db.select().from(campaigns);

    // Build conditions array
    const conditions = [];

    // Search condition
    if (search) {
      conditions.push(like(campaigns.name, `%${search}%`));
    }

    // Type filter
    if (type) {
      if (!VALID_TYPES.includes(type)) {
        return NextResponse.json(
          { error: 'Invalid type filter', code: 'INVALID_TYPE' },
          { status: 400 }
        );
      }
      conditions.push(eq(campaigns.type, type));
    }

    // Status filter
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status filter', code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
      conditions.push(eq(campaigns.status, status));
    }

    // Apply conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = sort === 'name' ? campaigns.name : campaigns.createdAt;
    query = query.orderBy(order === 'asc' ? sortColumn : desc(sortColumn));

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

    // Parse leads JSON for all results
    const parsedResults = results.map((campaign) => {
      if (campaign.leads) {
        try {
          return {
            ...campaign,
            leads: JSON.parse(campaign.leads as string),
          };
        } catch (e) {
          return {
            ...campaign,
            leads: [],
          };
        }
      }
      return campaign;
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
    const { name, type, status, budget, spent, leads, conversions, startDate, endDate } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!type || typeof type !== 'string') {
      return NextResponse.json(
        { error: 'Type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    // Validate type
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${VALID_TYPES.join(', ')}`, code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    // Validate status if provided
    const campaignStatus = status || 'draft';
    if (!VALID_STATUSES.includes(campaignStatus)) {
      return NextResponse.json(
        { error: `Status must be one of: ${VALID_STATUSES.join(', ')}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // Validate leads if provided
    let leadsJson = null;
    if (leads !== undefined && leads !== null) {
      if (!Array.isArray(leads)) {
        return NextResponse.json(
          { error: 'Leads must be an array', code: 'INVALID_LEADS' },
          { status: 400 }
        );
      }
      leadsJson = JSON.stringify(leads);
    }

    // Validate conversions if provided
    const campaignConversions = conversions !== undefined ? conversions : 0;
    if (typeof campaignConversions !== 'number' || campaignConversions < 0) {
      return NextResponse.json(
        { error: 'Conversions must be a non-negative integer', code: 'INVALID_CONVERSIONS' },
        { status: 400 }
      );
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData: any = {
      name: name.trim(),
      type,
      status: campaignStatus,
      spent: spent || '0',
      conversions: campaignConversions,
      createdAt: now,
      updatedAt: now,
    };

    if (budget) insertData.budget = budget;
    if (leadsJson) insertData.leads = leadsJson;
    if (startDate) insertData.startDate = startDate;
    if (endDate) insertData.endDate = endDate;

    const newCampaign = await db.insert(campaigns).values(insertData).returning();

    // Parse leads JSON in response
    const result = newCampaign[0];
    if (result.leads) {
      try {
        result.leads = JSON.parse(result.leads as string);
      } catch (e) {
        result.leads = [];
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

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if campaign exists
    const existing = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found', code: 'CAMPAIGN_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, type, status, budget, spent, leads, conversions, startDate, endDate } = body;

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    // Validate and add name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name must be a non-empty string', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    // Validate and add type if provided
    if (type !== undefined) {
      if (!VALID_TYPES.includes(type)) {
        return NextResponse.json(
          { error: `Type must be one of: ${VALID_TYPES.join(', ')}`, code: 'INVALID_TYPE' },
          { status: 400 }
        );
      }
      updates.type = type;
    }

    // Validate and add status if provided
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${VALID_STATUSES.join(', ')}`, code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    // Add optional fields if provided
    if (budget !== undefined) updates.budget = budget;
    if (spent !== undefined) updates.spent = spent;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;

    // Validate and add leads if provided
    if (leads !== undefined) {
      if (leads !== null && !Array.isArray(leads)) {
        return NextResponse.json(
          { error: 'Leads must be an array', code: 'INVALID_LEADS' },
          { status: 400 }
        );
      }
      updates.leads = leads ? JSON.stringify(leads) : null;
    }

    // Validate and add conversions if provided
    if (conversions !== undefined) {
      if (typeof conversions !== 'number' || conversions < 0) {
        return NextResponse.json(
          { error: 'Conversions must be a non-negative integer', code: 'INVALID_CONVERSIONS' },
          { status: 400 }
        );
      }
      updates.conversions = conversions;
    }

    const updated = await db
      .update(campaigns)
      .set(updates)
      .where(eq(campaigns.id, parseInt(id)))
      .returning();

    // Parse leads JSON in response
    const result = updated[0];
    if (result.leads) {
      try {
        result.leads = JSON.parse(result.leads as string);
      } catch (e) {
        result.leads = [];
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if campaign exists
    const existing = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Campaign not found', code: 'CAMPAIGN_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(campaigns)
      .where(eq(campaigns.id, parseInt(id)))
      .returning();

    // Parse leads JSON in response
    const result = deleted[0];
    if (result.leads) {
      try {
        result.leads = JSON.parse(result.leads as string);
      } catch (e) {
        result.leads = [];
      }
    }

    return NextResponse.json(
      {
        message: 'Campaign deleted successfully',
        campaign: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}