import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import {
  userOperations,
  sessionOperations,
  passwordUtils,
} from '@/lib/database';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random'
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user in database
    const user = userOperations.findByEmail(email);

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password

    const isValidPassword = await passwordUtils.verify(
      password,
      user.password_hash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create short-lived access token (15m)
    const accessToken = await new SignJWT({
      userId: user.id,
      email: user.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(JWT_SECRET);

    // Create refresh token (random UUID) and store as session (7 days)
    const refreshToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const sessionResult = sessionOperations.create(
      user.id,
      refreshToken,
      expiresAt
    );

    if (!sessionResult.success) {
      return NextResponse.json(
        { message: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Set HttpOnly refresh cookie
    const cookieValue = `refresh_token=${refreshToken}; Path=/; Max-Age=${7 * 24 * 60 * 60}; HttpOnly; SameSite=Lax; Secure`;

    // Return user data (without password hash) and access token; server sets refresh cookie
    const { password_hash, ...userWithoutPassword } = user;
    void password_hash;

    return NextResponse.json(
      {
        success: true,
        token: accessToken,
        user: {
          ...userWithoutPassword,
          createdAt: user.created_at,
        },
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': cookieValue,
        },
      }
    );
  } catch {
    // Generic failure
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
