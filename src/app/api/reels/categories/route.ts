import { NextRequest, NextResponse } from 'next/server';
import { reelCategoryOperations } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';

// GET /api/reels/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      // Provide small, non-sensitive diagnostics in development to help debug
      if (process.env.NODE_ENV !== 'production') {
        const hasAuthHeader = !!request.headers.get('authorization');
        const hasRefreshCookie = !!request.cookies.get('refresh_token');
        return NextResponse.json(
          {
            error: 'Unauthorized',
            diagnostics: { hasAuthHeader, hasRefreshCookie },
          },
          { status: 401 }
        );
      }

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const categories = reelCategoryOperations.getAll(activeOnly);
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/reels/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, title, description, icon, is_active = true } = body;

    if (!name || !title) {
      return NextResponse.json(
        { error: 'Name and title are required' },
        { status: 400 }
      );
    }

    const categoryId = reelCategoryOperations.create({
      name,
      title,
      description,
      icon,
      is_active,
    });

    const category = reelCategoryOperations.getById(categoryId);
    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
