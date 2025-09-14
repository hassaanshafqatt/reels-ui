// Job management utilities for client-side
import Cookies from 'js-cookie';

interface StoredJob {
  id: string;
  user_id: string;
  job_id: string;
  category: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'approved' | 'posted' | 'rejected';
  result_url?: string;
  caption?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Get auth token from cookies
const getAuthToken = (): string | null => {
  return Cookies.get('auth_token') || null;
};

// Create headers with auth token
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const jobService = {
  // Get all jobs for the current user
  async getJobs(): Promise<StoredJob[]> {
    try {
      const token = getAuthToken();
      console.log('JobService: Getting jobs, token exists:', !!token);
      
      const response = await fetch('/api/jobs', {
        headers: getAuthHeaders(),
      });

      console.log('JobService: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('JobService: Failed to fetch jobs:', response.status, errorText);
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      console.log('JobService: Received data:', data);
      return data.jobs || [];
    } catch (error) {
      console.error('JobService: Error fetching jobs:', error);
      return [];
    }
  },

  // Create a new job
  async createJob(jobData: { jobId: string; category: string; type: string }): Promise<boolean> {
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
    } catch (error) {
      console.error('Error creating job:', error);
      return false;
    }
  },

  // Update job status
  async updateJobStatus(jobId: string, status: string, resultUrl?: string, errorMessage?: string, caption?: string): Promise<boolean> {
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
    } catch (error) {
      console.error('Error updating job:', error);
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
    } catch (error) {
      console.error('Error clearing job history:', error);
      return false;
    }
  },

  // Clear job history for a specific category
  async clearJobsByCategory(category?: string): Promise<boolean> {
    try {
      const url = category ? `/api/jobs?category=${encodeURIComponent(category)}` : '/api/jobs';
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to clear job history');
      }

      return true;
    } catch (error) {
      console.error('Error clearing job history:', error);
      return false;
    }
  },

  // Check job status via status API
  async checkJobStatus(jobId: string, type: string): Promise<{ status: string; result_url?: string; shouldStopPolling?: boolean }> {
    try {
      const url = `/api/reels/status?jobId=${encodeURIComponent(jobId)}&type=${encodeURIComponent(type)}`;
      console.log(`JobService: Checking status for job ${jobId} via ${url}`);
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        console.warn(`JobService: Status check failed for job ${jobId}: ${response.status}`);
        return { status: 'failed', shouldStopPolling: true };
      }

      const result = await response.json();
      console.log(`JobService: Status check result for ${jobId}:`, result);
      return result;
    } catch (error) {
      console.error(`JobService: Error checking status for job ${jobId}:`, error);
      return { status: 'failed', shouldStopPolling: true };
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
        console.error('JobService: Could not extract filename from URL:', audioUrl);
        return false;
      }

      const token = getAuthToken();
      const response = await fetch(`/api/uploads/audio/${filename}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });

      if (!response.ok) {
        console.warn(`JobService: Audio file deletion failed: ${response.status}`);
        return false;
      }

      const result = await response.json();
      console.log(`JobService: Audio file deleted successfully:`, result);
      return true;
    } catch (error) {
      console.error('JobService: Error deleting audio file:', error);
      return false;
    }
  }
};

export type { StoredJob };
