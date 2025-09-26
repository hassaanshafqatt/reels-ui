// Job management utilities for client-side
import { getAuthToken, getAuthHeaders } from './clientAuth';

interface StoredJob {
  id: string;
  user_id: string;
  job_id: string;
  category: string;
  type: string;
  status:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'approved'
    | 'posted'
    | 'rejected';
  result_url?: string;
  caption?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Use shared client auth helpers

export const jobService = {
  // Get all jobs for the current user
  async getJobs(): Promise<StoredJob[]> {
    try {
      const token = getAuthToken();
      void token;

      const response = await fetch('/api/jobs', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      return data.jobs || [];
    } catch {
      return [];
    }
  },

  // Create a new job
  async createJob(jobData: {
    jobId: string;
    category: string;
    type: string;
  }): Promise<boolean> {
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      return true;
    } catch {
      return false;
    }
  },

  // Update job status
  async updateJobStatus(
    jobId: string,
    status: string,
    resultUrl?: string,
    errorMessage?: string,
    caption?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, resultUrl, errorMessage, caption }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job');
      }

      return true;
    } catch {
      return false;
    }
  },

  // Clear all job history for the current user
  async clearAllJobs(): Promise<boolean> {
    try {
      const response = await fetch('/api/jobs', {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to clear job history');
      }

      return true;
    } catch {
      return false;
    }
  },

  // Clear job history for a specific category
  async clearJobsByCategory(category?: string): Promise<boolean> {
    try {
      const url = category
        ? `/api/jobs?category=${encodeURIComponent(category)}`
        : '/api/jobs';
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to clear job history');
      }

      return true;
    } catch {
      return false;
    }
  },

  // Check job status via status API
  async checkJobStatus(
    jobId: string,
    type: string
  ): Promise<{
    status: string;
    result_url?: string;
    shouldStopPolling?: boolean;
  }> {
    try {
      const url = `/api/reels/status?jobId=${encodeURIComponent(jobId)}&type=${encodeURIComponent(type)}`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      // If server responds OK, return parsed result (may include shouldStopPolling)
      if (response.ok) {
        const result = await response.json();
        return result;
      }

      // If job is not found, treat it as a stop condition
      if (response.status === 404) {
        return { status: 'failed', shouldStopPolling: true };
      }

      // Try to parse a JSON body — if the server explicitly included shouldStopPolling, honor it
      try {
        const parsed = await response.json();
        if (
          parsed &&
          typeof parsed === 'object' &&
          Object.prototype.hasOwnProperty.call(parsed, 'shouldStopPolling')
        ) {
          return parsed as {
            status: string;
            result_url?: string;
            shouldStopPolling?: boolean;
          };
        }
      } catch {
        // ignore parse errors
      }

      // For other non-OK responses without explicit shouldStopPolling, throw so callers can treat
      // this as a transient error (and avoid stopping polling immediately on a single failure).
      throw new Error(`Status check failed with HTTP ${response.status}`);
    } catch {
      // Propagate error to caller — do not silently tell the client to stop polling.
      throw new Error('Network error during status check');
    }
  },

  // Delete audio file by URL
  async deleteAudioFile(audioUrl: string): Promise<boolean> {
    try {
      // Extract filename from URL
      const url = new URL(audioUrl);
      const pathParts = url.pathname.split('/');
      const filename = pathParts[pathParts.length - 1];

      if (!filename) {
        return false;
      }

      const token = getAuthToken();
      const response = await fetch(`/api/uploads/audio/${filename}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        return false;
      }

      // response body not needed here
      void token;
      return true;
    } catch {
      return false;
    }
  },
};

export type { StoredJob };
