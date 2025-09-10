import { useState, useEffect, useCallback, useRef } from 'react';
import { jobService, type StoredJob } from '@/lib/jobService';
import { useAuth } from '@/contexts/AuthContext';

interface UseJobsReturn {
  jobs: StoredJob[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isPolling: boolean;
}

export function useJobs(): UseJobsReturn {
  const { user, isLoading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<StoredJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Debug: Track when jobs state changes
  useEffect(() => {
    console.log('useJobs: Jobs state changed', {
      total: jobs.length,
      completed: jobs.filter(j => j.status === 'completed').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      jobs: jobs.map(j => ({ id: j.job_id.slice(-8), status: j.status, hasResultUrl: !!j.result_url }))
    });
  }, [jobs]);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<Date>(new Date());
  const stoppedPollingJobsRef = useRef<Set<string>>(new Set());
  const fetchJobsRef = useRef<(() => Promise<void>) | null>(null);

  // Function to fetch fresh jobs from the database
  const fetchJobs = useCallback(async () => {
    if (!user || authLoading) {
      setJobs([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching fresh jobs from database...');
      const freshJobs = await jobService.getJobs();
      console.log('Fresh jobs loaded:', freshJobs);
      setJobs(freshJobs);
      setError(null);
      lastFetchTimeRef.current = new Date();
      
      // Auto-check status for incomplete jobs during polling
      const incompleteJobs = freshJobs.filter(job => 
        !['completed', 'posted', 'rejected'].includes(job.status) && 
        !stoppedPollingJobsRef.current.has(job.job_id)
      );
      
      if (incompleteJobs.length > 0) {
        console.log(`Auto-checking status for ${incompleteJobs.length} incomplete jobs`);
        
        // Create promises for all status checks
        const statusCheckPromises = incompleteJobs.map((job, index) => 
          new Promise<void>((resolve) => {
            setTimeout(async () => {
              try {
                const result = await jobService.checkJobStatus(job.job_id, job.type);
                
                // Check if we should stop polling this job
                if (result?.shouldStopPolling) {
                  console.log(`Stopping polling for job ${job.job_id} due to server directive`);
                  stoppedPollingJobsRef.current.add(job.job_id);
                }
              } catch (error: any) {
                console.warn(`Failed to check status for job ${job.job_id}:`, error);
              }
              resolve();
            }, 100 * index); // Stagger requests slightly
          })
        );
        
        // Wait for all status checks to complete, then refresh jobs
        Promise.all(statusCheckPromises).then(async () => {
          console.log('All status checks completed, refreshing job data...');
          try {
            const updatedJobs = await jobService.getJobs();
            console.log('Updated jobs after status checks:', updatedJobs.map(j => ({
              id: j.job_id.slice(-8),
              status: j.status,
              hasResultUrl: !!j.result_url
            })));
            setJobs(updatedJobs);
          } catch (error) {
            console.warn('Failed to refresh jobs after status checks:', error);
          }
        });
      }
    } catch (fetchError) {
      console.error('Failed to fetch jobs:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, authLoading]); // Only depend on user ID and authLoading state

  // Update the ref whenever fetchJobs changes
  useEffect(() => {
    fetchJobsRef.current = fetchJobs;
  }, [fetchJobs]);

  // Check if there are jobs that need polling
  const hasIncompleteJobs = useCallback(() => {
    return jobs.some(job => 
      !['completed', 'posted', 'rejected'].includes(job.status) && 
      !stoppedPollingJobsRef.current.has(job.job_id)
    );
  }, [jobs]);

  // Start polling for job updates
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('Polling already active, skipping start');
      return;
    }
    
    if (!hasIncompleteJobs()) {
      console.log('No incomplete jobs, skipping polling start');
      return;
    }
    
    console.log('Starting job polling...');
    setIsPolling(true);
    
    // Poll every 60 seconds (1 minute) - use ref to avoid stale closures
    pollingIntervalRef.current = setInterval(() => {
      console.log('Polling: Fetching fresh job data...');
      if (fetchJobsRef.current) {
        fetchJobsRef.current();
      }
    }, 60000);
  }, [hasIncompleteJobs]); // Remove fetchJobs dependency to prevent restarts

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('Stopping job polling...');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  // Auto-start/stop polling based on job states
  useEffect(() => {
    const shouldPoll = hasIncompleteJobs();
    const isCurrentlyPolling = pollingIntervalRef.current !== null;
    
    if (shouldPoll && !isCurrentlyPolling) {
      console.log('Starting polling: found incomplete jobs');
      startPolling();
    } else if (!shouldPoll && isCurrentlyPolling) {
      console.log('Stopping polling: no incomplete jobs');
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        console.log('Component unmounting, cleaning up polling');
        stopPolling();
      }
    };
  }, [jobs]); // Only depend on jobs array, not on function references

  // Initial load and when auth state changes
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
    isPolling
  };
}
