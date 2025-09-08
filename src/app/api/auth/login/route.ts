import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { userOperations, sessionOperations, passwordUtils } from '@/lib/database';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random'
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('Login attempt:', { email, password: password ? '[REDACTED]' : 'missing' });

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user in database
    const user = userOperations.findByEmail(email);
    
    console.log('User found:', !!user);

    if (!user) {
      console.log('User not found for email:', email);
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await passwordUtils.verify(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({ 
      userId: user.id, 
      email: user.email 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Store session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    const sessionResult = sessionOperations.create(user.id, token, expiresAt);
    
    if (!sessionResult.success) {
      console.error('Failed to create session:', sessionResult.error);
      return NextResponse.json(
        { message: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Return user data (without password hash) and token
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      token,
      user: {
        ...userWithoutPassword,
        createdAt: user.created_at
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
