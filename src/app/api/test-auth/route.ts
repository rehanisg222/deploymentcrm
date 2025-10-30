import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, account } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Query user and account
    const userData = await db
      .select({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        emailVerified: user.emailVerified,
        accountPassword: account.password,
        accountId: account.accountId,
        providerId: account.providerId,
      })
      .from(user)
      .leftJoin(account, eq(user.id, account.userId))
      .where(eq(user.email, email))
      .limit(1);

    if (!userData || userData.length === 0) {
      return NextResponse.json(
        { error: 'User not found', email },
        { status: 404 }
      );
    }

    const userRecord = userData[0];

    if (!userRecord.accountPassword) {
      return NextResponse.json(
        { error: 'No password set for this account' },
        { status: 400 }
      );
    }

    // Test password comparison
    const isPasswordValid = await bcrypt.compare(password, userRecord.accountPassword);

    return NextResponse.json({
      success: true,
      passwordMatch: isPasswordValid,
      userFound: true,
      userDetails: {
        id: userRecord.userId,
        email: userRecord.userEmail,
        name: userRecord.userName,
        emailVerified: userRecord.emailVerified,
        accountId: userRecord.accountId,
        providerId: userRecord.providerId,
        passwordHashPrefix: userRecord.accountPassword?.substring(0, 10),
      }
    });

  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}