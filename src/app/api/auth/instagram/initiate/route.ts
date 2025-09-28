import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      console.error('Instagram OAuth configuration missing');
      return NextResponse.json(
        { error: 'Instagram OAuth not configured' },
        { status: 500 }
      );
    }

    // Generate state parameter for security (include user ID)
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Instagram OAuth URL with required scopes for business accounts
    const oauthUrl = new URL('https://api.instagram.com/oauth/authorize');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set(
      'scope',
      'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_messages'
    );
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('state', state);

    // Redirect to Instagram OAuth
    return NextResponse.redirect(oauthUrl.toString());
  } catch (error) {
    console.error('Instagram OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Instagram OAuth' },
      { status: 500 }
    );
  }
}
