import { NextRequest, NextResponse } from 'next/server';
import { userOperations, passwordUtils } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and newPassword required',
        },
        { status: 400 }
      );
    }

    // Find user
    const user = userOperations.findByEmail(email);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = await passwordUtils.hash(newPassword);

    // Update user password
    const updateResult = userOperations.update(user.id, {
      password_hash: hashedPassword,
    });

    if (!updateResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update password',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      debug: {
        userId: user.id,
        email: user.email,
        newHashLength: hashedPassword.length,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: 'Password reset failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
