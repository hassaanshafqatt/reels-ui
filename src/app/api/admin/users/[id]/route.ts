import { NextRequest, NextResponse } from 'next/server';
import { userOperations } from '@/lib/database';
import { requireAdmin } from '@/lib/auth';

interface UserParams {
  id: string;
}

// PATCH /api/admin/users/[id] - Update user admin status (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<UserParams> }
) {
  try {
    // Require admin access
    const adminUser = await requireAdmin(request);

    const { id } = await params;
    const body = await request.json();
    const { is_admin } = body;

    // Prevent users from removing their own admin access
    if (adminUser.id === id && is_admin === false) {
      return NextResponse.json(
        {
          error: 'You cannot remove your own admin privileges',
        },
        { status: 400 }
      );
    }

    if (typeof is_admin !== 'boolean') {
      return NextResponse.json(
        {
          error: 'is_admin must be a boolean value',
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = userOperations.findById(id);
    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Update admin status
    const result = userOperations.updateAdminStatus(id, is_admin);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to update admin status',
        },
        { status: 500 }
      );
    }

    // Get updated user data
    const updatedUser = userOperations.findById(id);
    const { password_hash, ...userWithoutPassword } = updatedUser!;
    void password_hash;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: is_admin ? 'User promoted to admin' : 'User removed from admin',
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (err.message === 'Admin access required') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update user admin status' },
      { status: 500 }
    );
  }
}
