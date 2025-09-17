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
      
      const response = await fetch('/api/jobs', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      return data.jobs || [];
    } catch (error) {
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
      return false;
    }
  },

  // Check job status via status API
  async checkJobStatus(jobId: string, type: string): Promise<{ status: string; result_url?: string; shouldStopPolling?: boolean }> {
    try {
      const url = `/api/reels/status?jobId=${encodeURIComponent(jobId)}&type=${encodeURIComponent(type)}`;
      
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        return { status: 'failed', shouldStopPolling: true };
      }

      const result = await response.json();
      return result;
    } catch (error) {
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
        return false;
      }

      const result = await response.json();
      return true;
    } catch (error) {
      return false;
    }
  }
};

export type { StoredJob };
