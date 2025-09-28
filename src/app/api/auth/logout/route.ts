import { NextRequest, NextResponse } from 'next/server';
import { sessionOperations } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Read refresh token from cookie (if present) and delete session
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(^|;)\s*refresh_token=([^;]+)/);
    const refreshToken = match ? match[2] : null;

    if (refreshToken) {
      sessionOperations.delete(refreshToken);
    }

    sessionOperations.cleanExpired();

    // Clear refresh cookie
    const clearCookie =
      'refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure';

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { headers: { 'Set-Cookie': clearCookie } }
    );
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
