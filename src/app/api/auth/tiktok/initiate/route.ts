import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = process.env.TIKTOK_CLIENT_ID;
    const envRedirectUri = process.env.TIKTOK_REDIRECT_URI;

    // Compute a safe base origin similar to Instagram callback handler so dev servers
    // bound to 0.0.0.0 redirect to a usable host.
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

    // Prefer env redirect if it's set and doesn't point at 0.0.0.0; otherwise compute
    // a redirect uri that points back to our app's callback route.
    let redirectUri = envRedirectUri;
    if (!redirectUri || redirectUri.includes('0.0.0.0')) {
      redirectUri = `${baseOrigin}/api/auth/tiktok/callback`;
    }

    if (!clientId || !redirectUri) {
      console.error('TikTok OAuth configuration missing');
      return NextResponse.json(
        { error: 'TikTok OAuth not configured' },
        { status: 500 }
      );
    }

    const state = Buffer.from(
      JSON.stringify({ userId: user.id, timestamp: Date.now() })
    ).toString('base64');

    // TikTok OAuth2 authorize URL
    const oauthUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    oauthUrl.searchParams.set('client_key', clientId as string);
    oauthUrl.searchParams.set('redirect_uri', redirectUri as string);
    // Request basic scopes for getting user info and posting
    oauthUrl.searchParams.set(
      'scope',
      'user.info.basic,video.upload,user.info.profile,user.info.stats,video.publish'
    );
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('state', state);

    return NextResponse.redirect(oauthUrl.toString());
  } catch (error) {
    console.error('TikTok OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate TikTok OAuth' },
      { status: 500 }
    );
  }
}
