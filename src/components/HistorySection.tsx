import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { type StoredJob } from '@/lib/jobService';

interface HistorySectionProps {
  jobs: StoredJob[];
  refreshingJobs: Set<string>;
  onRefreshJob: (job: StoredJob) => void;
  onClearHistory?: () => void;
  isClearingHistory?: boolean;
}

export default function HistorySection({
  jobs,
  refreshingJobs,
  onRefreshJob,
  onClearHistory,
  isClearingHistory = false,
}: HistorySectionProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle className="h-3 w-3 text-white" />
          </div>
        );
      case 'failed':
        return (
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <AlertCircle className="h-3 w-3 text-white" />
          </div>
        );
      case 'processing':
        return (
          <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
            <Loader className="h-3 w-3 text-white animate-spin" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
            <Clock className="h-3 w-3 text-white" />
          </div>
        );
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Clock className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-gray-900 font-medium">No Jobs Yet</p>
        <p className="text-gray-600 text-sm">
          Generated content will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clear History Button */}
      {jobs.length > 0 && onClearHistory && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearHistory}
            disabled={isClearingHistory}
            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all duration-200"
          >
            {isClearingHistory ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </>
            )}
          </Button>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {jobs.map((job, index) => (
          <div
            key={`${job.job_id}-${index}`}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3 min-w-0 flex-1">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(job.status)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {job.category} - {job.type}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {job.job_id.substring(0, 6)}...
                    </span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                      {job.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onRefreshJob(job);
                  }}
                  disabled={refreshingJobs.has(job.job_id)}
                  className="h-10 w-10 p-0 border-teal-300 text-teal-600 hover:bg-teal-100 hover:border-teal-400 transition-all duration-200 active:scale-95"
                >
                  {refreshingJobs.has(job.job_id) ? (
                    <Loader className="h-5 w-5 animate-spin text-teal-600" />
                  ) : (
                    <RefreshCw className="h-5 w-5" />
                  )}
                </Button>
                {job.result_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(job.result_url, '_blank')}
                    className="h-10 w-10 p-0 border-emerald-300 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-400 transition-all duration-200 active:scale-95"
                    title="Open reel"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
