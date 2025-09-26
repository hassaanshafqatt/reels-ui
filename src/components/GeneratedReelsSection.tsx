import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Instagram, RefreshCw, Clock } from 'lucide-react';
import { type StoredJob } from '@/lib/jobService';
import JobStatusCard from '@/components/JobStatusCard';

interface GeneratedReelsSectionProps {
  jobs: StoredJob[];
  refreshingJobs: Set<string>;
  onRefreshJob: (job: StoredJob) => void;
  isPolling?: boolean;
  onManualRefresh?: () => void;
}

export default function GeneratedReelsSection({
  jobs,
  refreshingJobs,
  onRefreshJob,
  isPolling = false,
  onManualRefresh,
}: GeneratedReelsSectionProps) {
  // Debug: Log when jobs change
  React.useEffect(() => {
    // Jobs prop changed tracking
  }, [jobs]);

  const completedJobs = jobs.filter((job) => job.status === 'completed');
  const processingJobs = jobs.filter((job) => job.status === 'processing');
  const failedJobs = jobs.filter((job) => job.status === 'failed');

  // Filter out failed jobs for display in Generated Reels section
  const displayJobs = jobs.filter((job) => job.status !== 'failed');

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              Generated Reels
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 mt-1">
              Review and post your generated content immediately
              {isPolling && (
                <span
                  className="inline-flex items-center ml-2 text-blue-600"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Auto-updating...
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-teal-600 border-teal-200 bg-teal-50"
              aria-label={`${completedJobs.length} reels ready`}
            >
              {completedJobs.length} Ready
            </Badge>
            {onManualRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onManualRefresh}
                aria-label="Refresh job statuses"
                className="text-gray-600 hover:text-gray-900"
                title="Refresh job statuses"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayJobs.length === 0 ? (
          <div className="text-center py-10 sm:py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Instagram className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reels generated yet
            </h3>
            <p className="text-gray-600 mb-4">
              Generate your first reel in this category to see it here for
              immediate posting
            </p>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() =>
                document
                  .querySelector('[role="tablist"]')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              aria-label="Scroll to generation section"
            >
              Generate Your First Reel
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 border-b pb-3">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                aria-label={`Show all ${jobs.length} jobs`}
              >
                All ({jobs.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                aria-label={`Show completed ${completedJobs.length} jobs`}
              >
                Completed ({completedJobs.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                aria-label={`Show processing ${processingJobs.length} jobs`}
              >
                Processing ({processingJobs.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                aria-label={`Show failed ${failedJobs.length} jobs`}
              >
                Failed ({failedJobs.length})
              </Button>
            </div>

            {/* Jobs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {displayJobs.slice(0, 6).map((job, index) => (
                <JobStatusCard
                  key={`${job.job_id}-${index}`}
                  job={job}
                  isRefreshing={refreshingJobs.has(job.job_id)}
                  onRefresh={onRefreshJob}
                />
              ))}
            </div>

            {/* Show More Button */}
            {displayJobs.length > 6 && (
              <div className="text-center pt-3 sm:pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`View all ${displayJobs.length} reels`}
                >
                  View All {displayJobs.length} Reels
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
