import { NextResponse } from 'next/server';
import { migrateInitialReelData } from '@/lib/database';

export async function POST() {
  try {
    console.log('Starting manual reel data migration...');
    migrateInitialReelData();
    console.log('Manual reel data migration completed');
    
    return NextResponse.json({
      message: 'Reel data migration completed successfully'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
