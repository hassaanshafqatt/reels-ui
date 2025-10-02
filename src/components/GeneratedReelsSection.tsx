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
  const [activeFilter, setActiveFilter] = React.useState<
    'all' | 'completed' | 'processing' | 'failed'
  >('all');
  const [showAll, setShowAll] = React.useState(false);

  const completedJobs = jobs.filter((job) => job.status === 'completed');
  const processingJobs = jobs.filter((job) => job.status === 'processing');
  const failedJobs = jobs.filter((job) => job.status === 'failed');

  // Get filtered jobs based on active filter
  const getFilteredJobs = () => {
    switch (activeFilter) {
      case 'completed':
        return completedJobs;
      case 'processing':
        return processingJobs;
      case 'failed':
        return failedJobs;
      default:
        return jobs;
    }
  };

  const filteredJobs = getFilteredJobs();
  const displayJobs = showAll ? filteredJobs : filteredJobs.slice(0, 6);

  return (
    <Card className="border-0 shadow-lg bg-white rounded-xl overflow-hidden">
      <CardHeader className="pb-4 sm:pb-5 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white border-b">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex-1 min-w-0 space-y-1.5">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
              Generated Content
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="leading-relaxed">
                Review and post your generated content immediately
              </span>
              {isPolling && (
                <span
                  className="inline-flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                  <span className="text-xs font-medium">Auto-updating</span>
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {jobs.length === 0 ? (
          <div className="text-center py-12 sm:py-16 lg:py-20 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-sm">
              <Instagram className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
              No content generated yet
            </h3>
            <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-relaxed">
              Generate your first piece of content in this category to see it
              here for immediate posting
            </p>
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 sm:gap-2.5 pb-4 border-b-2">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setActiveFilter('all');
                  setShowAll(false);
                }}
                className={`text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 font-medium rounded-lg transition-all ${
                  activeFilter === 'all' ? 'shadow-md' : 'hover:bg-gray-50'
                }`}
                aria-label={`Show all ${jobs.length} jobs`}
              >
                All{' '}
                <span className="ml-1.5 font-semibold">({jobs.length})</span>
              </Button>
              <Button
                variant={activeFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setActiveFilter('completed');
                  setShowAll(false);
                }}
                className={`text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 font-medium rounded-lg transition-all ${
                  activeFilter === 'completed'
                    ? 'shadow-md'
                    : 'hover:bg-gray-50'
                }`}
                aria-label={`Show completed ${completedJobs.length} jobs`}
              >
                Completed{' '}
                <span className="ml-1.5 font-semibold">
                  ({completedJobs.length})
                </span>
              </Button>
              <Button
                variant={activeFilter === 'processing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setActiveFilter('processing');
                  setShowAll(false);
                }}
                className={`text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 font-medium rounded-lg transition-all ${
                  activeFilter === 'processing'
                    ? 'shadow-md'
                    : 'hover:bg-gray-50'
                }`}
                aria-label={`Show processing ${processingJobs.length} jobs`}
              >
                Processing{' '}
                <span className="ml-1.5 font-semibold">
                  ({processingJobs.length})
                </span>
              </Button>
              <Button
                variant={activeFilter === 'failed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setActiveFilter('failed');
                  setShowAll(false);
                }}
                className={`text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4 font-medium rounded-lg transition-all ${
                  activeFilter === 'failed' ? 'shadow-md' : 'hover:bg-gray-50'
                }`}
                aria-label={`Show failed ${failedJobs.length} jobs`}
              >
                Failed{' '}
                <span className="ml-1.5 font-semibold">
                  ({failedJobs.length})
                </span>
              </Button>
            </div>

            {/* Jobs Grid */}
            {filteredJobs.length === 0 ? (
              <div className="text-center py-10 sm:py-12 bg-gray-50 rounded-xl">
                <p className="text-sm sm:text-base text-gray-500 font-medium">
                  No {activeFilter !== 'all' && activeFilter} jobs found
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                  {displayJobs.map((job, index) => (
                    <JobStatusCard
                      key={`${job.job_id}-${index}`}
                      job={job}
                      isRefreshing={refreshingJobs.has(job.job_id)}
                      onRefresh={onRefreshJob}
                    />
                  ))}
                </div>

                {/* Show More/Less Button */}
                {filteredJobs.length > 6 && (
                  <div className="text-center pt-5 sm:pt-6 border-t-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAll(!showAll)}
                      className="text-sm sm:text-base h-10 sm:h-11 px-6 sm:px-8 font-medium rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                      aria-label={
                        showAll
                          ? 'Show less'
                          : `View all ${filteredJobs.length} items`
                      }
                    >
                      {showAll
                        ? 'Show Less'
                        : `View All ${filteredJobs.length} Items`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
