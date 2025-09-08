import { NextRequest, NextResponse } from 'next/server';
import { userOperations, passwordUtils } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();
    
    if (!email || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Email and newPassword required'
      }, { status: 400 });
    }
    
    console.log('Password reset for:', email);
    
    // Find user
    const user = userOperations.findByEmail(email);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    // Hash the new password
    const hashedPassword = await passwordUtils.hash(newPassword);
    console.log('New password hashed, length:', hashedPassword.length);
    
    // Update user password
    const updateResult = userOperations.update(user.id, {
      password_hash: hashedPassword
    });
    
    if (!updateResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update password'
      }, { status: 500 });
    }
    
    console.log('Password updated successfully for:', email);
    
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      debug: {
        userId: user.id,
        email: user.email,
        newHashLength: hashedPassword.length
      }
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({
      success: false,
      error: 'Password reset failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
