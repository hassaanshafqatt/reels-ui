import { NextRequest, NextResponse } from 'next/server';
import { reelTypeOperations } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';

interface TypeParams {
  id: string;
}

// GET /api/reels/types/[id] - Get reel type by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<TypeParams> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const type = reelTypeOperations.getById(id);
    
    if (!type) {
      return NextResponse.json({ error: 'Reel type not found' }, { status: 404 });
    }

    return NextResponse.json({ type });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reel type' }, { status: 500 });
  }
}

// PUT /api/reels/types/[id] - Update reel type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<TypeParams> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      category_id, 
      name, 
      title, 
      description, 
      icon, 
      message, 
      caption,
      min_caption_length,
      max_caption_length,
      include_author,
      allow_custom_audio,
      external_url,
      status_url,
      posting_url,
      is_active 
    } = body;

    const updates: Record<string, unknown> = {};
    if (category_id !== undefined) updates.category_id = category_id;
    if (name !== undefined) updates.name = name;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (message !== undefined) updates.message = message;
    if (caption !== undefined) updates.caption = caption;
    if (min_caption_length !== undefined) updates.min_caption_length = min_caption_length;
    if (max_caption_length !== undefined) updates.max_caption_length = max_caption_length;
    if (include_author !== undefined) updates.include_author = include_author;
    if (allow_custom_audio !== undefined) updates.allow_custom_audio = allow_custom_audio;
    if (external_url !== undefined) updates.external_url = external_url;
    if (status_url !== undefined) updates.status_url = status_url;
    if (posting_url !== undefined) updates.posting_url = posting_url;
    if (is_active !== undefined) updates.is_active = is_active;

    const success = reelTypeOperations.update(id, updates);
    
    if (!success) {
      return NextResponse.json({ error: 'Reel type not found' }, { status: 404 });
    }

    const type = reelTypeOperations.getById(id);
    return NextResponse.json({ type });
  } catch {
    return NextResponse.json({ error: 'Failed to update reel type' }, { status: 500 });
  }
}

// DELETE /api/reels/types/[id] - Delete reel type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<TypeParams> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const success = reelTypeOperations.delete(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Reel type not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Reel type deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete reel type' }, { status: 500 });
  }
}
