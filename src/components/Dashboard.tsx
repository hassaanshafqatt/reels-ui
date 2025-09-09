"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Zap,
  Crown,
  Users,
  BookOpen,
  Heart,
  Shield,
  Brain,
  Palette,
  Clock,
  Settings,
  Sparkles,
  Dumbbell,
  Sword,
  Lightbulb,
  HandHeart,
  PaintBucket,
  Utensils,
  PawPrint,
  Instagram,
  ChevronDown,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader,
  ExternalLink,
  Music,
  Upload,
  X
} from "lucide-react";
import { jobService, type StoredJob } from "@/lib/jobService";
import { useReelData } from "@/hooks/useReelData";
import { getIconFromDatabase } from "@/lib/iconUtils";
import { type ReelType as DatabaseReelType } from "@/lib/reelService";

// Extracted components
import { iconMap } from "@/components/IconMap";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import Message from "@/components/Message";
import CategoryOverview from "@/components/CategoryOverview";
import TabNavigation from "@/components/TabNavigation";
import SubTabNavigation from "@/components/SubTabNavigation";
import ReelTypeGrid from "@/components/ReelTypeGrid";
import CaptionToggle from "@/components/CaptionToggle";
import AudioToggle from "@/components/AudioToggle";
import AudioUpload from "@/components/AudioUpload";
import CustomCaptionDisplay from "@/components/CustomCaptionDisplay";
import CustomCaptionDialog from "@/components/CustomCaptionDialog";
import JobStatusCard from "@/components/JobStatusCard";
import HistorySection from "@/components/HistorySection";
import PostingScheduleSection from "@/components/PostingScheduleSection";
import GeneratedReelsSection from "@/components/GeneratedReelsSection";

interface DashboardProps {
  onReelSelect: (categoryId: string, typeId: string) => void;
}

