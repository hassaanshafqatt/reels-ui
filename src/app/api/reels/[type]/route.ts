import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { JobRecord, jobStore, setJob, getJobStoreSize, getAllJobIds } from '@/lib/jobStore';
import { reelTypeOperations, jobOperations } from '@/lib/database';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if request is JSON (now all requests are JSON with optional audio URL)
    const jsonData = await request.json();
    const { reelType, category, generateCaption, customCaption, timestamp, customAuthor, useCustomAudio, customAudioUrl } = jsonData;

    const { type } = await params;

    console.log(`POST request received for type: ${type}`);
    console.log(`Request payload:`, { reelType, category, generateCaption, customCaption, timestamp, useCustomAudio, customAudioUrl });

    // Get configuration for this reel type from database
    const reelTypeData = reelTypeOperations.getByNameOnly(type);
    if (!reelTypeData) {
      console.log(`Unknown reel type: ${type}`);
      return NextResponse.json({ error: `Unknown reel type: ${type}` }, { status: 400 });
    }

    if (!reelTypeData.is_active) {
      console.log(`Inactive reel type: ${type}`);
      return NextResponse.json({ error: `Reel type is not active: ${type}` }, { status: 400 });
    }

    // Generate a unique job ID
    const jobId = randomUUID();
    console.log(`Generated job ID: ${jobId}`);

    // Store job in database first (persistent storage)
    const dbJobId = jobOperations.create(user.id, {
      jobId,
      category,
      type
    });
    console.log(`Stored job in database with ID: ${dbJobId}`);

    // Store initial job record in memory store (for current request processing)
    const jobRecord: JobRecord = {
      jobId,
      type,
      category,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setJob(jobId, jobRecord);
    console.log(`Stored job record with ID: ${jobId}, store size: ${getJobStoreSize()}`);

    // Prepare the payload with job ID
    const payload = {
      jobId,
      reelType,
      category,
      generateCaption,
      customCaption,
      customAuthor: customAuthor || '',
      timestamp,
      type,
      useCustomAudio: !!customAudioUrl,
      customAudioUrl: customAudioUrl || null
    };

    // Update job status to processing
    jobRecord.status = 'processing';
    jobRecord.updatedAt = new Date().toISOString();
    setJob(jobId, jobRecord);
    
    // Also update database
    jobOperations.updateStatus(jobId, 'processing');
    console.log(`Updated job status to processing for: ${jobId}`);

    // If this reel type has an external URL, make a request to it
    if (reelTypeData.external_url) {
      try {
        console.log(`Making external API call to: ${reelTypeData.external_url}`);
        
        // Always send JSON (with audio URL if present)
        const externalResponse = await fetch(reelTypeData.external_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!externalResponse.ok) {
          let errorMessage = `External API error: ${externalResponse.status} - ${externalResponse.statusText}`;
          
          // Provide specific error messages for common HTTP status codes
          if (externalResponse.status === 413) {
            errorMessage = 'The audio file is too large for the external service. Please use a smaller audio file (recommended: under 5MB).';
          } else if (externalResponse.status === 415) {
            errorMessage = 'The audio file format is not supported. Please use MP3, WAV, or M4A format.';
          } else if (externalResponse.status === 400) {
            errorMessage = 'Invalid request data. Please check your inputs and try again.';
          } else if (externalResponse.status >= 500) {
            errorMessage = 'The external service is temporarily unavailable. Please try again later.';
          }
          
          console.log(`External API call failed: ${errorMessage}`);
          
          // Update job status to failed
          jobRecord.status = 'failed';
          jobRecord.error = errorMessage;
          jobRecord.updatedAt = new Date().toISOString();
          setJob(jobId, jobRecord);
          jobOperations.updateStatus(jobId, 'failed', undefined, errorMessage);
          
          throw new Error(errorMessage);
        }

        const externalResult = await externalResponse.json();
        
        // Don't immediately set to completed - let the job stay processing
        // The status will be updated via the status polling endpoint
        console.log(`External API call successful for job: ${jobId}, keeping status as processing`);
        console.log(`External API response:`, externalResult);
        
        // Update job record with the external result but keep processing status
        jobRecord.result = externalResult;
        jobRecord.updatedAt = new Date().toISOString();
        setJob(jobId, jobRecord);
        
        // Return the external result with our local config merged in
        return NextResponse.json({
          ...externalResult,
          jobId,
          message: reelTypeData.message || `${reelTypeData.title} reel generation started successfully`,
          type,
          category,
          generatedAt: timestamp,
          caption: generateCaption ? reelTypeData.caption : customCaption,
          content: {
            theme: type,
            description: reelTypeData.description,
            externalData: externalResult
          }
        });
      } catch (externalError) {
        console.error('External API call failed:', externalError);
        
        // Update job record with failure
        jobRecord.status = 'failed';
        jobRecord.updatedAt = new Date().toISOString();
        jobRecord.error = externalError instanceof Error ? externalError.message : String(externalError);
        setJob(jobId, jobRecord);
        
        // Also update database
        jobOperations.updateStatus(jobId, 'failed', undefined, jobRecord.error);
        
        // Return error - do not fall back to local processing
        return NextResponse.json(
          { 
            error: `Failed to generate ${reelTypeData.title} reel`,
            details: externalError instanceof Error ? externalError.message : String(externalError),
            jobId,
            type,
            category
          }, 
          { status: 500 }
        );
      }
    }

    // If we reach here, there's no external URL configured
    console.log(`No external URL configured for reel type: ${type}`);
    
    // Update job record with failure
    jobRecord.status = 'failed';
    jobRecord.updatedAt = new Date().toISOString();
    jobRecord.error = 'No external URL configured for this reel type';
    setJob(jobId, jobRecord);
    
    // Also update database
    jobOperations.updateStatus(jobId, 'failed', undefined, jobRecord.error);
    
    return NextResponse.json(
      { 
        error: `No external URL configured for ${reelTypeData.title} reel`,
        details: 'This reel type requires an external webhook URL to be configured',
        jobId,
        type,
        category
      }, 
      { status: 400 }
    );
  } catch (error) {
    console.error('Error generating reel:', error);
    return NextResponse.json({ error: 'Failed to generate reel' }, { status: 500 });
  }
}
