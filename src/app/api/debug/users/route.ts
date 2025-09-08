import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';

export async function GET() {
  try {
    const stmt = db.prepare('SELECT id, email, name, plan, created_at FROM users');
    const users = stmt.all();
    
    console.log('All users in database:', users);
    
    return NextResponse.json({
      success: true,
      users: users
    });
    
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to list users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
