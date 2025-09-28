'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { getAuthHeaders } from '@/lib/clientAuth';
import { Sparkles, Clock } from 'lucide-react';
import { jobService, type StoredJob } from '@/lib/jobService';
import { useReelData, type ReelCategoryWithTypes } from '@/hooks/useReelData';
import { useJobs } from '@/hooks/useJobs';
import { getIconFromDatabase } from '@/lib/iconUtils';
import { type ReelType as DatabaseReelType } from '@/lib/reelService';

// Components
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// Types
interface DashboardProps {
  onReelSelect: (categoryId: string, typeId: string) => void;
}

interface AdminSetting {
  key: string;
  value: string;
  description?: string;
}

type LabelOverrides = {
  captionTitle?: string;
  captionDescription?: string;
  captionField?: string;
  captionPlaceholder?: string;
  toggleAuto?: string;
  toggleAutoSub?: string;
  toggleCustom?: string;
  toggleCustomSub?: string;
};

// Constants
const STATUS_MESSAGES = {
  pending: 'Job is still processing...',
  approved: 'Job has been approved!',
  posted: 'Reel has been posted successfully!',
  rejected: 'Job was rejected. Please try again.',
} as const;

const MAX_AUDIO_SIZE_MB = 10;
const MAX_AUDIO_DURATION_SECONDS = 60;
const MESSAGE_AUTO_CLEAR_DELAY = 7000;

// Custom hooks
const useMessageAutoClearing = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(
        () => setSuccess(null),
        MESSAGE_AUTO_CLEAR_DELAY
      );
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), MESSAGE_AUTO_CLEAR_DELAY);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return { error, success, setError, setSuccess };
};

const useAdminSettings = () => {
  const [allowCustomAudioGlobally, setAllowCustomAudioGlobally] =
    useState(true);
  const [labelOverrides, setLabelOverrides] = useState<LabelOverrides>({
    captionTitle: undefined,
    captionDescription: undefined,
    captionField: undefined,
    captionPlaceholder: undefined,
    toggleAuto: undefined,
    toggleAutoSub: undefined,
    toggleCustom: undefined,
    toggleCustomSub: undefined,
  });

  const fetchAdminSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return;

      const data = await response.json();
      const settings: AdminSetting[] = Array.isArray(data?.settings)
        ? data.settings
        : [];

      const findSetting = (key: string) =>
        settings.find((s) => s.key === key)?.value;

      setAllowCustomAudioGlobally(
        findSetting('allow_custom_audio_globally') === 'true'
      );
      setLabelOverrides({
        captionTitle: findSetting('label_caption_title'),
        captionDescription: findSetting('label_caption_description'),
        captionField: findSetting('label_caption_field'),
        captionPlaceholder: findSetting('label_caption_placeholder'),
        toggleAuto: findSetting('label_caption_toggle_auto'),
        toggleAutoSub: findSetting('label_caption_toggle_auto_sub'),
        toggleCustom: findSetting('label_caption_toggle_custom'),
        toggleCustomSub: findSetting('label_caption_toggle_custom_sub'),
      });
    } catch {
      // Keep defaults on error
    }
  }, []);

  useEffect(() => {
    fetchAdminSettings();
  }, [fetchAdminSettings]);

  return { allowCustomAudioGlobally, labelOverrides };
};

const useLabelResolution = (
  selectedReel: DatabaseReelType | null,
  labelOverrides: LabelOverrides
) => {
  return {
    finalCaptionTitle:
      selectedReel?.label_caption_title ??
      labelOverrides.captionTitle ??
      'Custom Caption',
    finalCaptionDescription:
      selectedReel?.label_caption_description ??
      labelOverrides.captionDescription ??
      'Write your own caption for the reel. This will override the AI-generated caption.',
    finalCaptionField:
      selectedReel?.label_caption_field ??
      labelOverrides.captionField ??
      'Caption',
    finalCaptionPlaceholder:
      selectedReel?.label_caption_placeholder ??
      labelOverrides.captionPlaceholder ??
      '',
    finalToggleAuto:
      selectedReel?.label_caption_toggle_auto ??
      labelOverrides.toggleAuto ??
      'Auto-Generate',
    finalToggleAutoSub:
      selectedReel?.label_caption_toggle_auto_sub ??
      labelOverrides.toggleAutoSub ??
      'AI creates caption',
    finalToggleCustom:
      selectedReel?.label_caption_toggle_custom ??
      labelOverrides.toggleCustom ??
      selectedReel?.label_caption_title ??
      labelOverrides.captionTitle ??
      'Custom Caption',
    finalToggleCustomSub:
      selectedReel?.label_caption_toggle_custom_sub ??
      labelOverrides.toggleCustomSub ??
      selectedReel?.label_caption_description ??
      labelOverrides.captionDescription ??
      'Write your own caption for the reel. This will override the AI-generated caption.',
  };
};

