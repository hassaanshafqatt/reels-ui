import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { sessionOperations, userOperations } from '@/lib/database';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random'
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    try {
      // Verify the JWT token
      const { payload } = await jwtVerify(token, JWT_SECRET);
      void payload;

      // Check if session exists in database and is valid
      const session = sessionOperations.findByToken(token);

      if (!session) {
        return NextResponse.json(
          {
            success: false,
            valid: false,
            message: 'Session not found or expired',
          },
          { status: 401 }
        );
      }

      // Get fresh user data
      const user = userOperations.findById(session.user_id as string);

      if (!user) {
        return NextResponse.json(
          { success: false, valid: false, message: 'User not found' },
          { status: 401 }
        );
      }

      // Remove password hash from user data
      const { password_hash, ...userWithoutPassword } = user;
      // password_hash intentionally omitted
      void password_hash;

      return NextResponse.json({
        success: true,
        valid: true,
        user: {
          ...userWithoutPassword,
          createdAt: user.created_at,
        },
      });
    } catch {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
