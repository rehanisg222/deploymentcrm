import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, brokers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const brokerId = searchParams.get('brokerId');

    // Validate userId
    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'userId is required',
          code: 'MISSING_USER_ID' 
        },
        { status: 400 }
      );
    }

    // Validate brokerId
    if (!brokerId) {
      return NextResponse.json(
        { 
          error: 'brokerId is required',
          code: 'MISSING_BROKER_ID' 
        },
        { status: 400 }
      );
    }

    // Parse and validate brokerId is a valid integer
    const parsedBrokerId = parseInt(brokerId);
    if (isNaN(parsedBrokerId)) {
      return NextResponse.json(
        { 
          error: 'brokerId must be a valid integer',
          code: 'INVALID_BROKER_ID' 
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Check if broker exists
    const existingBroker = await db.select()
      .from(brokers)
      .where(eq(brokers.id, parsedBrokerId))
      .limit(1);

    if (existingBroker.length === 0) {
      return NextResponse.json(
        { 
          error: 'Broker not found',
          code: 'BROKER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Update user with broker link
    const updatedUser = await db.update(user)
      .set({
        brokerId: parsedBrokerId,
        role: 'broker',
        updatedAt: new Date()
      })
      .where(eq(user.id, userId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'User successfully linked to broker',
      user: {
        id: updatedUser[0].id,
        name: updatedUser[0].name,
        email: updatedUser[0].email,
        role: updatedUser[0].role,
        brokerId: updatedUser[0].brokerId
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET /api/brokers/link-user error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}