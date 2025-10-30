import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { brokers } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single broker by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const broker = await db.select()
        .from(brokers)
        .where(eq(brokers.id, parseInt(id)))
        .limit(1);

      if (broker.length === 0) {
        return NextResponse.json({ 
          error: 'Broker not found',
          code: 'BROKER_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(broker[0], { status: 200 });
    }

    // List brokers with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const isActiveParam = searchParams.get('isActive');
    const company = searchParams.get('company');

    let query = db.select().from(brokers);
    const conditions = [];

    // Search across name, company, email
    if (search) {
      conditions.push(
        or(
          like(brokers.name, `%${search}%`),
          like(brokers.company, `%${search}%`),
          like(brokers.email, `%${search}%`)
        )
      );
    }

    // Filter by isActive
    if (isActiveParam !== null) {
      const isActive = isActiveParam === 'true';
      conditions.push(eq(brokers.isActive, isActive));
    }

    // Filter by company
    if (company) {
      conditions.push(eq(brokers.company, company));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(brokers.joinedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, company, email, phone, commission, totalDeals, totalRevenue, isActive, joinedAt } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ 
        error: "Name is required and must be a non-empty string",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!company || typeof company !== 'string' || company.trim() === '') {
      return NextResponse.json({ 
        error: "Company is required and must be a non-empty string",
        code: "MISSING_COMPANY" 
      }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ 
        error: "Email is required and must be a non-empty string",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }

    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return NextResponse.json({ 
        error: "Phone is required and must be a non-empty string",
        code: "MISSING_PHONE" 
      }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedCompany = company.trim();
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPhone = phone.trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL_FORMAT" 
      }, { status: 400 });
    }

    // Check email uniqueness
    const existingBroker = await db.select()
      .from(brokers)
      .where(eq(brokers.email, sanitizedEmail))
      .limit(1);

    if (existingBroker.length > 0) {
      return NextResponse.json({ 
        error: "Email already exists",
        code: "EMAIL_ALREADY_EXISTS" 
      }, { status: 400 });
    }

    // Validate totalDeals if provided
    if (totalDeals !== undefined) {
      const parsedTotalDeals = parseInt(totalDeals);
      if (isNaN(parsedTotalDeals) || parsedTotalDeals < 0) {
        return NextResponse.json({ 
          error: "Total deals must be a non-negative integer",
          code: "INVALID_TOTAL_DEALS" 
        }, { status: 400 });
      }
    }

    // Validate isActive if provided
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return NextResponse.json({ 
        error: "isActive must be a boolean",
        code: "INVALID_IS_ACTIVE" 
      }, { status: 400 });
    }

    // Prepare insert data with defaults
    const insertData = {
      name: sanitizedName,
      company: sanitizedCompany,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      commission: commission ?? null,
      totalDeals: totalDeals !== undefined ? parseInt(totalDeals) : 0,
      totalRevenue: totalRevenue ?? '0',
      isActive: isActive !== undefined ? isActive : true,
      joinedAt: joinedAt ?? new Date().toISOString()
    };

    const newBroker = await db.insert(brokers)
      .values(insertData)
      .returning();

    return NextResponse.json(newBroker[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if broker exists
    const existingBroker = await db.select()
      .from(brokers)
      .where(eq(brokers.id, parseInt(id)))
      .limit(1);

    if (existingBroker.length === 0) {
      return NextResponse.json({ 
        error: 'Broker not found',
        code: 'BROKER_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const updates = {};

    // Validate and sanitize name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return NextResponse.json({ 
          error: "Name must be a non-empty string",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    // Validate and sanitize company if provided
    if (body.company !== undefined) {
      if (typeof body.company !== 'string' || body.company.trim() === '') {
        return NextResponse.json({ 
          error: "Company must be a non-empty string",
          code: "INVALID_COMPANY" 
        }, { status: 400 });
      }
      updates.company = body.company.trim();
    }

    // Validate and sanitize email if provided
    if (body.email !== undefined) {
      if (typeof body.email !== 'string' || body.email.trim() === '') {
        return NextResponse.json({ 
          error: "Email must be a non-empty string",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }

      const sanitizedEmail = body.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        return NextResponse.json({ 
          error: "Invalid email format",
          code: "INVALID_EMAIL_FORMAT" 
        }, { status: 400 });
      }

      // Check email uniqueness (exclude current broker)
      const emailExists = await db.select()
        .from(brokers)
        .where(and(
          eq(brokers.email, sanitizedEmail),
          eq(brokers.id, parseInt(id))
        ))
        .limit(1);

      const otherBrokerWithEmail = await db.select()
        .from(brokers)
        .where(eq(brokers.email, sanitizedEmail))
        .limit(1);

      if (otherBrokerWithEmail.length > 0 && otherBrokerWithEmail[0].id !== parseInt(id)) {
        return NextResponse.json({ 
          error: "Email already exists",
          code: "EMAIL_ALREADY_EXISTS" 
        }, { status: 400 });
      }

      updates.email = sanitizedEmail;
    }

    // Validate and sanitize phone if provided
    if (body.phone !== undefined) {
      if (typeof body.phone !== 'string' || body.phone.trim() === '') {
        return NextResponse.json({ 
          error: "Phone must be a non-empty string",
          code: "INVALID_PHONE" 
        }, { status: 400 });
      }
      updates.phone = body.phone.trim();
    }

    // Handle optional fields
    if (body.commission !== undefined) {
      updates.commission = body.commission;
    }

    if (body.totalDeals !== undefined) {
      const parsedTotalDeals = parseInt(body.totalDeals);
      if (isNaN(parsedTotalDeals) || parsedTotalDeals < 0) {
        return NextResponse.json({ 
          error: "Total deals must be a non-negative integer",
          code: "INVALID_TOTAL_DEALS" 
        }, { status: 400 });
      }
      updates.totalDeals = parsedTotalDeals;
    }

    if (body.totalRevenue !== undefined) {
      updates.totalRevenue = body.totalRevenue;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json({ 
          error: "isActive must be a boolean",
          code: "INVALID_IS_ACTIVE" 
        }, { status: 400 });
      }
      updates.isActive = body.isActive;
    }

    if (body.joinedAt !== undefined) {
      updates.joinedAt = body.joinedAt;
    }

    // If no updates provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingBroker[0], { status: 200 });
    }

    const updatedBroker = await db.update(brokers)
      .set(updates)
      .where(eq(brokers.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedBroker[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if broker exists
    const existingBroker = await db.select()
      .from(brokers)
      .where(eq(brokers.id, parseInt(id)))
      .limit(1);

    if (existingBroker.length === 0) {
      return NextResponse.json({ 
        error: 'Broker not found',
        code: 'BROKER_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(brokers)
      .where(eq(brokers.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Broker deleted successfully',
      broker: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}