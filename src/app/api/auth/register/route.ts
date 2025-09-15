import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { userOperations, sessionOperations, passwordUtils } from '@/lib/database';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random'
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { message: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = userOperations.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await passwordUtils.hash(password);

    // Create new user in database
    const createResult = userOperations.create({
      email,
      password_hash: hashedPassword,
      name,
      plan: 'free', // Default plan for new users
      is_admin: false // Default to non-admin for new users
    });

    if (!createResult.success) {
      return NextResponse.json(
        { message: createResult.error || 'Failed to create user' },
        { status: 500 }
      );
    }

    // Get the created user
    const newUser = userOperations.findById(createResult.userId!);
    
    if (!newUser) {
      return NextResponse.json(
        { message: 'Failed to retrieve created user' },
        { status: 500 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({ 
      userId: newUser.id, 
      email: newUser.email 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Store session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    const sessionResult = sessionOperations.create(newUser.id, token, expiresAt);
    
    if (!sessionResult.success) {
      console.error('Failed to create session:', sessionResult.error);
      return NextResponse.json(
        { message: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Return user data (without password hash) and token
    const { password_hash, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      token,
      user: {
        ...userWithoutPassword,
        createdAt: newUser.created_at
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
