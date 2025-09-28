import { NextResponse } from 'next/server';
import { migrateInitialReelData } from '@/lib/database';

export async function POST() {
  try {
    migrateInitialReelData();

    return NextResponse.json({
      message: 'Reel data migration completed successfully',
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