// Utility functions
const validateAudioFile = (
  file: File
): Promise<{ isValid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const maxSizeInBytes = MAX_AUDIO_SIZE_MB * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      resolve({
        isValid: false,
        error: `Audio file is ${fileSizeInMB}MB. Maximum allowed size is ${MAX_AUDIO_SIZE_MB}MB.`,
      });
      return;
    }

    const audio = new Audio();
    const url = URL.createObjectURL(file);

    const cleanup = () => URL.revokeObjectURL(url);

    audio.addEventListener('loadedmetadata', () => {
      cleanup();
      if (audio.duration >= MAX_AUDIO_DURATION_SECONDS + 1) {
        resolve({
          isValid: false,
          error: `Audio file is ${audio.duration.toFixed(1)}s long. Maximum allowed is ${MAX_AUDIO_DURATION_SECONDS}s.`,
        });
      } else {
        resolve({ isValid: true });
      }
    });

    audio.addEventListener('error', () => {
      cleanup();
      resolve({
        isValid: false,
        error: 'Could not read audio file. Please try a different file.',
      });
    });

    audio.src = url;
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractJobStatusFromResponse = (result: any) => {
  // Handle new API response format
  if (result.jobId && (result.status || result.result?.status)) {
    const topLevelStatus = result.status;
    const resultStatus = result.result?.status;
    const videoUrl =
      result.result?.result_url ||
      result.result?.videoURL ||
      result.result?.videoUrl ||
      result.result?.url ||
      result.reelLink ||
      result.videoURL ||
      result.videoUrl;
    const caption = result.result?.caption || result.caption;
    const rawStatus = resultStatus || topLevelStatus;

    return {
      jobId: result.jobId,
      status: rawStatus.toLowerCase(),
      videoUrl,
      caption,
    };
  }

  // Handle alternative format
  if (result.job_id && result.Status) {
    const videoUrl =
      result.result?.result_url ||
      result.result?.videoURL ||
      result.result?.videoUrl ||
      result.result?.url ||
      result.reelLink ||
      result.videoURL ||
      result.videoUrl;
    const caption = result.result?.caption || result.caption;

    return {
      jobId: result.job_id,
      status: result.Status.toLowerCase(),
      videoUrl,
      caption,
    };
  }

  // Fallback to old format
  let jobStatus = result.status || 'failed';
  let errorMessage = null;

  if (
    result.error ||
    result.message?.includes('error') ||
    result.message?.includes('Error')
  ) {
    jobStatus = 'failed';
    errorMessage =
      result.error || result.message || 'Unknown error in response';
  } else if (!result.status) {
    jobStatus = 'failed';
    errorMessage = 'No status found in response';
  }

  const reelLink =
    result.reelLink ||
    result.result?.reelUrl ||
    result.result?.videoUrl ||
    result.result?.downloadUrl ||
    result.result?.url ||
    result.result?.link;

  return {
    status: jobStatus,
    videoUrl: reelLink,
    errorMessage,
  };
};

