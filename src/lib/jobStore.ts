// Shared job store for reel generation
export interface JobRecord {
  jobId: string;
  type: string;
  category: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  result?: Record<string, unknown>;
  error?: string;
}

// Use globalThis to persist the job store across module reloads
declare global {
  var sharedJobStore: Map<string, JobRecord> | undefined;
}

// Create or get the existing job store
export const jobStore = globalThis.sharedJobStore || (globalThis.sharedJobStore = new Map<string, JobRecord>());

// Helper functions
export const getJob = (jobId: string): JobRecord | undefined => {
  return jobStore.get(jobId);
};

export const setJob = (jobId: string, job: JobRecord): void => {
  jobStore.set(jobId, job);
};

export const getAllJobIds = (): string[] => {
  return Array.from(jobStore.keys());
};

export const getJobStoreSize = (): number => {
  return jobStore.size;
};

// Update job status and result
export const updateJobStatus = (jobId: string, status: JobRecord['status'], result?: Record<string, unknown>): boolean => {
  const job = jobStore.get(jobId);
  if (!job) return false;
  
  const updatedJob: JobRecord = {
    ...job,
    status,
    updatedAt: new Date().toISOString(),
    result: result || job.result
  };
  
  jobStore.set(jobId, updatedJob);
  return true;
};