export default function Dashboard({
  onReelSelect = () => {}
}: DashboardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { categories: reelCategories, loading: reelDataLoading, error: reelDataError } = useReelData();
  const [activeTab, setActiveTab] = useState("");
  const [selectedReel, setSelectedReel] = useState<DatabaseReelType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [generateCaption, setGenerateCaption] = useState(true);
  const [customCaption, setCustomCaption] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [storedJobs, setStoredJobs] = useState<StoredJob[]>([]);
  const [refreshingJobs, setRefreshingJobs] = useState<Set<string>>(new Set());
  const [showCaptionDialog, setShowCaptionDialog] = useState(false);
  const [tempCustomCaption, setTempCustomCaption] = useState("");
  const [tempAuthor, setTempAuthor] = useState("");
  const [customAuthor, setCustomAuthor] = useState("");
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [useCustomAudio, setUseCustomAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<Record<string, string>>({});
  const [activeSubSection, setActiveSubSection] = useState<Record<string, Record<string, string>>>({});
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

  // Initialize sub-sections for each category and sub-tab
  useEffect(() => {
    if (reelCategories.length > 0) {
      const initialSubSections: Record<string, Record<string, string>> = {};
      reelCategories.forEach(category => {
        initialSubSections[category.name] = {
          generate: 'quick',
          post: 'schedule',
          history: 'recent'
        };
      });
      setActiveSubSection(initialSubSections);
    }
  }, [reelCategories]);

  // Load stored jobs on component mount
  useEffect(() => {
    const loadJobs = async () => {
      // Only load jobs if user is authenticated
      if (!user || authLoading) {
        console.log('User not authenticated or loading, skipping job load:', { user: !!user, authLoading });
        return;
      }
      
      try {
        console.log('Loading jobs for user:', user.email);
        const jobs = await jobService.getJobs();
        console.log('Loaded jobs:', jobs);
        setStoredJobs(jobs);
      } catch (error) {
        console.error('Failed to load jobs:', error);
        // Clear jobs on error (might be auth issue)
        setStoredJobs([]);
      }
    };
    
    loadJobs();
  }, [user, authLoading]);

  // Set initial activeTab when categories load
  useEffect(() => {
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
      const initialSubSections: Record<string, Record<string, string>> = {};
      reelCategories.forEach(category => {
        initialSubTabs[category.name] = 'generate';
        initialSubSections[category.name] = {
          generate: 'quick',
          post: 'schedule',
          history: 'recent'
        };
      });
      setActiveSubTab(initialSubTabs);
      setActiveSubSection(initialSubSections);
    }
  }, [reelCategories, activeTab, onReelSelect]);

  // Auto-select first reel type when switching categories
  useEffect(() => {
    if (activeTab && reelCategories.length > 0) {
      const currentCategory = reelCategories.find(c => c.name === activeTab);
      if (currentCategory && currentCategory.types && currentCategory.types.length > 0) {
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

  // Function to validate audio file duration
  const validateAudioDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        const duration = audio.duration;
        if (duration > 60) {
          setAudioError(`Audio file is ${duration.toFixed(1)}s long. Maximum allowed is 60s.`);
          resolve(false);
        } else {
          setAudioError(null);
          resolve(true);
        }
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        setAudioError('Could not read audio file. Please try a different file.');
        resolve(false);
      });
      
      audio.src = url;
    });
  };

  // Filter jobs by current tab category
  const getJobsForCategory = (categoryName: string) => {
    return storedJobs.filter(job => job.category === categoryName);
  };

  // Function to clear all job history
  const clearJobHistory = async () => {
    if (isClearingHistory) return;
    
    setIsClearingHistory(true);
    try {
      const success = await jobService.clearAllJobs();
      if (success) {
        setStoredJobs([]);
        setSuccess('Job history cleared successfully!');
      } else {
        setError('Failed to clear job history. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing job history:', error);
      setError('Failed to clear job history. Please try again.');
    } finally {
      setIsClearingHistory(false);
    }
  };

  // Function to check job status
  const checkJobStatus = async (job: StoredJob) => {
    if (refreshingJobs.has(job.job_id)) return;
    
    console.log(`Frontend: Checking job status for ${job.job_id}`);
    setRefreshingJobs(prev => new Set(prev).add(job.job_id));
    
    try {
      const url = `/api/reels/status?jobId=${job.job_id}&type=${job.type}`;
      console.log(`Frontend: Making request to ${url}`);
      
      const response = await fetch(url);
      console.log(`Frontend: Got response with status ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Frontend: Full response data:`, JSON.stringify(result, null, 2));
        
        // Check if response contains an error, or if status is missing
        let jobStatus = result.status;
        let errorMessage = null;
        
        if (result.error || result.message?.includes('error') || result.message?.includes('Error')) {
          jobStatus = 'failed';
          errorMessage = result.error || result.message || 'Unknown error in response';
          console.log(`Frontend: Error found in response, setting status to failed:`, errorMessage);
        } else if (!jobStatus) {
          jobStatus = 'failed';
          errorMessage = 'No status found in response';
          console.log(`Frontend: No status found in response, setting to failed`);
        }
        
        console.log(`Frontend: Final job status:`, jobStatus);
        
        // Extract reel link from multiple possible sources
        const reelLink = result.reelLink || 
                        result.result?.reelUrl || 
                        result.result?.videoUrl || 
                        result.result?.downloadUrl || 
                        result.result?.url || 
                        result.result?.link;
        
        console.log(`Frontend: Extracted reel link:`, reelLink);
        
        // Update job status using the job service
        await jobService.updateJobStatus(job.job_id, jobStatus, reelLink, errorMessage);
        const refreshedJobs = await jobService.getJobs();
        setStoredJobs(refreshedJobs); // Refresh the list
        
        // Show success message with appropriate content
        if (jobStatus === 'completed') {
          if (reelLink) {
            setSuccess(`Job ${job.job_id.substring(0, 8)} completed! Reel is ready.`);
          } else {
            setSuccess(`Job ${job.job_id.substring(0, 8)} completed successfully!`);
          }
        } else if (jobStatus === 'processing') {
          setSuccess(`Job ${job.job_id.substring(0, 8)} is still processing...`);
        } else if (jobStatus === 'failed') {
          const displayError = errorMessage || 'Job failed';
          setError(`Job ${job.job_id.substring(0, 8)} failed: ${displayError}`);
        } else {
          setSuccess(`Job ${job.job_id.substring(0, 8)} status updated: ${jobStatus}`);
        }
      } else {
        console.error(`Frontend: Request failed with status ${response.status}`);
        const errorText = await response.text();
        console.error(`Frontend: Error response body:`, errorText);
        
        // Try to parse error response as JSON for more details
        let errorDetails = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          console.log(`Frontend: Parsed error JSON:`, errorJson);
          errorDetails = errorJson.error || errorJson.message || errorText;
        } catch (parseError) {
          console.log(`Frontend: Could not parse error response as JSON, using raw text`);
        }
        
        // Set job status to failed for non-OK responses
        await jobService.updateJobStatus(job.job_id, 'failed', undefined, `HTTP ${response.status}: ${errorDetails}`);
        const refreshedJobs = await jobService.getJobs();
        setStoredJobs(refreshedJobs);
        
        setError(`Failed to check job status: ${response.status} ${response.statusText} - ${errorDetails}`);
      }
    } catch (error) {
      console.error('Frontend: Failed to check job status:', error);
      setError('Failed to check job status: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setRefreshingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(job.job_id);
        return newSet;
      });
    }
  };

  const handleReelSelect = (categoryId: string, typeId: string) => {
    const category = reelCategories.find(c => c.name === categoryId);
    const type = category?.types.find(t => t.name === typeId);
    if (type) {
      setSelectedReel(type);
      setSelectedCategory(categoryId);
      setError(null);
      setSuccess(null);
      onReelSelect(categoryId, typeId);
    }
  };

  const handleGenerate = async () => {
    if (!selectedReel) {
      setError("Please select a reel type first");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Always use local dynamic route - external URLs are handled server-side
      const targetUrl = `/api/reels/${selectedReel.name}`;
      console.log('🎯 Target URL:', targetUrl);
      console.log('🔍 Selected reel details:', {
        name: selectedReel.name,
        external_url: selectedReel.external_url,
        id: selectedReel.id
      });
      
      let response;
      
      if (useCustomAudio && customAudioFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('reelType', selectedReel.name);
        formData.append('category', selectedCategory);
        formData.append('generateCaption', generateCaption.toString());
        formData.append('customCaption', generateCaption ? "" : customCaption);
        formData.append('customAuthor', (selectedCategory === 'proverbs' && !generateCaption) ? customAuthor : "");
        formData.append('useCustomAudio', 'true');
        formData.append('audioFile', customAudioFile);
        formData.append('timestamp', new Date().toISOString());

        response = await fetch(targetUrl, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Use JSON for regular requests
        const payload = {
          reelType: selectedReel.name,
          category: selectedCategory,
          generateCaption,
          customCaption: generateCaption ? "" : customCaption,
          customAuthor: (selectedCategory === 'proverbs' && !generateCaption) ? customAuthor : "",
          useCustomAudio: false,
          timestamp: new Date().toISOString()
        };

        console.log('Making fetch request to:', targetUrl);
        console.log('Request payload:', payload);
        
        response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        
        console.log('Fetch response status:', response.status);
        console.log('Fetch response ok:', response.ok);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      
      // Store the job in database
      if (result.jobId) {
        await jobService.createJob({
          jobId: result.jobId,
          category: selectedCategory,
          type: selectedReel.name
        });
        
        // Refresh the jobs list
        const refreshedJobs = await jobService.getJobs();
        setStoredJobs(refreshedJobs);
      }
      
      setSuccess(`Reel generated successfully! Job ID: ${result.jobId || 'N/A'}`);
      
      console.log("Reel generation response:", result);
    } catch (error) {
      console.error('Detailed error in handleGenerate:', error);
      console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      setError("Error generating reel: " + (error instanceof Error ? error.message : String(error)));
      console.error("Error generating reel:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-1 sm:px-4 lg:px-6 py-2 sm:py-4 lg:py-8 pb-16 sm:pb-8">
        {/* Loading State */}
        {reelDataLoading && <LoadingState />}

        {/* Error State */}
        {reelDataError && <ErrorState message={reelDataError} />}

        {/* Main Content */}
        {!reelDataLoading && !reelDataError && reelCategories.length > 0 && (
        <div>
        {/* Clean & Elegant Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Tab Navigation */}
          <div className="hidden sm:block">
            <TabNavigation 
              categories={reelCategories}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {reelCategories.map((category) => (
            <TabsContent key={category.id} value={category.name} className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-200">
              {/* Responsive Error/Success Messages */}
              {error && <Message type="error" message={error} onClose={() => setError(null)} />}
              {success && <Message type="success" message={success} onClose={() => setSuccess(null)} />}

              {/* Category Overview - Full width on all screens */}
              <CategoryOverview title={category.title} description={category.description} />

              {/* Sub-tabs Navigation */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <SubTabNavigation 
                  activeSubTab={activeSubTab[category.name] || 'generate'}
                  onSubTabChange={(subTab) => setActiveSubTab(prev => ({ ...prev, [category.name]: subTab }))}
                />

                {/* Sub-tab Content */}
                <div className="p-4 sm:p-6">
                  {/* Generate Tab Content */}
                  {activeSubTab[category.name] === 'generate' && (
                    <div className="p-4 sm:p-6">
                      <ReelTypeGrid 
                        types={category.types}
                        selectedReel={selectedReel}
                        selectedCategory={selectedCategory}
                        categoryName={category.name}
                        onReelSelect={handleReelSelect}
                      />

                      {/* Responsive Generation Options */}
                      {selectedReel && selectedCategory === category.name && (
                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                          <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Generation Settings</h4>
                          
                          <div className="space-y-3 sm:space-y-4">
                            {/* Caption Toggle Button Group */}
                            <CaptionToggle 
                              generateCaption={generateCaption}
                              onToggleCaption={(generate) => {
                                setGenerateCaption(generate);
                                if (generate) setCustomCaption("");
                              }}
                              onOpenCustomDialog={() => {
                                setTempCustomCaption(customCaption);
                                setTempAuthor(customAuthor);
                                setShowCaptionDialog(true);
                              }}
                            />

                            {/* Show current custom caption if set */}
                            {!generateCaption && (
                              <CustomCaptionDisplay 
                                customCaption={customCaption}
                                customAuthor={customAuthor}
                                activeTab={activeTab}
                              />
                            )}

                            {/* Audio Options Toggle */}
                            <AudioToggle 
                              useCustomAudio={useCustomAudio}
                              onToggleAudio={(useCustom) => {
                                setUseCustomAudio(useCustom);
                                if (!useCustom) setCustomAudioFile(null);
                              }}
                            />

                            {/* File Upload Section */}
                            {useCustomAudio && (
                              <AudioUpload 
                                customAudioFile={customAudioFile}
                                audioError={audioError}
                                onFileSelect={setCustomAudioFile}
                                onValidateFile={async (file) => {
                                  setAudioError(null);
                                  return await validateAudioDuration(file);
                                }}
                              />
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
                                  <span className="truncate">Generate {selectedReel.title}</span>
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
                          setRefreshingJobs(prev => new Set(prev).add(job.job_id));
                          checkJobStatus(job);
                        }}
                      />
                      <PostingScheduleSection />
                    </div>
                  )}

                  {/* History Tab Content */}
                  {activeSubTab[category.name] === 'history' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-teal-600" />
                          <h3 className="text-lg font-semibold text-gray-900">Generation History</h3>
                        </div>
                        <div className="bg-teal-100 text-teal-600 rounded-full px-3 py-1 text-sm font-medium">
                          {getJobsForCategory(category.name).length}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">Track generation progress and view completed reels</p>

                      <HistorySection 
                        jobs={getJobsForCategory(category.name)}
                        refreshingJobs={refreshingJobs}
                        onRefreshJob={checkJobStatus}
                        onClearHistory={clearJobHistory}
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

      {/* Custom Caption Dialog */}
      <CustomCaptionDialog 
        isOpen={showCaptionDialog}
        onClose={() => setShowCaptionDialog(false)}
        tempCustomCaption={tempCustomCaption}
        setTempCustomCaption={setTempCustomCaption}
        tempAuthor={tempAuthor}
        setTempAuthor={setTempAuthor}
        activeTab={activeTab}
        onSave={() => {
          setCustomCaption(tempCustomCaption);
          setCustomAuthor(tempAuthor);
          setGenerateCaption(false);
          setShowCaptionDialog(false);
        }}
      />
      
      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="px-2 py-1">
          <div className="flex justify-center">
            <div className="flex space-x-1 bg-gray-50 rounded-full p-1 max-w-full overflow-x-auto scrollbar-hide">
              {reelCategories.map((category) => {
                const mobileTitle = category.title
                  .replace("Viral Reels", "Viral")
                  .replace("Proverbs Viral Reels", "Proverbs") 
                  .replace("Anime Style Reels", "Anime")
                  .replace("ASMR Reels", "ASMR");
                
                const isActive = activeTab === category.name;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.name)}
                    className={`flex flex-col items-center px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 min-w-[60px] ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}>
                      {getIconFromDatabase(category.icon || 'Sparkles')}
                    </div>
                    <span className="mt-1 leading-none">{mobileTitle}</span>
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