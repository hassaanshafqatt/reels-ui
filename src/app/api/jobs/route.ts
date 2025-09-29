import { NextRequest, NextResponse } from 'next/server';
import { jobOperations, sessionOperations } from '@/lib/database';
import { jwtVerify } from 'jose';
import { verifyAuth } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random'
);

// Helper function to verify JWT token (kept for compatibility with any
// direct-token forwarding scenarios elsewhere), but primary auth should use
// verifyAuth(request).
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// GET - Get user's jobs
export async function GET(request: NextRequest) {
  try {
    // Use shared verifyAuth helper (supports auth header and cookie refresh)
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify session exists for this user
    const session = sessionOperations.findByUserId(user.id);
    if (!session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 401 }
      );
    }

    const jobs = jobOperations.getByUserId(user.id);

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new job
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify session exists for this user
    const session = sessionOperations.findByUserId(user.id);
    if (!session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 401 }
      );
    }

    const { jobId, category, type } = await request.json();

    if (!jobId || !category || !type) {
      return NextResponse.json(
        { message: 'Job ID, category, and type are required' },
        { status: 400 }
      );
    }

    const id = jobOperations.create(user.id as string, {
      jobId,
      category,
      type,
    });

    // Clean old jobs for this user
    jobOperations.cleanOldJobs(user.id as string);

    return NextResponse.json({
      success: true,
      id,
      message: 'Job created successfully',
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Clear jobs for user (all or by category)
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify session exists for this user
    const session = sessionOperations.findByUserId(user.id);
    if (!session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 401 }
      );
    }

    // Get category from query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Clear jobs for this user (all or by category)
    const deletedCount = category
      ? jobOperations.clearByCategoryAndUserId(category, user.id as string)
      : jobOperations.clearAllByUserId(user.id as string);

    const message = category
      ? `Job history cleared successfully for category: ${category}`
      : 'All job history cleared successfully';

    return NextResponse.json({
      success: true,
      deletedCount,
      message,
      category: category || null,
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
