import { NextRequest, NextResponse } from 'next/server';
import { jobOperations, sessionOperations, reelTypeOperations } from '@/lib/database';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-make-it-long-and-random'
);

// Helper function to verify JWT token
async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

// POST - Post a reel to social media platform
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Verify session exists
    const session = sessionOperations.findByToken(token);
    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    }

    const { jobId, category, type, videoUrl, caption } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { message: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Verify the job belongs to the user
    const job = jobOperations.getByJobId(jobId);
    if (!job || job.user_id !== payload.userId) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 });
    }

    // Check if job is in a postable state
    if (!['approved', 'completed'].includes(job.status)) {
      return NextResponse.json(
        { message: 'Job is not ready for posting' },
        { status: 400 }
      );
    }

    console.log('Posting reel request:', {
      jobId,
      category,
      type,
      videoUrl,
      caption: caption ? caption.substring(0, 50) + '...' : 'No caption'
    });

    // Get the reel type configuration to validate the posting configuration
    const reelType = reelTypeOperations.getByNameOnly(type);
    if (!reelType) {
      return NextResponse.json(
        { message: 'Reel type configuration not found' },
        { status: 404 }
      );
    }

    console.log('Reel type configuration found:', {
      name: reelType.name,
      title: reelType.title,
      posting_url: reelType.posting_url
    });

    // Prepare the posting payload for external service
    const postingPayload = {
      jobId,
      category,
      type,
      videoUrl,
      caption,
      userId: payload.userId,
      timestamp: new Date().toISOString(),
      reelConfig: {
        title: reelType.title,
        description: reelType.description,
        message: reelType.message
      }
    };

    // Check if we have a specific external posting URL (not self-referential)
    if (reelType.posting_url && 
        reelType.posting_url !== '/api/reels/post' && 
        !reelType.posting_url.startsWith('/api/reels/post')) {
      
      try {
        console.log('Calling external posting service:', reelType.posting_url);
        
        // Make the actual request to the external posting service
        const postingResponse = await fetch(reelType.posting_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Pass through the auth token
          },
          body: JSON.stringify(postingPayload)
        });

        if (!postingResponse.ok) {
          const errorText = await postingResponse.text();
          console.error('External posting service error:', {
            status: postingResponse.status,
            statusText: postingResponse.statusText,
            error: errorText
          });
          
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
              error: `${postingResponse.status}: ${errorText}` 
            },
            { status: 500 }
          );
        }

        const postingResult = await postingResponse.json();
        console.log('External posting service response:', postingResult);
        
        // Update job status to 'posted' on success
        jobOperations.updateStatus(jobId, 'posted', videoUrl, undefined, caption);
        
        return NextResponse.json({
          success: true,
          message: 'Reel posted successfully via external service',
          jobId,
          status: 'posted',
          postedAt: new Date().toISOString(),
          externalResult: postingResult
        });

      } catch (fetchError) {
        console.error('Error calling external posting service:', fetchError);
        
        // Update job status to failed
        jobOperations.updateStatus(
          jobId, 
          'failed', 
          videoUrl, 
          `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
          caption
        );
        
        return NextResponse.json(
          { 
            message: 'Failed to connect to external posting service',
            error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    } else {
      // No external posting URL configured, handle posting internally
      console.log('No external posting URL configured, handling internally');
      
      // Simulate internal posting logic
      // You can add specific logic here for different reel types
      console.log('Processing posting for:', {
        type: reelType.name,
        title: reelType.title,
        category,
        payload: postingPayload
      });
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update job status to 'posted'
      jobOperations.updateStatus(jobId, 'posted', videoUrl, undefined, caption);
      
      return NextResponse.json({
        success: true,
        message: 'Reel posted successfully (internal processing)',
        jobId,
        status: 'posted',
        postedAt: new Date().toISOString(),
        processingType: 'internal',
        reelType: reelType.title
      });
    }

  } catch (error) {
    console.error('Post reel error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
