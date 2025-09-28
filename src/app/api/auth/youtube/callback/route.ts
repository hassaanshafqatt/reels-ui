import { NextRequest, NextResponse } from 'next/server';
import { socialAccountOperations } from '@/lib/database';

export async function GET(request: NextRequest) {
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

  try {
    const { searchParams } = incomingUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('YouTube OAuth error:', error);
      return NextResponse.redirect(
        new URL('/?error=youtube_oauth_failed', baseOrigin)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?error=missing_oauth_params', baseOrigin)
      );
    }

    let stateData: unknown;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        new URL('/?error=invalid_oauth_state', baseOrigin)
      );
    }

    if (!stateData || typeof stateData !== 'object') {
      return NextResponse.redirect(
        new URL('/?error=invalid_oauth_state', baseOrigin)
      );
    }

    const sd = stateData as Record<string, unknown>;
    const timestampRaw = sd.timestamp;
    const userIdRaw = sd.userId;
    if (!timestampRaw || !userIdRaw) {
      return NextResponse.redirect(
        new URL('/?error=invalid_oauth_state', baseOrigin)
      );
    }

    const timestampNum = Number(timestampRaw);
    if (
      Number.isNaN(timestampNum) ||
      Date.now() - timestampNum > 5 * 60 * 1000
    ) {
      return NextResponse.redirect(
        new URL('/?error=oauth_state_expired', baseOrigin)
      );
    }

    const userId = String(userIdRaw);
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    let redirectUri = process.env.YOUTUBE_REDIRECT_URI;

    // If redirectUri isn't set in env, derive it from the incoming request (helps with ngrok/local)
    if (!redirectUri || redirectUri.includes('0.0.0.0')) {
      redirectUri = `${baseOrigin}/api/auth/youtube/callback`;
    }

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('YouTube OAuth configuration missing');
      return NextResponse.redirect(
        new URL('/?error=youtube_config_missing', baseOrigin)
      );
    }

    // Debug: log non-secret OAuth config to help debug redirect mismatches and client issues
    try {
      console.info('YouTube OAuth callback', {
        clientId: String(clientId).slice(0, 12) + '...',
        redirectUri,
      });
    } catch {
      /* ignore logging failures */
    }

    // Exchange code for tokens
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenBody = new URLSearchParams({
      client_id: String(clientId),
      client_secret: String(clientSecret),
      code: String(code),
      grant_type: 'authorization_code',
      redirect_uri: String(redirectUri),
    });

    // Safe debug log: show clientId, masked clientSecret, and redirectUri used for token exchange
    try {
      const maskedClientSecret =
        typeof clientSecret === 'string'
          ? clientSecret.length > 8
            ? `${clientSecret.slice(0, 4)}…${clientSecret.slice(-4)}`
            : '****'
          : undefined;
      console.info('YouTube token exchange starting', {
        tokenUrl,
        clientId: clientId ? String(clientId) : undefined,
        clientSecret: maskedClientSecret,
        redirectUri,
      });
    } catch {
      /* ignore logging failures */
    }

    const tokenResp = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    });

    if (!tokenResp.ok) {
      const txt = await tokenResp.text().catch(() => '<no-body>');
      console.error('YouTube token exchange failed:', tokenResp.status, txt);
      const detail = Buffer.from(String(txt)).toString('base64').slice(0, 200);
      return NextResponse.redirect(
        new URL(
          `/?error=youtube_token_exchange_failed&detail=${encodeURIComponent(detail)}`,
          baseOrigin
        )
      );
    }

    const tokenDataRaw = await tokenResp.json().catch(async (err) => {
      try {
        const txt = await tokenResp.text();
        console.error('YouTube token exchange non-json response:', txt);
      } catch {
        // ignore
      }
      throw err;
    });

    const accessToken = tokenDataRaw.access_token
      ? String(tokenDataRaw.access_token)
      : undefined;
    const refreshToken = tokenDataRaw.refresh_token
      ? String(tokenDataRaw.refresh_token)
      : undefined;
    let expiresIn: number | undefined = undefined;
    if (tokenDataRaw.expires_in) {
      const v = Number(tokenDataRaw.expires_in);
      if (!Number.isNaN(v)) expiresIn = v;
    }

    if (!accessToken) {
      console.error(
        'YouTube token response missing access_token',
        tokenDataRaw
      );
      return NextResponse.redirect(
        new URL('/?error=youtube_no_access_token', baseOrigin)
      );
    }

    let expiresAt: string | undefined = undefined;
    if (typeof expiresIn === 'number' && expiresIn > 0) {
      expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    }

    // Fetch channel info (use channels.list with mine=true)
    let channelId: string | undefined = undefined;
    let channelTitle: string | undefined = undefined;
    let channelThumbnail: string | undefined = undefined;
    try {
      const meUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
      meUrl.searchParams.set('part', 'id,snippet');
      meUrl.searchParams.set('mine', 'true');
      const meResp = await fetch(meUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });
      if (meResp.ok) {
        const parsed = await meResp.json();
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          const ch = parsed.items[0];
          channelId = ch.id ? String(ch.id) : undefined;
          if (ch.snippet && typeof ch.snippet === 'object') {
            channelTitle = ch.snippet.title
              ? String(ch.snippet.title)
              : undefined;
            if (ch.snippet.thumbnails && ch.snippet.thumbnails.default) {
              channelThumbnail = String(ch.snippet.thumbnails.default.url);
            }
          }
        }
      } else {
        try {
          const txt = await meResp.text();
          console.error('YouTube channels fetch failed', meResp.status, txt);
        } catch {
          console.error(
            'YouTube channels fetch failed with status',
            meResp.status
          );
        }
      }
    } catch (err) {
      console.debug('Failed to fetch YouTube channel info', err);
    }

    if (!channelId) {
      // fallback: construct an id so the account can still be saved
      channelId = `youtube_${Date.now()}`;
      if (!channelTitle) channelTitle = `YouTube ${channelId}`;
    }

    // Persist or update account
    const existing = socialAccountOperations.findByPlatformAndAccountId(
      userId,
      'youtube',
      channelId
    );
    if (existing) {
      socialAccountOperations.updateTokens(
        existing.id,
        accessToken,
        refreshToken,
        expiresAt,
        channelThumbnail ?? undefined
      );
    } else {
      const result = socialAccountOperations.create({
        user_id: userId,
        platform: 'youtube',
        account_id: channelId,
        username: channelTitle ?? channelId,
        profile_image: channelThumbnail ?? undefined,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      });

      if (!result.success) {
        console.error('Failed to save YouTube account:', result.error);
        return NextResponse.redirect(
          new URL('/?error=account_save_failed', baseOrigin)
        );
      }
    }

    return NextResponse.redirect(
      new URL('/?success=youtube_connected', baseOrigin)
    );
  } catch (err) {
    console.error('YouTube OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/?error=youtube_oauth_callback_error', baseOrigin)
    );
  }
}
