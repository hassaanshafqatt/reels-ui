import { NextRequest, NextResponse } from 'next/server';
import { userOperations, passwordUtils } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('Debug auth check for:', email);
    
    // Find user
    const user = userOperations.findByEmail(email);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        debug: { email }
      });
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: user.password_hash?.length || 0,
      passwordHashPrefix: user.password_hash?.substring(0, 10) || 'none'
    });
    
    // Test password verification
    const isValidPassword = await passwordUtils.verify(password, user.password_hash);
    
    console.log('Password verification result:', isValidPassword);
    
    // Test hashing the provided password
    const testHash = await passwordUtils.hash(password);
    console.log('Test hash of provided password:', testHash);
    
    // Test if the hashes match
    const testVerify = await passwordUtils.verify(password, testHash);
    console.log('Test hash verification:', testVerify);
    
    return NextResponse.json({
      success: true,
      debug: {
        userFound: true,
        userId: user.id,
        email: user.email,
        hasPasswordHash: !!user.password_hash,
        passwordHashLength: user.password_hash?.length || 0,
        passwordValid: isValidPassword,
        testHashWorks: testVerify
      }
    });
    
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
