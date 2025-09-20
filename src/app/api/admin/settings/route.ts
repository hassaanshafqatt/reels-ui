import { NextRequest, NextResponse } from 'next/server';
import { adminSettingsOperations } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, any authenticated user can view settings
    // In a real app, you'd check for admin role here
    
    const settings = adminSettingsOperations.getAll();
    
    return NextResponse.json({
      success: true,
      settings
    });

  } catch {
    return NextResponse.json({ error: 'Failed to fetch admin settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, any authenticated user can update settings
    // In a real app, you'd check for admin role here

    const body = await request.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const success = adminSettingsOperations.set(key, value.toString(), description);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update setting' },
        { status: 500 }
      );
    }

    const updatedSetting = adminSettingsOperations.get(key);

    return NextResponse.json({
      success: true,
      setting: updatedSetting
    });

  } catch {
    return NextResponse.json({ error: 'Failed to update admin setting' }, { status: 500 });
  }
}
