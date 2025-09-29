import { NextRequest } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { userOperations, sessionOperations } from './database';

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

export async function verifyAuth(
  request?: NextRequest
): Promise<AuthUser | null> {
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
      // No access token present — try HttpOnly refresh token session as a fallback
      try {
        const refreshToken = request
          ? // when request is provided, read from its cookies
            request.cookies.get('refresh_token')?.value
          : // server-side cookies()
            (await cookies()).get('refresh_token')?.value;

        if (refreshToken) {
          const session = sessionOperations.findByToken(refreshToken as string);
          if (session && session.user_id) {
            return {
              id: String(session.user_id),
              email: String(session.email),
            };
          }
        }
      } catch {
        // ignore and fallthrough to return null
      }

      return null;
    }

    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);

      // Enforce that there is an active session for this user. This keeps
      // behavior consistent with other routes that expect a session record
      // (created on login) and prevents accepting arbitrary valid JWTs without
      // an associated session.
      try {
        const session = sessionOperations.findByUserId(
          payload.userId as string
        );
        if (session && session.user_id) {
          // Successful header token auth with active session
          if (process.env.NODE_ENV !== 'production') {
            console.debug(
              'verifyAuth: header token verified and session found'
            );
          }
          return {
            id: payload.userId as string,
            email: payload.email as string,
          };
        }
        // No session found for this userId — fall through to refresh-token
        if (process.env.NODE_ENV !== 'production') {
          console.debug(
            'verifyAuth: header token valid but no active session found'
          );
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug(
            'verifyAuth: error checking session for header token',
            err
          );
        }
      }

      // If we reach here the header token either failed verification or no
      // active session was found. Try cookie-based refresh-token session as a
      // fallback so users with a valid refresh cookie can still authenticate.
      try {
        const refreshToken = request
          ? // when request is provided, read from its cookies
            request.cookies.get('refresh_token')?.value
          : // server-side cookies()
            (await cookies()).get('refresh_token')?.value;

        if (refreshToken) {
          const session = sessionOperations.findByToken(refreshToken as string);
          if (session && session.user_id) {
            if (process.env.NODE_ENV !== 'production') {
              console.debug(
                'verifyAuth: authenticated via refresh-token session'
              );
            }
            return {
              id: String(session.user_id),
              email: String(session.email),
            };
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('verifyAuth: error during refresh-token fallback', err);
        }
      }

      return null;
    } catch (err) {
      // Header token verification failed entirely — try refresh-token session
      if (process.env.NODE_ENV !== 'production') {
        console.debug('verifyAuth: header token verification failed', err);
      }

      try {
        const refreshToken = request
          ? // when request is provided, read from its cookies
            request.cookies.get('refresh_token')?.value
          : // server-side cookies()
            (await cookies()).get('refresh_token')?.value;

        if (refreshToken) {
          const session = sessionOperations.findByToken(refreshToken as string);
          if (session && session.user_id) {
            if (process.env.NODE_ENV !== 'production') {
              console.debug(
                'verifyAuth: authenticated via refresh-token session after header failure'
              );
            }
            return {
              id: String(session.user_id),
              email: String(session.email),
            };
          }
        }
      } catch (err2) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug(
            'verifyAuth: error during refresh-token fallback after header failure',
            err2
          );
        }
      }

      return null;
    }
  } catch {
    return null;
  }
}

export async function createToken(user: AuthUser): Promise<string> {
  const token = await new jose.SignJWT({
    userId: user.id,
    email: user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

export async function verifyAuthWithAdmin(
  request?: NextRequest
): Promise<AuthUserWithAdmin | null> {
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
      is_admin: user.is_admin,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(
  request?: NextRequest
): Promise<AuthUserWithAdmin> {
  const user = await verifyAuthWithAdmin(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  if (!user.is_admin) {
    throw new Error('Admin access required');
  }
  return user;
}
