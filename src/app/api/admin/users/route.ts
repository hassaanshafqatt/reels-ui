import { NextRequest, NextResponse } from 'next/server';
import { userOperations } from '@/lib/database';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/users - Get all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Require admin access
    await requireAdmin(request);
    
    const users = userOperations.getAll();
    
    return NextResponse.json({
      success: true,
      users
    });

  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (err.message === 'Admin access required') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}