import { NextRequest, NextResponse } from 'next/server';
import {
  jobOperations,
  sessionOperations,
  reelTypeOperations,
  socialAccountOperations,
} from '@/lib/database';
import { jwtVerify } from 'jose';
import { verifyAuth } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random'
);

// Helper function to verify JWT token
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

// POST - Post a reel to social media platform
export async function POST(request: NextRequest) {
  try {
    // Verify authentication using shared helper. This supports Authorization
    // header tokens and HttpOnly refresh cookie fallback.
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = authUser.id;

    // Also capture an optional Authorization header token (may be used to
    // forward to external posting endpoints if no social account token exists).
    const authHeader = request.headers.get('authorization');
    const forwardedJwtToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

    // Verify session exists for this user via sessionOperations (same as before)
    const session = sessionOperations.findByUserId(userId);
    if (!session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 401 }
      );
    }

    const { jobId, category, type, videoUrl, caption, selectedAccountId } =
      await request.json();

    if (!jobId) {
      return NextResponse.json(
        { message: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Verify the job belongs to the user
    const job = jobOperations.getByJobId(jobId);
    if (!job || job.user_id !== userId) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    }

    // Check if job is in a postable state
    if (!['approved', 'completed'].includes(job.status)) {
      return NextResponse.json(
        { message: 'Job is not ready for posting' },
        { status: 400 }
      );
    }

    // Get the reel type configuration to validate the posting configuration
    const reelType = reelTypeOperations.getByNameOnly(type);
    if (!reelType) {
      return NextResponse.json(
        { message: 'Reel type configuration not found' },
        { status: 404 }
      );
    }

    // Prepare the base posting payload for external service
    const postingPayloadBase: Record<string, unknown> = {
      jobId,
      category,
      type,
      videoUrl,
      caption,
      userId,
      timestamp: new Date().toISOString(),
      reelConfig: {
        title: reelType.title,
        description: reelType.description,
        message: reelType.message,
      },
    };

    // If a selectedAccountId was provided, resolve the full account record
    // server-side (including access_token) and attach non-sensitive metadata
    // to the posting payload; also use its access_token for outgoing auth.
    let resolvedAccount: Record<string, unknown> | null = null;
    if (selectedAccountId) {
      // Typed shape for the social account stored in the DB
      type SocialAccountRecord = {
        id: string;
        user_id: string;
        platform: string;
        account_id: string;
        username: string;
        profile_image?: string | null;
        access_token?: string | null;
        refresh_token?: string | null;
        expires_at?: string | null;
        created_at?: string;
        updated_at?: string;
      };

      const acct = socialAccountOperations.findById(
        String(selectedAccountId)
      ) as SocialAccountRecord | null;

      if (!acct) {
        return NextResponse.json(
          { message: 'Selected account not found' },
          { status: 404 }
        );
      }

      // Ensure account belongs to the authenticated user
      if (acct.user_id !== userId) {
        return NextResponse.json(
          { message: 'Selected account does not belong to user' },
          { status: 403 }
        );
      }

      // Keep the full account record server-side. We will forward the account
      // object (without sending it back to the browser) to the external
      // posting endpoint if needed. Also prefer acct.access_token for auth.
      resolvedAccount = { ...acct } as Record<string, unknown>;
    }

    // Check if we have a specific external posting URL (not self-referential)
    if (
      reelType.posting_url &&
      reelType.posting_url !== '/api/reels/post' &&
      !reelType.posting_url.startsWith('/api/reels/post')
    ) {
      try {
        // Make the actual request to the external posting service
        // If selectedAccount was resolved, prefer its access_token for Authorization
        const externalToken =
          resolvedAccount && (resolvedAccount['access_token'] as string)
            ? (resolvedAccount['access_token'] as string)
            : forwardedJwtToken;

        // Build final posting payload. Include account metadata but do not
        // include raw tokens in the body unless the external service requires it.
        const postingPayload = {
          ...postingPayloadBase,
          selectedAccount: resolvedAccount
            ? {
                id: resolvedAccount.id,
                platform: resolvedAccount.platform,
                username: resolvedAccount.username,
                accountId: resolvedAccount.account_id,
                profileImage: resolvedAccount.profile_image,
                // Do NOT include access_token in the forwarded body by default.
              }
            : null,
        };

        const postingResponse = await fetch(reelType.posting_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${externalToken}`,
          },
          body: JSON.stringify(postingPayload),
        });

        if (!postingResponse.ok) {
          const errorText = await postingResponse.text();

          // Update job status to failed with error message
          jobOperations.updateStatus(
            jobId,
            'failed',
            videoUrl,
            `External posting failed: ${postingResponse.status} ${postingResponse.statusText}`,
            caption
          );

          return NextResponse.json(
            {
              message: 'Failed to post to external service',
              error: `${postingResponse.status}: ${errorText}`,
            },
            { status: 500 }
          );
        }

        const postingResult = await postingResponse.json();

        // Update job status to 'posted' on success
        jobOperations.updateStatus(
          jobId,
          'posted',
          videoUrl,
          undefined,
          caption
        );

        return NextResponse.json({
          success: true,
          message: 'Reel posted successfully via external service',
          jobId,
          status: 'posted',
          postedAt: new Date().toISOString(),
          externalResult: postingResult,
        });
      } catch {
        // Update job status to failed (network error)
        jobOperations.updateStatus(
          jobId,
          'failed',
          videoUrl,
          `Network error: Unknown error`,
          caption
        );

        return NextResponse.json(
          {
            message: 'Failed to connect to external posting service',
            error: 'Unknown error',
          },
          { status: 500 }
        );
      }
    } else {
      // No external posting URL configured, handle posting internally

      // Simulate internal posting logic
      // You can add specific logic here for different reel types

      // Simulate some processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update job status to 'posted'
      jobOperations.updateStatus(jobId, 'posted', videoUrl, undefined, caption);

      return NextResponse.json({
        success: true,
        message: 'Reel posted successfully (internal processing)',
        jobId,
        status: 'posted',
        postedAt: new Date().toISOString(),
        processingType: 'internal',
        reelType: reelType.title,
      });
    }
  } catch (err) {
    return NextResponse.json(
      {
        message: 'Internal server error',
        details: err instanceof Error ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
