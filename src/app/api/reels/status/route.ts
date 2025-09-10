import { NextRequest, NextResponse } from 'next/server';
import { JobRecord, getJob, getJobStoreSize, getAllJobIds, setJob } from '@/lib/jobStore';
import { jobOperations, reelTypeOperations } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('Status GET request received');
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');
    const type = url.searchParams.get('type');

    console.log(`Checking status for jobId: ${jobId}, type: ${type}`);
    console.log(`Current job store size: ${getJobStoreSize()}`);
    console.log(`All job IDs in store: ${getAllJobIds().join(', ')}`);

    if (!jobId || !type) {
      console.log('Missing required parameters');
      return NextResponse.json({ error: 'jobId and type parameters are required' }, { status: 400 });
    }

    // Check both memory store and database for the job
    let jobRecord = getJob(jobId);
    let dbJob = null;
    
    if (!jobRecord) {
      // Try to find the job in the database
      dbJob = jobOperations.getByJobId(jobId);
      if (!dbJob) {
        console.log(`Job not found in store or database for ID: ${jobId}`);
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      
      // Convert database job to JobRecord format and store in memory for this request
      jobRecord = {
        jobId: dbJob.job_id,
        type: dbJob.type,
        category: dbJob.category,
        status: dbJob.status as JobRecord['status'],
        createdAt: dbJob.created_at,
        updatedAt: dbJob.updated_at,
        result: dbJob.result_url ? { url: dbJob.result_url } : undefined,
        error: dbJob.error_message || undefined
      };
      
      // Optionally restore to memory store
      setJob(jobId, jobRecord);
      console.log(`Job ${jobId} restored from database to memory store`);
    } else {
      // Job is in memory, but we still need the database record for poll tracking
      dbJob = jobOperations.getByJobId(jobId);
      if (!dbJob) {
        console.log(`Warning: Job ${jobId} exists in memory but not in database`);
      }
    }

    // Get the reel config for this type from database
    const reelTypeData = reelTypeOperations.getByNameOnly(type);
    if (!reelTypeData) {
      console.log(`Unknown reel type: ${type}`);
      return NextResponse.json({ error: 'Unknown reel type' }, { status: 400 });
    }

    // If there's a status URL, hit it with the job ID
    if (reelTypeData.status_url) {
      try {
        const isExternalUrl = reelTypeData.status_url.startsWith('http');
        const statusUrl = isExternalUrl ? reelTypeData.status_url : `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${reelTypeData.status_url}`;
        
        console.log(`Hitting status URL: ${statusUrl} with jobId: ${jobId}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const statusResponse = await fetch(`${statusUrl}?jobId=${jobId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (statusResponse.ok) {
          const statusResult = await statusResponse.json();
          console.log(`Status URL response:`, statusResult);
          
          // Extract status and other relevant information from the response
          let newStatus = jobRecord.status; // Default to current status
          let reelLink = null;
          let caption = null;
          const updatedResult = statusResult;
          let errorMessage = null;
          
          // Check for errors in the response first
          if (statusResult.error || statusResult.message?.includes('error') || statusResult.message?.includes('Error')) {
            newStatus = 'failed';
            errorMessage = statusResult.error || statusResult.message || 'Unknown error from status check';
            console.log(`Error detected in status response, setting status to failed: ${errorMessage}`);
          }
          // Try to extract status from common response formats if no error
          else if (statusResult.status) {
            newStatus = statusResult.status.toLowerCase();
          } else if (statusResult.state) {
            newStatus = statusResult.state.toLowerCase();
          } else if (statusResult.job_status) {
            newStatus = statusResult.job_status.toLowerCase();
          }
          // If no status field found and no error, assume no change
          else {
            console.log(`No status field found in response, keeping current status: ${jobRecord.status}`);
            newStatus = jobRecord.status;
          }
          
          // Try to extract reel link from common response formats
          if (statusResult.reelUrl) {
            reelLink = statusResult.reelUrl;
          } else if (statusResult.videoUrl) {
            reelLink = statusResult.videoUrl;
          } else if (statusResult.videoURL) {
            reelLink = statusResult.videoURL;
          } else if (statusResult.downloadUrl) {
            reelLink = statusResult.downloadUrl;
          } else if (statusResult.url) {
            reelLink = statusResult.url;
          } else if (statusResult.link) {
            reelLink = statusResult.link;
          }
          
          // Try to extract caption from the response
          if (statusResult.caption) {
            caption = statusResult.caption;
          }
          
          // Update the job record with the new status information
          const updatedJob: JobRecord = {
            ...jobRecord,
            status: newStatus as JobRecord['status'],
            updatedAt: new Date().toISOString(),
            result: updatedResult,
            error: errorMessage || jobRecord.error
          };
          
          // Update both memory store and database with poll tracking
          setJob(jobId, updatedJob);
          
          console.log(`About to update database poll tracking for ${jobId}, dbJob exists: ${!!dbJob}`);
          
          // Update database with new status and poll tracking
          if (dbJob) {
            const updateResult = jobOperations.updateStatusWithPollTracking(
              jobId, 
              newStatus, 
              reelLink || undefined, 
              errorMessage || undefined, 
              caption || undefined // caption from external response
            );
            
            // Update the job record with the actual final status from poll tracking
            const finalUpdatedJob: JobRecord = {
              ...updatedJob,
              status: updateResult.status as JobRecord['status'],
              pollCount: updateResult.pollCount,
              shouldStopPolling: updateResult.shouldStopPolling
            };
            setJob(jobId, finalUpdatedJob);
            
            console.log(`Updated job ${jobId} in database with status: ${updateResult.status} (poll count: ${updateResult.pollCount}, failure count: ${updateResult.failureCount})`);
            
            console.log(`Poll tracking result for ${jobId}:`, updateResult);
            
            // If we should stop polling, return a special indicator
            if (updateResult.shouldStopPolling) {
              console.log(`Job ${jobId} polling limit reached or completed - client should stop polling`);
              return NextResponse.json({
                jobId: finalUpdatedJob.jobId,
                type: finalUpdatedJob.type,
                category: finalUpdatedJob.category,
                status: finalUpdatedJob.status,
                createdAt: finalUpdatedJob.createdAt,
                updatedAt: finalUpdatedJob.updatedAt,
                result: finalUpdatedJob.result,
                error: finalUpdatedJob.error,
                reelLink: reelLink,
                shouldStopPolling: true,
                pollCount: updateResult.pollCount
              });
            }
            
            // Return normal response with poll count
            return NextResponse.json({
              jobId: finalUpdatedJob.jobId,
              type: finalUpdatedJob.type,
              category: finalUpdatedJob.category,
              status: finalUpdatedJob.status,
              createdAt: finalUpdatedJob.createdAt,
              updatedAt: finalUpdatedJob.updatedAt,
              result: finalUpdatedJob.result,
              error: finalUpdatedJob.error,
              reelLink: reelLink,
              pollCount: updateResult.pollCount
            });
          } else {
            console.log(`No database job found for ${jobId}, skipping poll tracking`);
            // No database job, just return the memory record
            return NextResponse.json({
              jobId: updatedJob.jobId,
              type: updatedJob.type,
              category: updatedJob.category,
              status: updatedJob.status,
              createdAt: updatedJob.createdAt,
              updatedAt: updatedJob.updatedAt,
              result: updatedJob.result,
              error: updatedJob.error,
              reelLink: reelLink
            });
          }
        } else {
          console.log(`Status URL returned error: ${statusResponse.status} ${statusResponse.statusText}`);
          // Even if status URL fails, we should track the polling attempt
          if (dbJob) {
            const updateResult = jobOperations.updateStatusWithPollTracking(
              jobId, 
              jobRecord.status, // Keep current status
              undefined, // No new result URL
              `Status check failed: ${statusResponse.status}`, // Error message
              undefined // No caption update
            );
            
            if (updateResult.shouldStopPolling) {
              console.log(`Job ${jobId} polling limit reached due to repeated failures - client should stop polling`);
              return NextResponse.json({
                jobId: jobRecord.jobId,
                type: jobRecord.type,
                category: jobRecord.category,
                status: updateResult.status,
                createdAt: jobRecord.createdAt,
                updatedAt: jobRecord.updatedAt,
                result: jobRecord.result,
                error: jobRecord.error,
                shouldStopPolling: true,
                pollCount: updateResult.pollCount
              });
            }
          }
        }
      } catch (statusError) {
        console.error(`Error calling status URL:`, statusError);
        // Track the polling attempt even if there's a network error
        if (dbJob) {
          const updateResult = jobOperations.updateStatusWithPollTracking(
            jobId, 
            jobRecord.status, // Keep current status
            undefined, // No new result URL
            `Network error during status check: ${statusError instanceof Error ? statusError.message : String(statusError)}`, // Error message
            undefined // No caption update
          );
          
          if (updateResult.shouldStopPolling) {
            console.log(`Job ${jobId} polling limit reached due to network errors - client should stop polling`);
            return NextResponse.json({
              jobId: jobRecord.jobId,
              type: jobRecord.type,
              category: jobRecord.category,
              status: updateResult.status,
              createdAt: jobRecord.createdAt,
              updatedAt: jobRecord.updatedAt,
              result: jobRecord.result,
              error: jobRecord.error,
              shouldStopPolling: true,
              pollCount: updateResult.pollCount
            });
          }
        }
      }
    } else {
      // No status URL configured, but we should still track polling to avoid infinite polling
      console.log(`No status URL configured for reel type: ${type}, tracking poll anyway`);
      if (dbJob) {
        const updateResult = jobOperations.updateStatusWithPollTracking(
          jobId, 
          jobRecord.status, // Keep current status
          undefined, // No result URL
          undefined, // No error message
          undefined // No caption update
        );
        
        if (updateResult.shouldStopPolling) {
          console.log(`Job ${jobId} polling limit reached (no status URL) - client should stop polling`);
          return NextResponse.json({
            jobId: jobRecord.jobId,
            type: jobRecord.type,
            category: jobRecord.category,
            status: updateResult.status,
            createdAt: jobRecord.createdAt,
            updatedAt: jobRecord.updatedAt,
            result: jobRecord.result,
            error: jobRecord.error,
            shouldStopPolling: true,
            pollCount: updateResult.pollCount
          });
        }
      }
    }

    // Return the stored job record if no status URL or if status URL failed
    console.log(`Returning stored job record:`, jobRecord);
    return NextResponse.json({
      jobId: jobRecord.jobId,
      type: jobRecord.type,
      category: jobRecord.category,
      status: jobRecord.status,
      createdAt: jobRecord.createdAt,
      updatedAt: jobRecord.updatedAt,
      result: jobRecord.result,
      error: jobRecord.error
    });
  } catch (error) {
    console.error('Error checking job status:', error);
    return NextResponse.json({ error: 'Failed to check job status' }, { status: 500 });
  }
}
