import { NextRequest, NextResponse } from 'next/server';
import { jobOperations, sessionOperations } from '@/lib/database';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random'
);

// Helper function to verify JWT token
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

// GET - Get user's jobs
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Verify session exists
    const session = sessionOperations.findByToken(token);
    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    }

    const jobs = jobOperations.getByUserId(payload.userId as string);
    
    return NextResponse.json({
      success: true,
      jobs
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new job
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Verify session exists
    const session = sessionOperations.findByToken(token);
    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    }

    const { jobId, category, type } = await request.json();

    if (!jobId || !category || !type) {
      return NextResponse.json(
        { message: 'Job ID, category, and type are required' },
        { status: 400 }
      );
    }

    const id = jobOperations.create(payload.userId as string, { jobId, category, type });
    
    // Clean old jobs for this user
    jobOperations.cleanOldJobs(payload.userId as string);

    return NextResponse.json({
      success: true,
      id,
      message: 'Job created successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Clear jobs for user (all or by category)
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Verify session exists
    const session = sessionOperations.findByToken(token);
    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    }

    // Get category from query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Clear jobs for this user (all or by category)
    const deletedCount = category 
      ? jobOperations.clearByCategoryAndUserId(category, payload.userId as string)
      : jobOperations.clearAllByUserId(payload.userId as string);

    const message = category 
      ? `Job history cleared successfully for category: ${category}`
      : 'All job history cleared successfully';

    return NextResponse.json({
      success: true,
      deletedCount,
      message,
      category: category || null
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
