'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import Cookies from 'js-cookie';
import { Sparkles, Clock } from 'lucide-react';
import { jobService, type StoredJob } from '@/lib/jobService';
import { useReelData } from '@/hooks/useReelData';
import { useJobs } from '@/hooks/useJobs';
import { getIconFromDatabase } from '@/lib/iconUtils';
import { type ReelType as DatabaseReelType } from '@/lib/reelService';

// Extracted components
// iconMap intentionally omitted (not used here)
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import Message from '@/components/Message';
import CategoryOverview from '@/components/CategoryOverview';
import TabNavigation from '@/components/TabNavigation';
import SubTabNavigation from '@/components/SubTabNavigation';
import ReelTypeGrid from '@/components/ReelTypeGrid';
import CaptionToggle from '@/components/CaptionToggle';
import AudioToggle from '@/components/AudioToggle';
import AudioUpload from '@/components/AudioUpload';
import CustomCaptionDisplay from '@/components/CustomCaptionDisplay';
import CustomCaptionDialog from '@/components/CustomCaptionDialog';
import HistorySection from '@/components/HistorySection';
import GeneratedReelsSection from '@/components/GeneratedReelsSection';

interface DashboardProps {
  onReelSelect: (categoryId: string, typeId: string) => void;
}

export default function Dashboard({ onReelSelect = () => {} }: DashboardProps) {
  // auth not needed in this component; keep minimal local state
  const {
    categories: reelCategories,
    loading: reelDataLoading,
    error: reelDataError,
  } = useReelData();
  const { jobs: storedJobs, refetch: refetchJobs, isPolling } = useJobs();
  const [activeTab, setActiveTab] = useState('');
  const [selectedReel, setSelectedReel] = useState<DatabaseReelType | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [generateCaption, setGenerateCaption] = useState(true);
  const [customCaption, setCustomCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshingJobs, setRefreshingJobs] = useState<Set<string>>(new Set());
  const [showCaptionDialog, setShowCaptionDialog] = useState(false);
  const [tempCustomCaption, setTempCustomCaption] = useState('');
  const [tempAuthor, setTempAuthor] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [useCustomAudio, setUseCustomAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [allowCustomAudioGlobally, setAllowCustomAudioGlobally] =
    useState<boolean>(true);
  // Admin-provided label overrides
  const [labelCaptionTitle, setLabelCaptionTitle] = useState<
    string | undefined
  >(undefined);
  const [labelCaptionDescription, setLabelCaptionDescription] = useState<
    string | undefined
  >(undefined);
  const [labelCaptionField, setLabelCaptionField] = useState<
    string | undefined
  >(undefined);
  const [labelCaptionPlaceholder, setLabelCaptionPlaceholder] = useState<
    string | undefined
  >(undefined);
  const [labelCaptionToggleAuto, setLabelCaptionToggleAuto] = useState<
    string | undefined
  >(undefined);
  const [labelCaptionToggleAutoSub, setLabelCaptionToggleAutoSub] = useState<
    string | undefined
  >(undefined);
  const [labelCaptionToggleCustom, setLabelCaptionToggleCustom] = useState<
    string | undefined
  >(undefined);
  const [labelCaptionToggleCustomSub, setLabelCaptionToggleCustomSub] =
    useState<string | undefined>(undefined);
  const [activeSubTab, setActiveSubTab] = useState<Record<string, string>>({});
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  // Auto-clear success and error messages after 7 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Set initial activeTab when categories load
  useEffect(() => {
    // Fetch global setting for custom audio
    (async () => {
      try {
        const response = await fetch('/api/admin/settings', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || Cookies.get('auth_token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          type AdminSetting = {
            key: string;
            value: string;
            description?: string;
          };
          const settings: AdminSetting[] = Array.isArray(data?.settings)
            ? data.settings
            : [];
          const setting = settings.find(
            (s) => s.key === 'allow_custom_audio_globally'
          );
          if (setting) setAllowCustomAudioGlobally(setting.value === 'true');

          // Label overrides
          const captionTitle = settings.find(
            (s) => s.key === 'label_caption_title'
          )?.value;
          const captionDesc = settings.find(
            (s) => s.key === 'label_caption_description'
          )?.value;
          const captionField = settings.find(
            (s) => s.key === 'label_caption_field'
          )?.value;
          const captionPlaceholder = settings.find(
            (s) => s.key === 'label_caption_placeholder'
          )?.value;

          if (captionTitle) setLabelCaptionTitle(captionTitle);
          if (captionDesc) setLabelCaptionDescription(captionDesc);
          if (captionField) setLabelCaptionField(captionField);
          if (captionPlaceholder)
            setLabelCaptionPlaceholder(captionPlaceholder);
          const toggleAuto = settings.find(
            (s) => s.key === 'label_caption_toggle_auto'
          )?.value;
          const toggleAutoSub = settings.find(
            (s) => s.key === 'label_caption_toggle_auto_sub'
          )?.value;
          const toggleCustom = settings.find(
            (s) => s.key === 'label_caption_toggle_custom'
          )?.value;
          const toggleCustomSub = settings.find(
            (s) => s.key === 'label_caption_toggle_custom_sub'
          )?.value;
          if (toggleAuto) setLabelCaptionToggleAuto(toggleAuto);
          if (toggleAutoSub) setLabelCaptionToggleAutoSub(toggleAutoSub);
          if (toggleCustom) setLabelCaptionToggleCustom(toggleCustom);
          if (toggleCustomSub) setLabelCaptionToggleCustomSub(toggleCustomSub);
        }
      } catch {
        // Ignore error, keep default true
      }
    })();
    if (reelCategories.length > 0 && !activeTab) {
      const firstCategory = reelCategories[0];
      setActiveTab(firstCategory.name);

      // Auto-select the first reel type of the first category
      if (firstCategory.types && firstCategory.types.length > 0) {
        const firstType = firstCategory.types[0];
        setSelectedReel(firstType);
        setSelectedCategory(firstCategory.name);
        onReelSelect(firstCategory.name, firstType.name);
      }

      // Initialize sub-tabs with "Generate" as default for each category
      const initialSubTabs: Record<string, string> = {};
      reelCategories.forEach((category) => {
        initialSubTabs[category.name] = 'generate';
      });
      setActiveSubTab(initialSubTabs);
    }
  }, [reelCategories, activeTab, onReelSelect]);

  // Auto-select first reel type when switching categories
  useEffect(() => {
    if (activeTab && reelCategories.length > 0) {
      const currentCategory = reelCategories.find((c) => c.name === activeTab);
      if (
        currentCategory &&
        currentCategory.types &&
        currentCategory.types.length > 0
      ) {
        // Only auto-select if no reel is currently selected for this category
        if (!selectedReel || selectedCategory !== activeTab) {
          const firstType = currentCategory.types[0];
          setSelectedReel(firstType);
          setSelectedCategory(activeTab);
          onReelSelect(activeTab, firstType.name);
        }
      }
    }
  }, [activeTab, reelCategories, selectedReel, selectedCategory, onReelSelect]);

  // Keep selectedReel in sync when reelCategories update (so label overrides apply after edits)
  useEffect(() => {
    if (!selectedReel) return;
    try {
      const updatedCategory = reelCategories.find(
        (c) =>
          c.id === selectedReel.category_id ||
          c.name === selectedReel.category_name
      );
      const updatedType = updatedCategory?.types?.find(
        (t) => t.id === selectedReel.id || t.name === selectedReel.name
      );
      if (updatedType) {
        // shallow compare label fields to avoid unnecessary state updates
        const labelsChanged =
          updatedType.label_caption_title !==
            selectedReel.label_caption_title ||
          updatedType.label_caption_description !==
            selectedReel.label_caption_description ||
          updatedType.label_caption_field !==
            selectedReel.label_caption_field ||
          updatedType.label_caption_placeholder !==
            selectedReel.label_caption_placeholder ||
          updatedType.label_caption_toggle_auto !==
            selectedReel.label_caption_toggle_auto ||
          updatedType.label_caption_toggle_auto_sub !==
            selectedReel.label_caption_toggle_auto_sub ||
          updatedType.label_caption_toggle_custom !==
            selectedReel.label_caption_toggle_custom ||
          updatedType.label_caption_toggle_custom_sub !==
            selectedReel.label_caption_toggle_custom_sub;
        if (labelsChanged) {
          setSelectedReel(updatedType);
        }
      }
    } catch {
      // ignore
    }
  }, [reelCategories, selectedReel]);

  // Derived final labels: prefer per-type overrides, then global admin settings, then defaults
  const finalCaptionTitle =
    selectedReel?.label_caption_title ?? labelCaptionTitle ?? 'Custom Caption';
  const finalCaptionDescription =
    selectedReel?.label_caption_description ??
    labelCaptionDescription ??
    'Write your own caption for the reel. This will override the AI-generated caption.';
  const finalCaptionField =
    selectedReel?.label_caption_field ?? labelCaptionField ?? 'Caption';
  const finalCaptionPlaceholder =
    selectedReel?.label_caption_placeholder ?? labelCaptionPlaceholder ?? '';
  const finalToggleAuto =
    selectedReel?.label_caption_toggle_auto ??
    labelCaptionToggleAuto ??
    'Auto-Generate';
  const finalToggleAutoSub =
    selectedReel?.label_caption_toggle_auto_sub ??
    labelCaptionToggleAutoSub ??
    'AI creates caption';
  const finalToggleCustom =
    selectedReel?.label_caption_toggle_custom ??
    labelCaptionToggleCustom ??
    finalCaptionTitle;
  const finalToggleCustomSub =
    selectedReel?.label_caption_toggle_custom_sub ??
    labelCaptionToggleCustomSub ??
    finalCaptionDescription;

  // Function to validate audio file duration and size
  const validateAudioDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // First check file size (10MB limit to match backend)
      const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSizeInBytes) {
        const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        setAudioError(
          `Audio file is ${fileSizeInMB}MB. Maximum allowed size is 10MB.`
        );
        resolve(false);
        return;
      }

      const audio = new Audio();
      const url = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        const duration = audio.duration;
        if (duration >= 61) {
          setAudioError(
            `Audio file is ${duration.toFixed(1)}s long. Maximum allowed is 60s.`
          );
          resolve(false);
        } else {
          setAudioError(null);
          resolve(true);
        }
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        setAudioError(
          'Could not read audio file. Please try a different file.'
        );
        resolve(false);
      });

      audio.src = url;
    });
  };

  // Filter jobs by current tab category
  const getJobsForCategory = (categoryName: string) => {
    return storedJobs.filter((job) => job.category === categoryName);
  };

  // Function to clear job history for a specific category
  const clearJobHistory = async (categoryName?: string) => {
    if (isClearingHistory) return;

    setIsClearingHistory(true);
    try {
      const success = await jobService.clearJobsByCategory(categoryName);
      if (success) {
        refetchJobs();
        setSuccess(
          `Job history cleared successfully for ${categoryName || 'all categories'}!`
        );
      } else {
        setError('Failed to clear job history. Please try again.');
      }
    } catch {
      setError('Failed to clear job history. Please try again.');
    } finally {
      setIsClearingHistory(false);
    }
  };

  // Function to cleanup audio file for a job
  // cleanupAudioFile removed; currently not used

  // Function to check job status
  const checkJobStatus = async (job: StoredJob) => {
    if (refreshingJobs.has(job.job_id)) return;

    setRefreshingJobs((prev) => new Set(prev).add(job.job_id));

    try {
      const url = `/api/reels/status?jobId=${encodeURIComponent(job.job_id)}&type=${encodeURIComponent(job.type)}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || Cookies.get('auth_token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();

        // Handle the actual API response format
        if (result.jobId && (result.status || result.result?.status)) {
          const topLevelStatus = result.status; // "Pending"
          const resultStatus = result.result?.status; // "Pending"
          // Prefer nested result fields, falling back to other common locations
          const videoUrl =
            result.result?.result_url ||
            result.result?.videoURL ||
            result.result?.videoUrl ||
            result.result?.url ||
            result.reelLink ||
            result.videoURL ||
            result.videoUrl ||
            undefined;

          const caption = result.result?.caption || result.caption; // Extract caption from either location

          // Use the most relevant status (prefer result.status if available, otherwise top-level status)
          const rawStatus = resultStatus || topLevelStatus;
          const jobStatus = rawStatus.toLowerCase(); // Convert "Pending" to "pending"

          // Update job status using the job service
          // Only pass resultUrl when we actually have one to avoid overwriting DB
          await jobService.updateJobStatus(
            result.jobId,
            jobStatus,
            videoUrl || undefined,
            undefined,
            caption
          );
          refetchJobs();

          // Show status-specific messages
          const statusMessages = {
            pending: 'Job is still processing...',
            approved: 'Job has been approved!',
            posted: 'Reel has been posted successfully!',
            rejected: 'Job was rejected. Please try again.',
          };

          const message =
            statusMessages[jobStatus as keyof typeof statusMessages] ||
            `Job status updated: ${rawStatus}`;

          if (jobStatus === 'rejected') {
            setError(`Job ${result.jobId.substring(0, 8)}: ${message}`);
          } else {
            setSuccess(`Job ${result.jobId.substring(0, 8)}: ${message}`);
          }
        } else if (result.job_id && result.Status) {
          // Handle alternative format (job_id + Status)
          const jobStatus = result.Status.toLowerCase(); // Convert "Pending" to "pending"
          const videoUrl =
            result.result?.result_url ||
            result.result?.videoURL ||
            result.result?.videoUrl ||
            result.result?.url ||
            result.reelLink ||
            result.videoURL ||
            result.videoUrl ||
            undefined;
          const caption = result.result?.caption || result.caption; // Extract caption

          // Update job status using the job service (only pass resultUrl if present)
          await jobService.updateJobStatus(
            result.job_id,
            jobStatus,
            videoUrl || undefined,
            undefined,
            caption
          );
          refetchJobs();

          // Show status-specific messages
          const statusMessages = {
            pending: 'Job is still processing...',
            approved: 'Job has been approved!',
            posted: 'Reel has been posted successfully!',
            rejected: 'Job was rejected. Please try again.',
          };

          const message =
            statusMessages[jobStatus as keyof typeof statusMessages] ||
            `Job status updated: ${result.Status}`;

          if (jobStatus === 'rejected') {
            setError(`Job ${result.job_id.substring(0, 8)}: ${message}`);
          } else {
            setSuccess(`Job ${result.job_id.substring(0, 8)}: ${message}`);
          }
        } else {
          // Fallback to old format if new format not detected
          let jobStatus = result.status;
          let errorMessage = null;

          if (
            result.error ||
            result.message?.includes('error') ||
            result.message?.includes('Error')
          ) {
            jobStatus = 'failed';
            errorMessage =
              result.error || result.message || 'Unknown error in response';
          } else if (!jobStatus) {
            jobStatus = 'failed';
            errorMessage = 'No status found in response';
          }

          // Extract reel link from multiple possible sources
          const reelLink =
            result.reelLink ||
            result.result?.reelUrl ||
            result.result?.videoUrl ||
            result.result?.downloadUrl ||
            result.result?.url ||
            result.result?.link;

          // Update job status using the job service
          await jobService.updateJobStatus(
            job.job_id,
            jobStatus,
            reelLink,
            errorMessage
          );
          refetchJobs(); // Refresh the list

          // Show success message with appropriate content
          if (jobStatus === 'completed') {
            if (reelLink) {
              setSuccess(
                `Job ${job.job_id.substring(0, 8)} completed! Reel is ready.`
              );
            } else {
              setSuccess(
                `Job ${job.job_id.substring(0, 8)} completed successfully!`
              );
            }
          } else if (jobStatus === 'processing') {
            setSuccess(
              `Job ${job.job_id.substring(0, 8)} is still processing...`
            );
          } else if (jobStatus === 'failed') {
            const displayError = errorMessage || 'Job failed';
            setError(
              `Job ${job.job_id.substring(0, 8)} failed: ${displayError}`
            );
          } else {
            setSuccess(
              `Job ${job.job_id.substring(0, 8)} status updated: ${jobStatus}`
            );
          }
        }
      } else {
        const errorText = await response.text();

        // Try to parse error response as JSON for more details
        let errorDetails = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error || errorJson.message || errorText;
        } catch {
          // Could not parse error response as JSON, using raw text
        }

        // Set job status to failed for non-OK responses
        await jobService.updateJobStatus(
          job.job_id,
          'failed',
          undefined,
          `HTTP ${response.status}: ${errorDetails}`
        );
        refetchJobs();

        setError(
          `Failed to check job status: ${response.status} ${response.statusText} - ${errorDetails}`
        );
      }
    } catch (err) {
      setError(
        'Failed to check job status: ' +
          (err instanceof Error ? err.message : String(err || 'Unknown error'))
      );
    } finally {
      setRefreshingJobs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(job.job_id);
        return newSet;
      });
    }
  };

  const handleReelSelect = React.useCallback(
    (categoryId: string, typeId: string) => {
      const category = reelCategories.find((c) => c.name === categoryId);
      const type = category?.types.find((t) => t.name === typeId);
      if (type) {
        setSelectedReel(type);
        setSelectedCategory(categoryId);
        setError(null);
        setSuccess(null);
        onReelSelect(categoryId, typeId);
      }
    },
    [reelCategories, onReelSelect]
  );

  const handleGenerate = async () => {
    if (!selectedReel) {
      setError('Please select a reel type first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Always use local dynamic route - external URLs are handled server-side
      const targetUrl = `/api/reels/${selectedReel.name}`;

      let response: Response;
      let customAudioUrl = null;

      if (
        useCustomAudio &&
        customAudioFile &&
        allowCustomAudioGlobally &&
        selectedReel?.allow_custom_audio !== false
      ) {
        // First upload the audio file to get a streamable URL
        const audioFormData = new FormData();
        audioFormData.append('audioFile', customAudioFile);

        // Get auth token from cookies (same method as jobService)
        const authToken = Cookies.get('auth_token');

        const uploadResponse = await fetch('/api/upload/audio', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: audioFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload audio file');
        }

        const uploadResult = await uploadResponse.json();
        customAudioUrl = uploadResult.url;
      }

      // Now make the reel generation request with JSON (including audio URL if present)
      const payload = {
        reelType: selectedReel.name,
        category: selectedCategory,
        generateCaption,
        customCaption: generateCaption ? '' : customCaption,
        customAuthor:
          selectedReel.include_author && !generateCaption ? customAuthor : '',
        useCustomAudio: !!customAudioUrl,
        customAudioUrl: customAudioUrl,
        timestamp: new Date().toISOString(),
      };

      // eslint-disable-next-line prefer-const
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      // Store the job in database
      if (result.jobId) {
        await jobService.createJob({
          jobId: result.jobId,
          category: selectedCategory,
          type: selectedReel.name,
        });

        // Refresh the jobs list
        refetchJobs();
      }

      setSuccess(
        `Reel generated successfully! Job ID: ${result.jobId || 'N/A'}`
      );
    } catch (err) {
      setError(
        'Error generating reel: ' +
          (err instanceof Error ? err.message : String(err || 'Unknown error'))
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Stable callbacks to avoid calling hooks conditionally inside JSX
  const handleToggleCaption = React.useCallback((generate: boolean) => {
    setGenerateCaption(generate);
    if (generate) setCustomCaption('');
  }, []);

  const openCustomDialog = React.useCallback(() => {
    setTempCustomCaption(customCaption);
    setTempAuthor(customAuthor);
    setShowCaptionDialog(true);
  }, [customCaption, customAuthor]);

  const handleToggleAudio = React.useCallback((useCustom: boolean) => {
    setUseCustomAudio(useCustom);
    if (!useCustom) setCustomAudioFile(null);
  }, []);

  const handleTabChange = React.useCallback((v: string) => setActiveTab(v), []);

  return (
    <div className="w-full min-h-screen flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-8 pb-24 sm:pb-8">
        {/* Loading State */}
        {reelDataLoading && <LoadingState />}

        {/* Error State */}
        {reelDataError && <ErrorState message={reelDataError} />}

        {/* Main Content */}
        {!reelDataLoading && !reelDataError && reelCategories.length > 0 && (
          <div>
            {/* If there's only one category, render it directly without tabs */}
            {reelCategories.length === 1 ? (
              (() => {
                const category = reelCategories[0];
                return (
                  <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-200">
                    {/* Responsive Error/Success Messages */}
                    {error && (
                      <Message
                        type="error"
                        message={error}
                        onClose={() => setError(null)}
                      />
                    )}
                    {success && (
                      <Message
                        type="success"
                        message={success}
                        onClose={() => setSuccess(null)}
                      />
                    )}

                    {/* Category Overview - Full width on all screens */}
                    <CategoryOverview
                      title={category.title}
                      description={category.description}
                    />

                    {/* Sub-tabs Navigation */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <SubTabNavigation
                        activeSubTab={activeSubTab[category.name] || 'generate'}
                        onSubTabChange={(subTab) =>
                          setActiveSubTab((prev) => ({
                            ...prev,
                            [category.name]: subTab,
                          }))
                        }
                      />

                      {/* Sub-tab Content */}
                      <div className="p-3 sm:p-4 lg:p-6">
                        {/* Generate Tab Content */}
                        {activeSubTab[category.name] === 'generate' && (
                          <div className="p-3 sm:p-4 lg:p-6">
                            <ReelTypeGrid
                              types={category.types}
                              selectedReel={selectedReel}
                              selectedCategory={selectedCategory}
                              categoryName={category.name}
                              onReelSelect={handleReelSelect}
                            />

                            {/* Responsive Generation Options */}
                            {selectedReel &&
                              selectedCategory === category.name && (
                                <div className="mt-3 sm:mt-4 lg:mt-6 pt-3 sm:pt-4 lg:pt-6 border-t border-gray-100">
                                  <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
                                    Generation Settings
                                  </h4>

                                  <div className="space-y-3 sm:space-y-4">
                                    <CaptionToggle
                                      generateCaption={generateCaption}
                                      onToggleCaption={handleToggleCaption}
                                      onOpenCustomDialog={openCustomDialog}
                                      labelCustom={finalToggleCustom}
                                      labelCustomSub={finalToggleCustomSub}
                                      labelAuto={finalToggleAuto}
                                      labelAutoSub={finalToggleAutoSub}
                                    />

                                    {!generateCaption && (
                                      <CustomCaptionDisplay
                                        customCaption={customCaption}
                                        customAuthor={customAuthor}
                                        activeTab={activeTab}
                                        includeAuthor={
                                          selectedReel?.include_author
                                        }
                                        captionLabel={finalCaptionField}
                                      />
                                    )}

                                    {selectedReel?.allow_custom_audio !==
                                      false &&
                                      allowCustomAudioGlobally && (
                                        <>
                                          <AudioToggle
                                            useCustomAudio={useCustomAudio}
                                            onToggleAudio={handleToggleAudio}
                                          />

                                          {useCustomAudio && (
                                            <AudioUpload
                                              customAudioFile={customAudioFile}
                                              audioError={audioError}
                                              onFileSelect={setCustomAudioFile}
                                              onValidateFile={async (file) => {
                                                setAudioError(null);
                                                return await validateAudioDuration(
                                                  file
                                                );
                                              }}
                                            />
                                          )}
                                        </>
                                      )}

                                    <Button
                                      onClick={handleGenerate}
                                      disabled={
                                        isGenerating || audioError !== null
                                      }
                                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isGenerating ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                          <span className="truncate">
                                            Generating...
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles
                                            size={16}
                                            className="flex-shrink-0"
                                          />
                                          <span className="truncate">
                                            Generate {selectedReel?.title}
                                          </span>
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {/* Post Tab Content */}
                        {activeSubTab[category.name] === 'post' && (
                          <div className="space-y-6">
                            <GeneratedReelsSection
                              jobs={getJobsForCategory(activeTab)}
                              refreshingJobs={refreshingJobs}
                              onRefreshJob={(job) => {
                                setRefreshingJobs((prev) =>
                                  new Set(prev).add(job.job_id)
                                );
                                checkJobStatus(job);
                              }}
                              isPolling={isPolling}
                              onManualRefresh={refetchJobs}
                            />
                          </div>
                        )}

                        {/* History Tab Content */}
                        {activeSubTab[category.name] === 'history' && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-teal-600" />
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Generation History
                                </h3>
                              </div>
                              <div className="bg-teal-100 text-teal-600 rounded-full px-3 py-1 text-sm font-medium">
                                {getJobsForCategory(category.name).length}
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm">
                              Track generation progress and view completed jobs
                            </p>

                            <HistorySection
                              jobs={getJobsForCategory(category.name)}
                              refreshingJobs={refreshingJobs}
                              onRefreshJob={checkJobStatus}
                              onClearHistory={() =>
                                clearJobHistory(category.name)
                              }
                              isClearingHistory={isClearingHistory}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              // Multiple categories: show tabs as before
              <div>
                {/* Clean & Elegant Tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  {/* Desktop Tab Navigation */}
                  <div className="hidden sm:block">
                    <TabNavigation
                      categories={reelCategories}
                      activeTab={activeTab}
                      onTabChange={setActiveTab}
                    />
                  </div>

                  {reelCategories.map((category) => (
                    <TabsContent
                      key={category.id}
                      value={category.name}
                      className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-200"
                    >
                      {/* Responsive Error/Success Messages */}
                      {error && (
                        <Message
                          type="error"
                          message={error}
                          onClose={() => setError(null)}
                        />
                      )}
                      {success && (
                        <Message
                          type="success"
                          message={success}
                          onClose={() => setSuccess(null)}
                        />
                      )}

                      {/* Category Overview - Full width on all screens */}
                      <CategoryOverview
                        title={category.title}
                        description={category.description}
                      />

                      {/* Sub-tabs Navigation */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <SubTabNavigation
                          activeSubTab={
                            activeSubTab[category.name] || 'generate'
                          }
                          onSubTabChange={(subTab) =>
                            setActiveSubTab((prev) => ({
                              ...prev,
                              [category.name]: subTab,
                            }))
                          }
                        />

                        {/* Sub-tab Content */}
                        <div className="p-3 sm:p-4 lg:p-6">
                          {/* Generate Tab Content */}
                          {activeSubTab[category.name] === 'generate' && (
                            <div className="p-3 sm:p-4 lg:p-6">
                              <ReelTypeGrid
                                types={category.types}
                                selectedReel={selectedReel}
                                selectedCategory={selectedCategory}
                                categoryName={category.name}
                                onReelSelect={handleReelSelect}
                              />

                              {/* Responsive Generation Options */}
                              {selectedReel &&
                                selectedCategory === category.name && (
                                  <div className="mt-3 sm:mt-4 lg:mt-6 pt-3 sm:pt-4 lg:pt-6 border-t border-gray-100">
                                    <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
                                      Generation Settings
                                    </h4>

                                    <div className="space-y-3 sm:space-y-4">
                                      {/* Caption Toggle Button Group */}
                                      <CaptionToggle
                                        generateCaption={generateCaption}
                                        onToggleCaption={handleToggleCaption}
                                        onOpenCustomDialog={openCustomDialog}
                                        labelCustom={
                                          labelCaptionToggleCustom ||
                                          labelCaptionTitle
                                        }
                                        labelCustomSub={
                                          labelCaptionToggleCustomSub ||
                                          labelCaptionDescription
                                        }
                                        labelAuto={
                                          labelCaptionToggleAuto ||
                                          'Auto-Generate'
                                        }
                                        labelAutoSub={
                                          labelCaptionToggleAutoSub ||
                                          'AI creates caption'
                                        }
                                      />

                                      {/* Show current custom caption if set */}
                                      {!generateCaption && (
                                        <CustomCaptionDisplay
                                          customCaption={customCaption}
                                          customAuthor={customAuthor}
                                          activeTab={activeTab}
                                          includeAuthor={
                                            selectedReel?.include_author
                                          }
                                        />
                                      )}

                                      {/* Audio Options Toggle */}
                                      {selectedReel?.allow_custom_audio !==
                                        false &&
                                        allowCustomAudioGlobally && (
                                          <>
                                            <AudioToggle
                                              useCustomAudio={useCustomAudio}
                                              onToggleAudio={handleToggleAudio}
                                            />

                                            {/* File Upload Section */}
                                            {useCustomAudio && (
                                              <AudioUpload
                                                customAudioFile={
                                                  customAudioFile
                                                }
                                                audioError={audioError}
                                                onFileSelect={
                                                  setCustomAudioFile
                                                }
                                                onValidateFile={async (
                                                  file
                                                ) => {
                                                  setAudioError(null);
                                                  return await validateAudioDuration(
                                                    file
                                                  );
                                                }}
                                              />
                                            )}
                                          </>
                                        )}

                                      <Button
                                        onClick={handleGenerate}
                                        disabled={
                                          isGenerating || audioError !== null
                                        }
                                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {isGenerating ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                            <span className="truncate">
                                              Generating...
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles
                                              size={16}
                                              className="flex-shrink-0"
                                            />
                                            <span className="truncate">
                                              Generate {selectedReel.title}
                                            </span>
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}

                          {/* Post Tab Content */}
                          {activeSubTab[category.name] === 'post' && (
                            <div className="space-y-6">
                              <GeneratedReelsSection
                                jobs={getJobsForCategory(activeTab)}
                                refreshingJobs={refreshingJobs}
                                onRefreshJob={(job) => {
                                  setRefreshingJobs((prev) =>
                                    new Set(prev).add(job.job_id)
                                  );
                                  checkJobStatus(job);
                                }}
                                isPolling={isPolling}
                                onManualRefresh={refetchJobs}
                              />
                            </div>
                          )}

                          {/* History Tab Content */}
                          {activeSubTab[category.name] === 'history' && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-5 w-5 text-teal-600" />
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    Generation History
                                  </h3>
                                </div>
                                <div className="bg-teal-100 text-teal-600 rounded-full px-3 py-1 text-sm font-medium">
                                  {getJobsForCategory(category.name).length}
                                </div>
                              </div>
                              <p className="text-gray-600 text-sm">
                                Track generation progress and view completed
                                reels
                              </p>

                              <HistorySection
                                jobs={getJobsForCategory(category.name)}
                                refreshingJobs={refreshingJobs}
                                onRefreshJob={checkJobStatus}
                                onClearHistory={() =>
                                  clearJobHistory(category.name)
                                }
                                isClearingHistory={isClearingHistory}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </div>
        )}

        {/* Custom Caption Dialog */}
        <CustomCaptionDialog
          isOpen={showCaptionDialog}
          onClose={() => setShowCaptionDialog(false)}
          tempCustomCaption={tempCustomCaption}
          setTempCustomCaption={setTempCustomCaption}
          tempAuthor={tempAuthor}
          setTempAuthor={setTempAuthor}
          activeTab={activeTab}
          minCaptionLength={selectedReel?.min_caption_length}
          maxCaptionLength={selectedReel?.max_caption_length}
          includeAuthor={selectedReel?.include_author}
          titleLabel={finalCaptionTitle}
          descriptionLabel={finalCaptionDescription}
          captionLabel={finalCaptionField}
          captionPlaceholder={finalCaptionPlaceholder}
          saveLabel={`Save ${finalCaptionField}`}
          onSave={() => {
            setCustomCaption(tempCustomCaption);
            setCustomAuthor(tempAuthor);
            setGenerateCaption(false);
            setShowCaptionDialog(false);
          }}
        />

        {/* Mobile Bottom Navigation */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 mobile-bottom-nav safe-area-bottom">
          <div className="px-3 py-2">
            <div className="flex justify-center">
              <div className="flex space-x-2 bg-gray-50 rounded-full p-1.5 max-w-full overflow-x-auto scrollbar-hide">
                {reelCategories.map((category) => {
                  const mobileTitle = category.title
                    .replace('Viral Reels', 'Viral')
                    .replace('Proverbs Viral Reels', 'Proverbs')
                    .replace('Anime Style Reels', 'Anime')
                    .replace('ASMR Reels', 'ASMR');

                  const isActive = activeTab === category.name;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveTab(category.name)}
                      aria-current={isActive ? 'true' : 'false'}
                      className={`flex flex-col items-center px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 min-w-[64px] touch-target ${
                        isActive
                          ? 'bg-teal-600 text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <div
                        className={`transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-gray-400'
                        }`}
                      >
                        {getIconFromDatabase(category.icon || 'Sparkles')}
                      </div>
                      <span className="mt-1 leading-none text-[11px] max-w-[68px] truncate">
                        {mobileTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
