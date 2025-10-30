import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, account, session } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'MISSING_CREDENTIALS', message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Query user and account - include role and brokerId
    const userData = await db
      .select({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        emailVerified: user.emailVerified,
        userImage: user.image,
        userRole: user.role,
        userBrokerId: user.brokerId,
        accountPassword: account.password,
      })
      .from(user)
      .leftJoin(account, eq(user.id, account.userId))
      .where(eq(user.email, email))
      .limit(1);

    if (!userData || userData.length === 0 || !userData[0].accountPassword) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    const userRecord = userData[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userRecord.accountPassword);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = randomUUID();
    const sessionId = randomUUID();
    const expiresIn = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days or 7 days
    const expiresAtDate = new Date(Date.now() + expiresIn * 1000);
    const nowDate = new Date();

    await db.insert(session).values({
      id: sessionId,
      token: sessionToken,
      userId: userRecord.userId,
      expiresAt: expiresAtDate,
      createdAt: nowDate,
      updatedAt: nowDate,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    // Return success with user data including role and brokerId
    const response = NextResponse.json({
      user: {
        id: userRecord.userId,
        name: userRecord.userName,
        email: userRecord.userEmail,
        emailVerified: userRecord.emailVerified,
        image: userRecord.userImage,
        role: userRecord.userRole,
        brokerId: userRecord.userBrokerId,
      },
      session: {
        token: sessionToken,
        expiresAt: expiresAtDate.toISOString(),
      }
    });

    // Set cookie
    response.cookies.set('better-auth.session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/',
    });

    // Also set header for client-side token storage
    response.headers.set('set-auth-token', sessionToken);

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        error: { 
          code: 'SERVER_ERROR',
          message: 'An error occurred during login',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}