import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const envRedirectUri = process.env.YOUTUBE_REDIRECT_URI;

    const incomingUrl = new URL(request.url);
    let baseOrigin = incomingUrl.origin;
    const isLocalBind = ['0.0.0.0', '127.0.0.1', '::'].includes(
      incomingUrl.hostname
    );
    if (isLocalBind) {
      const hostHeader =
        request.headers.get('x-forwarded-host') || request.headers.get('host');
      const protoHeader =
        request.headers.get('x-forwarded-proto') ||
        request.headers.get('x-forwarded-protocol');
      if (hostHeader) {
        const proto = protoHeader
          ? protoHeader.split(',')[0].trim()
          : incomingUrl.protocol.replace(':', '');
        baseOrigin = `${proto}://${hostHeader.split(',')[0].trim()}`;
      } else if (request.nextUrl?.origin) {
        baseOrigin = request.nextUrl.origin;
      }
    }

    let redirectUri = envRedirectUri;
    if (!redirectUri || redirectUri.includes('0.0.0.0')) {
      redirectUri = `${baseOrigin}/api/auth/youtube/callback`;
    }

    if (!clientId || !redirectUri) {
      console.error('YouTube OAuth configuration missing');
      return NextResponse.json(
        { error: 'YouTube OAuth not configured' },
        { status: 500 }
      );
    }

    // Debug: log non-secret OAuth config to help debug redirect mismatches
    try {
      console.info('YouTube OAuth initiate', {
        clientId: String(clientId).slice(0, 12) + '...',
        redirectUri,
      });
    } catch {
      /* ignore logging failures */
    }

    const state = Buffer.from(
      JSON.stringify({ userId: user.id, timestamp: Date.now() })
    ).toString('base64');

    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('response_type', 'code');
    // request offline access to receive a refresh token; request YouTube scopes
    oauthUrl.searchParams.set('access_type', 'offline');
    oauthUrl.searchParams.set(
      'scope',
      [
        'openid',
        'profile',
        'email',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.upload',
      ].join(' ')
    );
    // prompt=consent ensures refresh_token is returned on repeated grants
    oauthUrl.searchParams.set('prompt', 'consent');
    oauthUrl.searchParams.set('state', state);

    return NextResponse.redirect(oauthUrl.toString());
  } catch (error) {
    console.error('YouTube OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate YouTube OAuth' },
      { status: 500 }
    );
  }
}
