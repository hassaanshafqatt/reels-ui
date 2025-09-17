import { NextRequest } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { userOperations } from './database';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthUserWithAdmin extends AuthUser {
  is_admin: boolean;
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

export async function verifyAuthWithAdmin(request?: NextRequest): Promise<AuthUserWithAdmin | null> {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return null;
    }

    // Get user details from database to check admin status
    const user = userOperations.findById(authUser.id);
    if (!user) {
      return null;
    }

    return {
      id: authUser.id,
      email: authUser.email,
      is_admin: user.is_admin
    };
  } catch (error) {
    return null;
  }
}

export async function requireAdmin(request?: NextRequest): Promise<AuthUserWithAdmin> {
  const user = await verifyAuthWithAdmin(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  if (!user.is_admin) {
    throw new Error('Admin access required');
  }
  return user;
}
