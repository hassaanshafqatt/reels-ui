import { NextRequest } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';

export interface AuthUser {
  id: string;
  email: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random'
);

export async function verifyAuth(request?: NextRequest): Promise<AuthUser | null> {
  try {
    let token: string | undefined;

    if (request) {
      // Try getting token from Authorization header first
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('Got token from Authorization header');
      } else {
        // Try getting from cookies
        const cookieStore = request.cookies;
        token = cookieStore.get('auth_token')?.value;
      }
    } else {
      // Server-side: get from cookies
      const cookieStore = await cookies();
      token = cookieStore.get('auth_token')?.value;
    }

    if (!token) {
      return null;
    }

    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    
    return {
      id: payload.userId as string,
      email: payload.email as string
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function createToken(user: AuthUser): Promise<string> {
  const token = await new jose.SignJWT({
    userId: user.id,
    email: user.email
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}
