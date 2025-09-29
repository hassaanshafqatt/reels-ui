import { NextRequest, NextResponse } from 'next/server';
import { jobOperations, sessionOperations } from '@/lib/database';
import { jwtVerify } from 'jose';
import { verifyAuth } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random'
);

// Helper function to verify JWT token retained for compatibility.
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// PUT - Update job status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
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

    const { status, resultUrl, errorMessage, caption } = await request.json();
    const { jobId } = await params;

    if (!status) {
      return NextResponse.json(
        { message: 'Status is required' },
        { status: 400 }
      );
    }

    // Verify the job belongs to the user
    const job = jobOperations.getByJobId(jobId);
    if (!job || job.user_id !== user.id) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    }

    jobOperations.updateStatus(jobId, status, resultUrl, errorMessage, caption);

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully',
    });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
