import { NextRequest, NextResponse } from 'next/server';
import { socialAccountOperations } from '@/lib/database';

interface TikTokTokenResponse {
  data?: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    open_id?: string;
    error?: string;
  };
  error?: unknown;
}

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
      console.error('TikTok OAuth error:', error);
      return NextResponse.redirect(
        new URL('/?error=tiktok_oauth_failed', baseOrigin)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?error=missing_oauth_params', baseOrigin)
      );
    }

    let stateData: unknown;
    let fetchedAvatar: string | undefined = undefined;
    let fetchedFollowers: number | undefined = undefined;
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
    const clientKey = process.env.TIKTOK_CLIENT_ID; // sometimes called client_key
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;

    if (!clientKey || !clientSecret || !redirectUri) {
      console.error('TikTok OAuth configuration missing');
      return NextResponse.redirect(
        new URL('/?error=tiktok_config_missing', baseOrigin)
      );
    }

    // Exchange code for access token
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
    const tokenBody = new URLSearchParams({
      client_key: String(clientKey),
      client_secret: String(clientSecret),
      code: String(code),
      grant_type: 'authorization_code',
      redirect_uri: String(redirectUri),
    });

    const tokenResp = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    });

    if (!tokenResp.ok) {
      const txt = await tokenResp.text().catch(() => '<no-body>');
      console.error('TikTok token exchange failed:', tokenResp.status, txt);
      // include a short base64 encoded detail in the redirect for debugging (truncated)
      const detail = Buffer.from(String(txt)).toString('base64').slice(0, 200);
      return NextResponse.redirect(
        new URL(
          `/?error=tiktok_token_exchange_failed&detail=${encodeURIComponent(detail)}`,
          baseOrigin
        )
      );
    }

    const tokenDataRaw = await tokenResp.json().catch(async (err) => {
      // Try to capture non-JSON bodies as text for debugging
      try {
        const txt = await tokenResp.text();
        console.error('TikTok token exchange non-json response:', txt);
      } catch {
        // ignore
      }
      throw err;
    });

    // Normalize response shape: TikTok sometimes returns fields at top-level,
    // sometimes under a `data` object. Support both.
    const tokenData =
      tokenDataRaw && typeof tokenDataRaw === 'object'
        ? (tokenDataRaw as Record<string, unknown>)
        : {};

    const maybeData =
      tokenData.data && typeof tokenData.data === 'object'
        ? (tokenData.data as Record<string, unknown>)
        : tokenData;

    const accessToken = maybeData['access_token']
      ? String(maybeData['access_token'])
      : undefined;
    const refreshToken = maybeData['refresh_token']
      ? String(maybeData['refresh_token'])
      : undefined;
    const openId =
      maybeData['open_id'] || maybeData['openId']
        ? String(maybeData['open_id'] ?? maybeData['openId'])
        : undefined;
    let expiresIn: number | undefined = undefined;
    const expiresRaw = maybeData['expires_in'] ?? maybeData['expiresIn'];
    if (typeof expiresRaw === 'number') expiresIn = expiresRaw;
    else if (typeof expiresRaw === 'string') {
      const v = Number(expiresRaw);
      if (!Number.isNaN(v)) expiresIn = v;
    }

    if (!accessToken) {
      console.error('TikTok token response missing access_token', tokenData);
      return NextResponse.redirect(
        new URL('/?error=tiktok_no_access_token', baseOrigin)
      );
    }

    // Fetch basic user info
    let tiktokUserId: string | undefined = undefined;
    let username: string | undefined = undefined;
    try {
      // New TikTok API may expose /user/info via open.tiktokapis.com
      const meUrl = new URL('https://open.tiktokapis.com/v2/user/info/');
      // TikTok requires a 'fields' parameter; request common profile fields
      meUrl.searchParams.set(
        'fields',
        'open_id,union_id,display_name,username,avatar_url,follower_count'
      );
      const meResp = await fetch(meUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });
      if (meResp.ok) {
        const parsed: unknown = await meResp.json();
        console.debug('TikTok user info response', parsed);
        // try common shapes
        const d =
          parsed &&
          typeof parsed === 'object' &&
          'data' in (parsed as Record<string, unknown>)
            ? (parsed as Record<string, unknown>).data
            : parsed;

        if (d && typeof d === 'object') {
          const dd = d as Record<string, unknown>;
          if ('user' in dd && dd.user && typeof dd.user === 'object') {
            const userObj = dd.user as Record<string, unknown>;
            const idVal = userObj.id ?? userObj.open_id ?? userObj.union_id;
            if (idVal !== undefined) tiktokUserId = String(idVal);
            const nameVal =
              userObj.username ?? userObj.display_name ?? userObj.name;
            if (nameVal !== undefined) username = String(nameVal);
            // try to capture avatar_url and follower_count from nested user
            if (userObj.avatar_url) fetchedAvatar = String(userObj.avatar_url);
            if (userObj.follower_count) {
              const f = userObj.follower_count;
              if (typeof f === 'number') fetchedFollowers = f;
              else if (typeof f === 'string') {
                const v = Number(f);
                if (!Number.isNaN(v)) fetchedFollowers = v;
              }
            }
          } else {
            const idVal = dd.open_id ?? dd.id ?? dd.union_id;
            if (idVal !== undefined) tiktokUserId = String(idVal);
            const nameVal = dd.username ?? dd.display_name;
            if (nameVal !== undefined) username = String(nameVal);
            if (dd.avatar_url) fetchedAvatar = String(dd.avatar_url);
            if (dd.follower_count) {
              const f = dd.follower_count;
              if (typeof f === 'number') fetchedFollowers = f;
              else if (typeof f === 'string') {
                const v = Number(f);
                if (!Number.isNaN(v)) fetchedFollowers = v;
              }
            }
          }
        }
      } else {
        // attempt to read body for logging
        try {
          const txt = await meResp.text();
          console.error('TikTok user info fetch failed', meResp.status, txt);
          // attach small debug detail to logs; do not fail the flow as we have fallbacks
        } catch {
          console.error(
            'TikTok user info fetch failed with status',
            meResp.status
          );
        }
      }
    } catch (err) {
      console.debug('Failed to fetch TikTok profile', err);
    }

    // Fallback to open_id or use code-derived id
    if (!tiktokUserId) {
      tiktokUserId = openId || `tiktok_${Date.now()}`;
    }
    if (!username) {
      username = `tiktok_${tiktokUserId}`;
    }

    // Compute expires_at ISO if expiresIn provided
    let expiresAt: string | undefined = undefined;
    if (typeof expiresIn === 'number' && expiresIn > 0) {
      expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    }

    // Save or update social account (persist avatar if available)
    const existing = socialAccountOperations.findByPlatformAndAccountId(
      userId,
      'tiktok',
      tiktokUserId
    );
    if (existing) {
      socialAccountOperations.updateTokens(
        existing.id,
        accessToken,
        refreshToken,
        expiresAt,
        fetchedAvatar ?? undefined
      );
    } else {
      const result = socialAccountOperations.create({
        user_id: userId,
        platform: 'tiktok',
        account_id: tiktokUserId,
        username: username,
        profile_image: fetchedAvatar ?? undefined,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      });

      if (!result.success) {
        console.error('Failed to save TikTok account:', result.error);
        return NextResponse.redirect(
          new URL('/?error=account_save_failed', baseOrigin)
        );
      }
    }

    return NextResponse.redirect(
      new URL('/?success=tiktok_connected', baseOrigin)
    );
  } catch (err) {
    console.error('TikTok OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/?error=tiktok_oauth_callback_error', baseOrigin)
    );
  }
}
