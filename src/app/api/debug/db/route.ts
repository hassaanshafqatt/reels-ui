import { NextResponse } from 'next/server';
import { reelCategoryOperations, reelTypeOperations } from '@/lib/database';

export async function GET() {
  try {
    const categories = reelCategoryOperations.getAll();
    const types = reelTypeOperations.getAll();
    
    return NextResponse.json({
      message: 'Database status',
      categories: categories.length,
      types: types.length,
      data: {
        categories,
        types
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
