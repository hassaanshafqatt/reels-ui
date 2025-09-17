import { NextRequest, NextResponse } from 'next/server';

// Import the job store from the main route
// Since we can't directly import from the dynamic route, we'll create a simple debug endpoint

export async function GET(request: NextRequest) {
  try {
    // For debugging - you can manually check job storage here
    return NextResponse.json({
      message: 'Debug endpoint',
      timestamp: new Date().toISOString(),
      note: 'Check the main route console logs for job storage information'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Debug endpoint failed' }, { status: 500 });
  }
}
