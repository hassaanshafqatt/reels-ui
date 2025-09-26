import { NextRequest, NextResponse } from 'next/server';
import { JobRecord, getJob, setJob } from '@/lib/jobStore';
import { jobOperations, reelTypeOperations } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');
    const type = url.searchParams.get('type');

    if (!jobId || !type) {
      return NextResponse.json(
        { error: 'jobId and type parameters are required' },
        { status: 400 }
      );
    }

    // Check both memory store and database for the job
    let jobRecord = getJob(jobId);
    let dbJob = null;

    if (!jobRecord) {
      // Try to find the job in the database
      dbJob = jobOperations.getByJobId(jobId);
      if (!dbJob) {
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
        error: dbJob.error_message || undefined,
      };

      // Optionally restore to memory store
      setJob(jobId, jobRecord);
    } else {
      // Job is in memory, but we still need the database record for poll tracking
      dbJob = jobOperations.getByJobId(jobId);
      if (!dbJob) {
      }
    }

    // Get the reel config for this type from database
    const reelTypeData = reelTypeOperations.getByNameOnly(type);
    if (!reelTypeData) {
      return NextResponse.json({ error: 'Unknown reel type' }, { status: 400 });
    }

    // If there's a status URL, hit it with the job ID
    if (reelTypeData.status_url) {
      try {
        const isExternalUrl = /^https?:\/\//i.test(reelTypeData.status_url);
        const origin =
          request.headers.get('origin') ||
          process.env.NEXT_PUBLIC_BASE_URL ||
          process.env.NEXTAUTH_URL ||
          '';
        const base = origin || 'http://localhost:3000';
        const statusUrl = isExternalUrl
          ? reelTypeData.status_url
          : `${base}${reelTypeData.status_url}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const statusResponse = await fetch(
          `${statusUrl}?jobId=${encodeURIComponent(jobId)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (statusResponse.ok) {
          const statusResult = await statusResponse.json();

          // Extract status and other relevant information from the response
          let newStatus = jobRecord.status; // Default to current status
          let reelLink = null;
          let caption = null;
          const updatedResult = statusResult;
          let errorMessage = null;

          // Check for errors in the response first
          if (
            statusResult.error ||
            statusResult.message?.includes('error') ||
            statusResult.message?.includes('Error')
          ) {
            newStatus = 'failed';
            errorMessage =
              statusResult.error ||
              statusResult.message ||
              'Unknown error from status check';
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
            newStatus = jobRecord.status;
          }

          // Try to extract reel link from common response formats
          // Also support nested shapes like { result: { result_url, caption } }
          const maybeResult = statusResult.result || statusResult.data || null;

          const extractUrl = (obj: unknown): string | null => {
            if (!obj || typeof obj !== 'object') return null;
            const o = obj as Record<string, unknown>;

            const asString = (k: string): string | null => {
              const v = o[k];
              return typeof v === 'string' && v.length > 0 ? v : null;
            };

            return (
              asString('reelUrl') ||
              asString('videoUrl') ||
              asString('videoURL') ||
              asString('downloadUrl') ||
              asString('result_url') ||
              asString('url') ||
              asString('link') ||
              null
            );
          };

          // top-level
          reelLink = extractUrl(statusResult) || null;
          // nested
          if (!reelLink) {
            reelLink = extractUrl(maybeResult) || null;
          }

          // Try to extract caption from the response (support nested too)
          if (statusResult.caption) {
            caption = statusResult.caption;
          } else if (
            maybeResult &&
            (maybeResult as Record<string, unknown>).caption
          ) {
            caption = (maybeResult as Record<string, unknown>)
              .caption as string;
          }

          // Normalize various shapes into an array of URLs (best-effort)
          const parseUrlsCandidate = (candidate: unknown): string[] => {
            if (!candidate) return [];

            // Already an array of strings
            if (
              Array.isArray(candidate) &&
              candidate.every((v) => typeof v === 'string')
            ) {
              return candidate as string[];
            }

            // If candidate is an object with media/urls/result_url
            if (typeof candidate === 'object' && candidate !== null) {
              const obj = candidate as Record<string, unknown>;
              if (Array.isArray(obj.media)) {
                return obj.media
                  .map((m) => {
                    if (typeof m === 'string') return m;
                    if (
                      m &&
                      typeof (m as Record<string, unknown>).url === 'string'
                    )
                      return (m as Record<string, unknown>).url as string;
                    return null;
                  })
                  .filter(Boolean) as string[];
              }
              if (
                Array.isArray(obj.urls) &&
                obj.urls.every((u) => typeof u === 'string')
              ) {
                return obj.urls as string[];
              }
              if (typeof obj.result_url === 'string') {
                return parseUrlsCandidate(obj.result_url);
              }
            }

            // If it's a string: try JSON.parse first, then fallback to comma-split (trim brackets)
            if (typeof candidate === 'string') {
              const s = candidate.trim();
              try {
                const parsed = JSON.parse(s);
                if (
                  Array.isArray(parsed) &&
                  parsed.every((p) => typeof p === 'string')
                ) {
                  return parsed as string[];
                }
              } catch {
                // not valid JSON
              }

              // bracketed but not JSON (e.g. [url1,url2]) or comma-separated
              let inner = s;
              if (inner.startsWith('[') && inner.endsWith(']')) {
                inner = inner.slice(1, -1);
              }
              return inner
                .split(',')
                .map((u) => u.trim())
                .filter(Boolean);
            }

            return [];
          };

          // Build canonical URL array from nested result or top-level
          const rawCandidate =
            maybeResult?.result_url ??
            maybeResult ??
            statusResult?.result_url ??
            statusResult?.result ??
            statusResult;
          const urls = parseUrlsCandidate(rawCandidate);

          if (urls.length > 0) {
            // attach media array to updatedResult for client consumption
            (updatedResult as Record<string, unknown>).media = urls.map(
              (u) => ({ url: u })
            );
            // prefer first URL as reelLink if not already set
            if (!reelLink && urls[0]) reelLink = urls[0];
          }

          // Prepare DB result_url value: JSON stringify when multiple, single string otherwise
          const dbResultUrl =
            urls.length > 1 ? JSON.stringify(urls) : urls[0] || null;

          // Development debug: log extracted values to help troubleshooting
          if (process.env.NODE_ENV !== 'production') {
            try {
              console.debug('statusResult extraction', {
                jobId,
                newStatus,
                reelLink,
                caption,
                errorMessage,
                updatedResult: statusResult,
              });
            } catch {
              // ignore logging errors
            }
          }

          // Update the job record with the new status information
          const updatedJob: JobRecord = {
            ...jobRecord,
            status: newStatus as JobRecord['status'],
            updatedAt: new Date().toISOString(),
            result: updatedResult,
            error: errorMessage || jobRecord.error,
          };

          // Update both memory store and database with poll tracking
          setJob(jobId, updatedJob);

          // Update database with new status and poll tracking
          if (dbJob) {
            const updateResult = jobOperations.updateStatusWithPollTracking(
              jobId,
              newStatus,
              dbResultUrl || undefined,
              errorMessage || undefined,
              caption || undefined // caption from external response
            );

            // Update the job record with the actual final status from poll tracking
            const finalUpdatedJob: JobRecord = {
              ...updatedJob,
              status: updateResult.status as JobRecord['status'],
              pollCount: updateResult.pollCount,
              shouldStopPolling: updateResult.shouldStopPolling,
            };
            setJob(jobId, finalUpdatedJob);

            // If we should stop polling, return a special indicator
            if (updateResult.shouldStopPolling) {
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
                pollCount: updateResult.pollCount,
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
              pollCount: updateResult.pollCount,
            });
          } else {
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
              reelLink: reelLink,
            });
          }
        } else {
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
                pollCount: updateResult.pollCount,
              });
            }
          }
        }
      } catch (statusError) {
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
              pollCount: updateResult.pollCount,
            });
          }
        }
      }
    } else {
      // No status URL configured, but we should still track polling to avoid infinite polling
      if (dbJob) {
        const updateResult = jobOperations.updateStatusWithPollTracking(
          jobId,
          jobRecord.status, // Keep current status
          undefined, // No result URL
          undefined, // No error message
          undefined // No caption update
        );

        if (updateResult.shouldStopPolling) {
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
            pollCount: updateResult.pollCount,
          });
        }
      }
    }

    // Return the stored job record if no status URL or if status URL failed
    return NextResponse.json({
      jobId: jobRecord.jobId,
      type: jobRecord.type,
      category: jobRecord.category,
      status: jobRecord.status,
      createdAt: jobRecord.createdAt,
      updatedAt: jobRecord.updatedAt,
      result: jobRecord.result,
      error: jobRecord.error,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
}
