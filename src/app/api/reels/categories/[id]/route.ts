import { NextRequest, NextResponse } from 'next/server';
import { reelCategoryOperations } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';

interface CategoryParams {
  id: string;
}

// GET /api/reels/categories/[id] - Get category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<CategoryParams> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const category = reelCategoryOperations.getById(id);
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Failed to fetch category:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

// PUT /api/reels/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<CategoryParams> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, title, description, icon, is_active } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (is_active !== undefined) updates.is_active = is_active;

    const success = reelCategoryOperations.update(id, updates);
    
    if (!success) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const category = reelCategoryOperations.getById(id);
    return NextResponse.json({ category });
  } catch (error) {
    console.error('Failed to update category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE /api/reels/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<CategoryParams> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const success = reelCategoryOperations.delete(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
