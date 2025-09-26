import { useState, useEffect, useCallback, useRef } from 'react';
import { jobService, type StoredJob } from '@/lib/jobService';
import { useAuth } from '@/contexts/AuthContext';

interface UseJobsReturn {
  jobs: StoredJob[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isPolling: boolean;
  globalPollingEnabled: boolean;
}

// Function to check if global polling is enabled
const checkGlobalPollingEnabled = async (
  authToken: string | null
): Promise<boolean> => {
  try {
    if (!authToken) return true; // Default to enabled if no auth

    const response = await fetch('/api/admin/settings', {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return true;
    }

    const data = await response.json();
    const pollingSetting = data.settings?.find(
      (s: { key: string; value: string }) => s.key === 'global_polling_enabled'
    );
    return pollingSetting ? pollingSetting.value === 'true' : true;
  } catch {
    return true; // Default to enabled on error
  }
};

export function useJobs(): UseJobsReturn {
  const { user, isLoading: authLoading, token } = useAuth();
  const [jobs, setJobs] = useState<StoredJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [globalPollingEnabled, setGlobalPollingEnabled] = useState(true);

  // Track when jobs state changes
  // (removed no-op effect that caused an unnecessary exhaustive-deps warning)

  // Check global polling setting on component mount
  useEffect(() => {
    const checkPollingEnabled = async () => {
      const enabled = await checkGlobalPollingEnabled(token);
      setGlobalPollingEnabled(enabled);
    };

    if (user) {
      checkPollingEnabled();
    }
  }, [user, token]);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<Date>(new Date());
  const stoppedPollingJobsRef = useRef<Set<string>>(new Set());
  const fetchJobsRef = useRef<(() => Promise<void>) | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  // Function to fetch fresh jobs from the database
  const fetchJobs = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!user || authLoading) {
      setJobs([]);
      setLoading(false);
      isFetchingRef.current = false;
      return;
    }

    try {
      const freshJobs = await jobService.getJobs();
      setJobs(freshJobs);
      setError(null);
      lastFetchTimeRef.current = new Date();

      // Auto-check status for incomplete jobs during polling
      const incompleteJobs = freshJobs.filter(
        (job) =>
          !['completed', 'posted', 'rejected'].includes(job.status) &&
          !stoppedPollingJobsRef.current.has(job.job_id)
      );

      if (incompleteJobs.length > 0) {
        // Create promises for all status checks
        const statusCheckPromises = incompleteJobs.map(
          (job, index) =>
            new Promise<void>((resolve) => {
              setTimeout(async () => {
                try {
                  const result = await jobService.checkJobStatus(
                    job.job_id,
                    job.type
                  );

                  // Check if we should stop polling this job
                  if (result?.shouldStopPolling) {
                    stoppedPollingJobsRef.current.add(job.job_id);
                  }
                } catch {
                  // Status check failed
                }
                resolve();
              }, 100 * index); // Stagger requests slightly
            })
        );

        // Wait for all status checks to complete, then refresh jobs
        Promise.all(statusCheckPromises).then(async () => {
          try {
            const updatedJobs = await jobService.getJobs();
            setJobs(updatedJobs);
          } catch {
            // Failed to refresh jobs after status checks
          }
        });
      }
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to fetch jobs'
      );
      setJobs([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, authLoading]); // Depend on user and authLoading state

  // Update the ref whenever fetchJobs changes
  useEffect(() => {
    fetchJobsRef.current = fetchJobs;
  }, [fetchJobs]);

  // Check global polling setting when token changes
  useEffect(() => {
    const checkPollingStatus = async () => {
      if (token) {
        const enabled = await checkGlobalPollingEnabled(token);
        setGlobalPollingEnabled(enabled);
      }
    };

    checkPollingStatus();
  }, [token]);

  // Check if there are jobs that need polling
  const hasIncompleteJobs = useCallback(() => {
    return jobs.some(
      (job) =>
        !['completed', 'posted', 'rejected'].includes(job.status) &&
        !stoppedPollingJobsRef.current.has(job.job_id)
    );
  }, [jobs]);

  // Start polling for job updates
  const startPolling = useCallback(() => {
    if (!globalPollingEnabled) {
      return;
    }

    if (pollingIntervalRef.current) {
      return;
    }

    if (!hasIncompleteJobs()) {
      return;
    }

    setIsPolling(true);

    // Poll every 60 seconds - use ref to avoid stale closures
    pollingIntervalRef.current = setInterval(() => {
      if (fetchJobsRef.current) {
        fetchJobsRef.current();
      }
    }, 60000);
  }, [hasIncompleteJobs, globalPollingEnabled]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  // Auto-start/stop polling based on job states and global setting
  useEffect(() => {
    const shouldPoll = hasIncompleteJobs() && globalPollingEnabled;
    const isCurrentlyPolling = pollingIntervalRef.current !== null;

    if (shouldPoll && !isCurrentlyPolling) {
      startPolling();
    } else if (!shouldPoll && isCurrentlyPolling) {
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        stopPolling();
      }
    };
    // hasIncompleteJobs, startPolling and stopPolling are stable via useCallback
  }, [
    jobs,
    globalPollingEnabled,
    hasIncompleteJobs,
    startPolling,
    stopPolling,
  ]);

  // Initial load and when auth state changes
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
    isPolling,
    globalPollingEnabled,
  };
}
