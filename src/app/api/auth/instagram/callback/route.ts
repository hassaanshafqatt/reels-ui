import { NextRequest, NextResponse } from 'next/server';
import { socialAccountOperations } from '@/lib/database';

interface InstagramTokenResponse {
  access_token: string;
  user_id: string;
  permissions?: {
    data: Array<{
      permission: string;
      status: string;
    }>;
  };
}

interface InstagramUserResponse {
  id: string;
  username: string;
  account_type?: string;
}

// Parsed response from Instagram that may include an error object
interface ParsedResponse {
  error?: {
    message?: string;
    type?: string;
    is_transient?: boolean;
    code?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

type FetchResult = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  json: () => Promise<ParsedResponse>;
} | null;

export async function GET(request: NextRequest) {
  // Determine a safe absolute base for redirects.
  // Prefer the actual incoming request URL origin, but if that origin is a local bind
  // like 0.0.0.0 (common when running the dev server bound to all interfaces),
  // prefer the Host header (and x-forwarded-proto if present) so redirects go to the
  // externally-accessible URL instead of 0.0.0.0.
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
    const { searchParams } = new URL(request.url);
    console.debug(
      'Instagram callback - request.url=',
      request.url,
      'computed baseOrigin=',
      baseOrigin
    );
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('Instagram OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL('/?error=instagram_oauth_failed', baseOrigin)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?error=missing_oauth_params', baseOrigin)
      );
    }

    // Verify state parameter
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        new URL('/?error=invalid_oauth_state', baseOrigin)
      );
    }

    // Check if state is not too old (5 minutes)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(
        new URL('/?error=oauth_state_expired', baseOrigin)
      );
    }

    const userId = stateData.userId;
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Instagram OAuth configuration missing');
      console.debug(
        'INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, INSTAGRAM_REDIRECT_URI',
        clientId,
        clientSecret,
        redirectUri
      );
      return NextResponse.redirect(
        new URL('/?error=instagram_config_missing', baseOrigin)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://api.instagram.com/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code: code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Instagram token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/?error=instagram_token_exchange_failed', baseOrigin)
      );
    }

    const tokenData: InstagramTokenResponse = await tokenResponse.json();
    const { access_token, user_id } = tokenData;

    // Exchange short-lived token for a long-lived token (Instagram Graph API)
    let longLivedAccessToken = access_token;
    let expiresAt: string | undefined = undefined;

    try {
      const exchangeUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${access_token}`;
      const longResp = await fetch(exchangeUrl);
      if (!longResp.ok) {
        const errText = await longResp.text();
        console.error('Failed to exchange for long-lived token:', errText);
        return NextResponse.redirect(
          new URL('/?error=instagram_long_lived_exchange_failed', baseOrigin)
        );
      }

      const longData = await longResp.json();
      // Response contains access_token and expires_in (seconds)
      if (longData.access_token) {
        longLivedAccessToken = longData.access_token;
        if (longData.expires_in) {
          const seconds = Number(longData.expires_in);
          if (!Number.isNaN(seconds) && seconds > 0) {
            expiresAt = new Date(Date.now() + seconds * 1000).toISOString();
            console.debug(
              'Computed Instagram long-lived expires_at=',
              expiresAt
            );
          }
        }
      }
    } catch (err) {
      console.error('Error exchanging for long-lived token:', err);
      return NextResponse.redirect(
        new URL('/?error=instagram_long_lived_exchange_failed', baseOrigin)
      );
    }

    // Helper: single attempt fetch (no retries) that returns a Response-like object or null
    const singleFetch = async (url: string): Promise<FetchResult> => {
      try {
        const resp = await fetch(url);
        const bodyText = await resp.text();
        let parsed: ParsedResponse | null = null;
        try {
          parsed = JSON.parse(bodyText) as ParsedResponse;
        } catch {
          parsed = null;
        }
        return {
          ok: resp.ok,
          status: resp.status,
          async text() {
            return bodyText;
          },
          async json() {
            return parsed !== null
              ? parsed
              : (JSON.parse(bodyText) as ParsedResponse);
          },
        };
      } catch (err) {
        console.debug(`Network error while fetching ${url}`, err);
        return null;
      }
    };

    const tokenPreview = `${longLivedAccessToken.slice(0, 8)}...${longLivedAccessToken.slice(-8)}`;
    // Request profile_picture_url when available from the Graph API
    const userUrl = `https://graph.instagram.com/${user_id}?fields=id,username,account_type,profile_picture_url&access_token=${longLivedAccessToken}`;
    // Try the display (by user id) endpoint once
    let userResponse: FetchResult = await singleFetch(userUrl);

    // If fetching by user id failed or returned transient error, try the /me endpoint as a fallback
    if (!userResponse || !userResponse.ok) {
      if (userResponse) {
        try {
          const bodyText = await userResponse.text();
          console.error('Instagram profile fetch by id failed', {
            status: userResponse.status,
            body: bodyText,
            tokenPreview,
          });
        } catch {
          console.error(
            'Instagram profile fetch by id failed and body could not be read',
            { tokenPreview }
          );
        }
      } else {
        console.error(
          'Instagram profile fetch by id failed with network error',
          { tokenPreview }
        );
      }

      // Try the /me endpoint once
      const meUrl = `https://graph.instagram.com/me?fields=id,username,account_type,profile_picture_url&access_token=${longLivedAccessToken}`;
      userResponse = await singleFetch(meUrl);
    }

    let userData: InstagramUserResponse | null = null;
    // capture profile image URL when available from various Graph endpoints
    let profileImage: string | undefined = undefined;

    if (!userResponse || !userResponse.ok) {
      try {
        const bodyText = userResponse
          ? await userResponse.text()
          : 'no response';
        console.error('Instagram profile fetch failed (after fallback)', {
          status: userResponse ? userResponse.status : 'network-error',
          body: bodyText,
          tokenPreview,
        });
      } catch {
        console.error(
          'Instagram profile fetch failed and body could not be read',
          { tokenPreview }
        );
      }

      // Try another fallback specifically for Business accounts:
      // Facebook Pages connected to the user may expose `instagram_business_account`.
      // We'll call /me/accounts and inspect pages for that field, then fetch the IG account.
      try {
        const accountsUrl = `https://graph.facebook.com/v23.0/me/accounts?access_token=${longLivedAccessToken}`;
        const accountsResp = await singleFetch(accountsUrl);
        if (accountsResp && accountsResp.ok) {
          const accountsJson = (await accountsResp.json()) as unknown;
          // accountsJson may contain data: [{ id, name, ... }]
          const pages = Array.isArray((accountsJson as { data?: unknown }).data)
            ? ((accountsJson as { data?: unknown }).data as Array<unknown>)
            : [];

          for (const page of pages) {
            try {
              // Fetch the page and request the instagram_business_account field
              if (
                !page ||
                typeof page !== 'object' ||
                !('id' in (page as Record<string, unknown>))
              ) {
                continue;
              }
              const pageId = String((page as Record<string, unknown>).id);
              const pageUrl = `https://graph.facebook.com/v23.0/${pageId}?fields=instagram_business_account&access_token=${longLivedAccessToken}`;
              const pageResp = await singleFetch(pageUrl);
              if (pageResp && pageResp.ok) {
                const pageJson = (await pageResp.json()) as unknown;
                const igAccount =
                  pageJson &&
                  typeof pageJson === 'object' &&
                  'instagram_business_account' in
                    (pageJson as Record<string, unknown>)
                    ? (pageJson as Record<string, unknown>)
                        .instagram_business_account
                    : undefined;
                if (
                  igAccount &&
                  typeof igAccount === 'object' &&
                  'id' in (igAccount as Record<string, unknown>)
                ) {
                  // Fetch the Instagram Business account details
                  const igId = String(
                    (igAccount as Record<string, unknown>).id
                  );
                  const igUrl = `https://graph.facebook.com/v23.0/${igId}?fields=id,username,account_type,profile_picture_url&access_token=${longLivedAccessToken}`;
                  const igResp = await singleFetch(igUrl);
                  if (igResp && igResp.ok) {
                    try {
                      const igJson = (await igResp.json()) as unknown;
                      if (
                        igJson &&
                        typeof igJson === 'object' &&
                        'id' in (igJson as Record<string, unknown>)
                      ) {
                        const igObj = igJson as Record<string, unknown>;
                        const parsedId = String(igObj.id);
                        const parsedUsername =
                          'username' in igObj
                            ? String(igObj.username)
                            : `instagram_${parsedId}`;
                        const parsedAccountType =
                          'account_type' in igObj
                            ? String(igObj.account_type)
                            : undefined;
                        const parsedProfileImage =
                          'profile_picture_url' in igObj
                            ? String(igObj.profile_picture_url)
                            : undefined;
                        userData = {
                          id: parsedId,
                          username: parsedUsername,
                          account_type: parsedAccountType,
                        };
                        // capture profile image when available
                        if (parsedProfileImage) {
                          profileImage = parsedProfileImage;
                        }
                        break;
                      }
                    } catch {
                      // ignore and continue
                    }
                  }
                }
              }
            } catch {
              // ignore transient errors per-page
            }
          }
        }
      } catch {
        // ignore overall accounts fetch failure
      }

      // Final fallback: use user_id from tokenData so account can still be connected
      if (!userData) {
        if (user_id) {
          console.warn(
            'Proceeding with fallback: using tokenData.user_id as account id due to profile lookup failure'
          );
          userData = {
            id: user_id,
            username: `instagram_${user_id}`,
          };
        } else {
          return NextResponse.redirect(
            new URL('/?error=instagram_profile_fetch_failed', baseOrigin)
          );
        }
      }
    } else {
      // successful response - safely parse and validate shape
      try {
        const parsed = (await userResponse.json()) as unknown;
        if (
          parsed &&
          typeof parsed === 'object' &&
          'id' in (parsed as Record<string, unknown>) &&
          'username' in (parsed as Record<string, unknown>)
        ) {
          const r = parsed as Record<string, unknown>;
          userData = {
            id: String(r.id),
            username: String(r.username),
            account_type: r.account_type ? String(r.account_type) : undefined,
          };
          if ('profile_picture_url' in r && r.profile_picture_url) {
            try {
              profileImage = String(r.profile_picture_url);
            } catch {
              // ignore invalid profile image
            }
          }
        } else {
          console.warn(
            'Instagram profile response missing expected fields, using fallback',
            { parsed, tokenPreview }
          );
          userData = {
            id: user_id,
            username: `instagram_${user_id}`,
          };
        }
      } catch {
        console.error(
          'Failed to parse Instagram profile JSON, using fallback',
          { tokenPreview }
        );
        userData = {
          id: user_id,
          username: `instagram_${user_id}`,
        };
      }
    }

    // Check if account already exists
    const existingAccount = socialAccountOperations.findByPlatformAndAccountId(
      userId,
      'instagram',
      userData.id
    );

    if (existingAccount) {
      // Update existing account with new token
      socialAccountOperations.updateTokens(
        existingAccount.id,
        longLivedAccessToken,
        undefined, // Instagram doesn't provide refresh tokens
        expiresAt, // may be undefined for non-expiring tokens
        profileImage
      );
      try {
        const updated = socialAccountOperations.findById(existingAccount.id);
        console.debug(
          'Updated social account row after token update:',
          updated
        );
      } catch {
        console.debug('Could not fetch updated social account');
      }
    } else {
      // Create new account
      const result = socialAccountOperations.create({
        user_id: userId,
        platform: 'instagram',
        account_id: userData.id,
        username: userData.username,
        profile_image: profileImage,
        access_token: longLivedAccessToken,
        expires_at: expiresAt,
      });

      if (!result.success) {
        console.error('Failed to save Instagram account:', result.error);
        return NextResponse.redirect(
          new URL('/?error=account_save_failed', baseOrigin)
        );
      }
      try {
        if (result.accountId) {
          const created = socialAccountOperations.findById(result.accountId);
          console.debug('Created social account row:', created);
        } else {
          console.debug('Created social account but no accountId returned');
        }
      } catch {
        console.debug('Could not fetch created social account');
      }
    }

    // Redirect back to the app with success
    return NextResponse.redirect(
      new URL('/?success=instagram_connected', baseOrigin)
    );
  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=instagram_oauth_callback_error', baseOrigin)
    );
  }
}