export default function Dashboard({ onReelSelect = () => {} }: DashboardProps) {
  // Hooks
  const {
    categories: reelCategories,
    loading: reelDataLoading,
    error: reelDataError,
  } = useReelData();
  const { jobs: storedJobs, refetch: refetchJobs, isPolling } = useJobs();
  const { error, success, setError, setSuccess } = useMessageAutoClearing();
  const { allowCustomAudioGlobally, labelOverrides } = useAdminSettings();

  // State
  const [activeTab, setActiveTab] = useState('');
  const [selectedReel, setSelectedReel] = useState<DatabaseReelType | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [generateCaption, setGenerateCaption] = useState(true);
  const [customCaption, setCustomCaption] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshingJobs, setRefreshingJobs] = useState<Set<string>>(new Set());
  const [showCaptionDialog, setShowCaptionDialog] = useState(false);
  const [tempCustomCaption, setTempCustomCaption] = useState('');
  const [tempAuthor, setTempAuthor] = useState('');
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [useCustomAudio, setUseCustomAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<Record<string, string>>({});
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [clearCategoryCandidate, setClearCategoryCandidate] = useState<
    string | null
  >(null);

  // Derived labels
  const labels = useLabelResolution(selectedReel, labelOverrides);

  // Initialize tabs and auto-selection
  useEffect(() => {
    if (reelCategories.length > 0 && !activeTab) {
      const firstCategory = reelCategories[0];
      setActiveTab(firstCategory.name);

      if (firstCategory.types?.length > 0) {
        const firstType = firstCategory.types[0];
        setSelectedReel(firstType);
        setSelectedCategory(firstCategory.name);
        onReelSelect(firstCategory.name, firstType.name);
      }

      const initialSubTabs: Record<string, string> = {};
      reelCategories.forEach((category) => {
        initialSubTabs[category.name] = 'generate';
      });
      setActiveSubTab(initialSubTabs);
    }
  }, [reelCategories, activeTab, onReelSelect]);

  // Auto-select first reel type when switching categories
  useEffect(() => {
    if (!activeTab || !reelCategories.length) return;

    const currentCategory = reelCategories.find((c) => c.name === activeTab);
    if (!currentCategory?.types?.length) return;

    if (!selectedReel || selectedCategory !== activeTab) {
      const firstType = currentCategory.types[0];
      setSelectedReel(firstType);
      setSelectedCategory(activeTab);
      onReelSelect(activeTab, firstType.name);
    }
  }, [activeTab, reelCategories, selectedReel, selectedCategory, onReelSelect]);

  // Keep selectedReel in sync with updated reel data
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
        const labelsChanged = [
          'label_caption_title',
          'label_caption_description',
          'label_caption_field',
          'label_caption_placeholder',
          'label_caption_toggle_auto',
          'label_caption_toggle_auto_sub',
          'label_caption_toggle_custom',
          'label_caption_toggle_custom_sub',
        ].some(
          (field) =>
            updatedType[field as keyof DatabaseReelType] !==
            selectedReel[field as keyof DatabaseReelType]
        );

        if (labelsChanged) {
          setSelectedReel(updatedType);
        }
      }
    } catch {
      // Ignore errors
    }
  }, [reelCategories, selectedReel]);

  // Event handlers
  const handleToggleCaption = useCallback((generate: boolean) => {
    setGenerateCaption(generate);
    if (generate) setCustomCaption('');
  }, []);

  const handleToggleAudio = useCallback((useCustom: boolean) => {
    setUseCustomAudio(useCustom);
    if (!useCustom) setCustomAudioFile(null);
  }, []);

  const handleTabChange = useCallback((v: string) => setActiveTab(v), []);

  const openCustomDialog = useCallback(() => {
    setTempCustomCaption(customCaption);
    setTempAuthor(customAuthor);
    setShowCaptionDialog(true);
  }, [customCaption, customAuthor]);

  const handleReelSelect = useCallback(
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
    [reelCategories, onReelSelect, setError, setSuccess]
  );

  const validateAudioDuration = useCallback(
    async (file: File): Promise<boolean> => {
      const result = await validateAudioFile(file);
      if (!result.isValid) {
        setAudioError(result.error!);
        return false;
      }
      setAudioError(null);
      return true;
    },
    []
  );

  const getJobsForCategory = useCallback(
    (categoryName: string) => {
      return storedJobs.filter((job) => job.category === categoryName);
    },
    [storedJobs]
  );

  const clearJobHistory = useCallback(
    async (categoryName?: string) => {
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
    },
    [isClearingHistory, refetchJobs, setError, setSuccess]
  );

  const openConfirmClear = useCallback((categoryName?: string) => {
    setClearCategoryCandidate(categoryName || null);
    setConfirmClearOpen(true);
  }, []);

  const handleConfirmClear = useCallback(async () => {
    setConfirmClearOpen(false);
    try {
      await clearJobHistory(clearCategoryCandidate || undefined);
    } finally {
      setClearCategoryCandidate(null);
    }
  }, [clearJobHistory, clearCategoryCandidate]);

  const checkJobStatus = useCallback(
    async (job: StoredJob) => {
      if (refreshingJobs.has(job.job_id)) return;

      setRefreshingJobs((prev) => new Set(prev).add(job.job_id));

      try {
        const url = `/api/reels/status?jobId=${encodeURIComponent(job.job_id)}&type=${encodeURIComponent(job.type)}`;
        const response = await fetch(url, { headers: getAuthHeaders() });

        if (response.ok) {
          const result = await response.json();
          const statusData = extractJobStatusFromResponse(result);

          if (statusData.jobId) {
            await jobService.updateJobStatus(
              statusData.jobId,
              statusData.status,
              statusData.videoUrl,
              undefined,
              statusData.caption
            );
            refetchJobs();

            const message =
              STATUS_MESSAGES[
                statusData.status as keyof typeof STATUS_MESSAGES
              ] || `Job status updated: ${statusData.status}`;
            const jobIdShort = statusData.jobId.substring(0, 8);

            if (statusData.status === 'rejected') {
              setError(`Job ${jobIdShort}: ${message}`);
            } else {
              setSuccess(`Job ${jobIdShort}: ${message}`);
            }
          } else {
            // Handle fallback format
            await jobService.updateJobStatus(
              job.job_id,
              statusData.status,
              statusData.videoUrl,
              statusData.errorMessage
            );
            refetchJobs();

            const jobIdShort = job.job_id.substring(0, 8);
            if (statusData.status === 'completed') {
              setSuccess(
                `Job ${jobIdShort} completed! ${statusData.videoUrl ? 'Reel is ready.' : ''}`
              );
            } else if (statusData.status === 'processing') {
              setSuccess(`Job ${jobIdShort} is still processing...`);
            } else if (statusData.status === 'failed') {
              setError(
                `Job ${jobIdShort} failed: ${statusData.errorMessage || 'Job failed'}`
              );
            } else {
              setSuccess(
                `Job ${jobIdShort} status updated: ${statusData.status}`
              );
            }
          }
        } else {
          const errorText = await response.text();
          let errorDetails = errorText;

          try {
            const errorJson = JSON.parse(errorText);
            errorDetails = errorJson.error || errorJson.message || errorText;
          } catch {
            // Use raw text if JSON parsing fails
          }

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
        const errorMessage =
          err instanceof Error ? err.message : String(err || 'Unknown error');
        setError(`Failed to check job status: ${errorMessage}`);
      } finally {
        setRefreshingJobs((prev) => {
          const newSet = new Set(prev);
          newSet.delete(job.job_id);
          return newSet;
        });
      }
    },
    [refreshingJobs, refetchJobs, setError, setSuccess]
  );

  const handleGenerate = useCallback(async () => {
    if (!selectedReel) {
      setError('Please select a reel type first');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const targetUrl = `/api/reels/${selectedReel.name}`;
      let customAudioUrl = null;

      // Handle audio upload if needed
      if (
        useCustomAudio &&
        customAudioFile &&
        allowCustomAudioGlobally &&
        selectedReel?.allow_custom_audio !== false
      ) {
        const audioFormData = new FormData();
        audioFormData.append('audioFile', customAudioFile);

        const uploadResponse = await fetch('/api/upload/audio', {
          method: 'POST',
          headers: getAuthHeaders(false),
          body: audioFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload audio file');
        }

        const uploadResult = await uploadResponse.json();
        customAudioUrl = uploadResult.url;
      }

      // Generate reel
      const payload = {
        reelType: selectedReel.name,
        category: selectedCategory,
        generateCaption,
        customCaption: generateCaption ? '' : customCaption,
        customAuthor:
          selectedReel.include_author && !generateCaption ? customAuthor : '',
        useCustomAudio: !!customAudioUrl,
        customAudioUrl,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.jobId) {
        await jobService.createJob({
          jobId: result.jobId,
          category: selectedCategory,
          type: selectedReel.name,
        });
        refetchJobs();
      }

      setSuccess(
        `Reel generated successfully! Job ID: ${result.jobId || 'N/A'}`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : String(err || 'Unknown error');
      setError(`Error generating reel: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedReel,
    selectedCategory,
    generateCaption,
    customCaption,
    customAuthor,
    useCustomAudio,
    customAudioFile,
    allowCustomAudioGlobally,
    refetchJobs,
    setError,
    setSuccess,
  ]);

  // Render helpers
  const renderMobileNavigation = () => (
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
                    className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-400'}`}
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
  );

  const renderGenerationSettings = () => {
    if (!selectedReel || selectedCategory !== activeTab) return null;

    return (
      <div className="mt-3 sm:mt-4 lg:mt-6 pt-3 sm:pt-4 lg:pt-6 border-t border-gray-100">
        <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
          Generation Settings
        </h4>

        <div className="space-y-3 sm:space-y-4">
          <CaptionToggle
            generateCaption={generateCaption}
            onToggleCaption={handleToggleCaption}
            onOpenCustomDialog={openCustomDialog}
            labelCustom={labels.finalToggleCustom}
            labelCustomSub={labels.finalToggleCustomSub}
            labelAuto={labels.finalToggleAuto}
            labelAutoSub={labels.finalToggleAutoSub}
          />

          {!generateCaption && (
            <CustomCaptionDisplay
              customCaption={customCaption}
              customAuthor={customAuthor}
              activeTab={activeTab}
              includeAuthor={selectedReel?.include_author}
              captionLabel={labels.finalCaptionField}
            />
          )}

          {selectedReel?.allow_custom_audio !== false &&
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
                    onValidateFile={validateAudioDuration}
                  />
                )}
              </>
            )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || audioError !== null}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span className="truncate">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="flex-shrink-0" />
                <span className="truncate">Generate {selectedReel?.title}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderTabContent = (category: ReelCategoryWithTypes) => {
    const currentSubTab = activeSubTab[category.name] || 'generate';

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <SubTabNavigation
          activeSubTab={currentSubTab}
          onSubTabChange={(subTab) =>
            setActiveSubTab((prev) => ({ ...prev, [category.name]: subTab }))
          }
        />

        <div className="p-3 sm:p-4 lg:p-6">
          {currentSubTab === 'generate' && (
            <div className="p-3 sm:p-4 lg:p-6">
              <ReelTypeGrid
                types={category.types}
                selectedReel={selectedReel}
                selectedCategory={selectedCategory}
                categoryName={category.name}
                onReelSelect={handleReelSelect}
              />
              {renderGenerationSettings()}
            </div>
          )}

          {currentSubTab === 'post' && (
            <div className="space-y-6">
              <GeneratedReelsSection
                jobs={getJobsForCategory(activeTab)}
                refreshingJobs={refreshingJobs}
                onRefreshJob={(job) => {
                  setRefreshingJobs((prev) => new Set(prev).add(job.job_id));
                  checkJobStatus(job);
                }}
                isPolling={isPolling}
                onManualRefresh={refetchJobs}
              />
            </div>
          )}

          {currentSubTab === 'history' && (
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
                Track generation progress and view completed reels
              </p>

              <HistorySection
                jobs={getJobsForCategory(category.name)}
                refreshingJobs={refreshingJobs}
                onRefreshJob={checkJobStatus}
                onClearHistory={() => openConfirmClear(category.name)}
                isClearingHistory={isClearingHistory}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSingleCategoryView = (category: ReelCategoryWithTypes) => (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-200">
      {error && (
        <Message type="error" message={error} onClose={() => setError(null)} />
      )}
      {success && (
        <Message
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      <CategoryOverview
        title={category.title}
        description={category.description}
      />
      {renderTabContent(category)}
    </div>
  );

  const renderMultipleCategoriesView = () => (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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

          <CategoryOverview
            title={category.title}
            description={category.description}
          />
          {renderTabContent(category)}
        </TabsContent>
      ))}
    </Tabs>
  );

  const renderConfirmClearDialog = () => (
    <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
      <DialogContent className="p-6">
        <DialogClose onClose={() => setConfirmClearOpen(false)}>
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle>Clear Generation History</DialogTitle>
          <DialogDescription>
            This will permanently delete generation history
            {clearCategoryCandidate ? ` for ${clearCategoryCandidate}` : ''}.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 text-sm text-gray-700">
          Are you sure you want to clear the selected history? This will remove
          the records from your account.
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setConfirmClearOpen(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmClear}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            disabled={isClearingHistory}
          >
            {isClearingHistory ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Clearing...
              </>
            ) : (
              'Clear History'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderCustomCaptionDialog = () => (
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
      titleLabel={labels.finalCaptionTitle}
      descriptionLabel={labels.finalCaptionDescription}
      captionLabel={labels.finalCaptionField}
      captionPlaceholder={labels.finalCaptionPlaceholder}
      saveLabel={`Save ${labels.finalCaptionField}`}
      onSave={() => {
        setCustomCaption(tempCustomCaption);
        setCustomAuthor(tempAuthor);
        setGenerateCaption(false);
        setShowCaptionDialog(false);
      }}
    />
  );

  // Main render
  if (reelDataLoading) return <LoadingState />;
  if (reelDataError) return <ErrorState message={reelDataError} />;
  if (!reelCategories.length) return null;

  return (
    <div className="w-full min-h-screen flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-8 pb-24 sm:pb-8">
        {reelCategories.length === 1
          ? renderSingleCategoryView(reelCategories[0])
          : renderMultipleCategoriesView()}
      </div>

      {renderMobileNavigation()}
      {renderConfirmClearDialog()}
      {renderCustomCaptionDialog()}
    </div>
  );
}
