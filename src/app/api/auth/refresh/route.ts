import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { sessionOperations } from '@/lib/database';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random'
);

export async function POST(request: NextRequest) {
  try {
    // Read refresh token from cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(^|;)\s*refresh_token=([^;]+)/);
    const refreshToken = match ? match[2] : null;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token required' },
        { status: 401 }
      );
    }

    // Verify session exists for refresh token
    const session = sessionOperations.findByToken(refreshToken);
    if (!session) {
      return NextResponse.json(
        { message: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Create a new access token (15m)
    const newToken = await new SignJWT({
      userId: session.user_id as string,
      email: session.email as string,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(JWT_SECRET);

    return NextResponse.json({ success: true, token: newToken });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
