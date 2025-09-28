import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { socialAccountOperations } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's social accounts
    const accounts = socialAccountOperations.findByUserId(user.id);

    // Helper: single attempt fetch
    const singleFetch = async (url: string) => {
      try {
        const resp = await fetch(url);
        const text = await resp.text();
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = null;
        }
        return {
          ok: resp.ok,
          status: resp.status,
          text: () => text,
          json: () => parsed as unknown,
        };
      } catch (err) {
        console.debug('Network error fetching', url, err);
        return null;
      }
    };

    // Transform accounts to include platform-specific data and profile image
    const transformedAccounts = await Promise.all(
      accounts.map(async (account) => {
        const platformData = getPlatformData(account.platform);

        // If Instagram, try to fetch followers_count using the stored access token
        if (account.platform === 'instagram' && account.access_token) {
          try {
            const url = `https://graph.instagram.com/${account.account_id}?fields=followers_count&access_token=${account.access_token}`;
            const resp = await singleFetch(url);
            if (resp && resp.ok) {
              const parsed = resp.json() as unknown;
              let followersRaw: number | undefined = undefined;
              if (parsed && typeof parsed === 'object') {
                const obj = parsed as Record<string, unknown>;
                const val = obj['followers_count'];
                if (typeof val === 'number') {
                  followersRaw = val;
                } else if (typeof val === 'string') {
                  const num = Number(val);
                  if (!Number.isNaN(num)) followersRaw = num;
                }
              }
              if (!Number.isNaN(followersRaw) && followersRaw !== undefined) {
                // format with simple suffixes
                platformData.followers = formatFollowers(followersRaw);
              }
            }
          } catch (err) {
            console.debug(
              'Failed to fetch Instagram followers for account',
              account.account_id,
              err
            );
          }
        }

        return {
          id: account.id,
          platform: account.platform,
          username: account.username,
          accountId: account.account_id,
          connectedAt: account.created_at,
          profileImage: account.profile_image || null,
          platformData,
        };
      })
    );

    return NextResponse.json({
      success: true,
      accounts: transformedAccounts,
    });
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

function getPlatformData(platform: string) {
  switch (platform) {
    case 'instagram':
      return {
        name: 'Instagram',
        icon: 'instagram',
        color: '#E4405F',
        followers: 'N/A', // Will be replaced with real count when available
      };
    case 'youtube':
      return {
        name: 'YouTube',
        icon: 'youtube',
        color: '#FF0000',
        followers: 'N/A',
      };
    case 'tiktok':
      return {
        name: 'TikTok',
        icon: 'tiktok',
        color: '#000000',
        followers: 'N/A',
      };
    default:
      return {
        name: platform,
        icon: 'social',
        color: '#666666',
        followers: 'N/A',
      };
  }
}

function formatFollowers(n: number) {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}
