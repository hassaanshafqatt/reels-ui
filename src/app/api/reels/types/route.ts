import { NextRequest, NextResponse } from 'next/server';
import { reelTypeOperations } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';

// GET /api/reels/types - Get all reel types
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const categoryId = searchParams.get('category');
    
    let types;
    if (categoryId) {
      types = reelTypeOperations.getByCategory(categoryId, activeOnly);
    } else {
      types = reelTypeOperations.getAll(activeOnly);
    }
    
    return NextResponse.json({ types });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reel types' }, { status: 500 });
  }
}

// POST /api/reels/types - Create a new reel type
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      category_id, 
      name, 
      title, 
      description, 
      icon, 
      message, 
      caption,
      label_caption_title,
      label_caption_description,
      label_caption_field,
      label_caption_placeholder,
      label_caption_toggle_auto,
      label_caption_toggle_auto_sub,
      label_caption_toggle_custom,
      label_caption_toggle_custom_sub,
      min_caption_length = 110,
      max_caption_length = 140,
      include_author = true,
    allow_custom_audio = true,
      external_url,
      status_url,
      posting_url,
      is_active = true 
    } = body;

    if (!category_id || !name || !title) {
      return NextResponse.json({ 
        error: 'Category ID, name, and title are required' 
      }, { status: 400 });
    }

    const typeId = reelTypeOperations.create({
      category_id,
      name,
      title,
      description,
      icon,
      message,
      caption,
      label_caption_title,
      label_caption_description,
      label_caption_field,
      label_caption_placeholder,
      label_caption_toggle_auto,
      label_caption_toggle_auto_sub,
      label_caption_toggle_custom,
      label_caption_toggle_custom_sub,
      min_caption_length,
      max_caption_length,
      include_author,
      allow_custom_audio,
      external_url,
      status_url,
      posting_url,
      is_active
    });

    const type = reelTypeOperations.getById(typeId);
    return NextResponse.json({ type }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create reel type' }, { status: 500 });
  }
}
