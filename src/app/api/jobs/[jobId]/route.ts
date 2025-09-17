import { NextRequest, NextResponse } from 'next/server';
import { jobOperations, sessionOperations } from '@/lib/database';
import { jwtVerify } from 'jose';

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

// PUT - Update job status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
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
    if (!job || job.user_id !== payload.userId) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    }

    jobOperations.updateStatus(jobId, status, resultUrl, errorMessage, caption);

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
