import React, { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CheckCircle,
  AlertCircle,
  Loader,
  Clock,
  RefreshCw,
  ExternalLink,
  Instagram,
  Sparkles,
  Play,
  Maximize,
  Minimize,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { type StoredJob } from "@/lib/jobService";
import { useAuth } from "@/contexts/AuthContext";
import Cookies from 'js-cookie';

interface JobStatusCardProps {
  job: StoredJob;
  isRefreshing: boolean;
  onRefresh: (job: StoredJob) => void;
}

export default function JobStatusCard({ job, isRefreshing, onRefresh }: JobStatusCardProps) {
  const { token } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFullscreenRef = useRef(false);

  // Update ref whenever state changes
  React.useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  // Function to handle posting the reel
  const handlePostReel = async () => {
    setIsPosting(true);
    try {
      console.log('Posting reel:', job.job_id);
      
      // Get token from cookies (same method as auth context)
      const authToken = token || Cookies.get('auth_token');
      
      if (!authToken) {
        console.error('No authentication token found');
        // Could add a notification system here if needed
        return;
      }
      
      const response = await fetch('/api/reels/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          jobId: job.job_id,
          category: job.category,
          type: job.type,
          videoUrl: job.result_url,
          caption: job.caption
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Post response:', result);
        
        // Refresh the job to get updated status
        onRefresh(job);
        
        console.log('Reel posted successfully!');
      } else {
        const errorText = await response.text();
        console.error('Failed to post reel:', response.status, errorText);
        
        // Handle specific error cases
        if (response.status === 401) {
          console.error('Authentication failed - token may be expired');
        }
      }
    } catch (error) {
      console.error('Error posting reel:', error || 'Unknown error');
    } finally {
      setIsPosting(false);
    }
  };

  // Helper function to render expandable caption
  const renderCaption = (caption: string) => {
    const characterLimit = 35;
    const isLong = caption.length > characterLimit;
    
    if (!isLong) {
      return (
        <p className="text-gray-800 text-xs mt-1 p-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-100 leading-relaxed">
          {caption}
        </p>
      );
    }
    
    const truncatedCaption = caption.slice(0, characterLimit);
    const displayCaption = showFullCaption ? caption : truncatedCaption + '...';
    
    return (
      <div className="space-y-2">
        <div className="text-gray-800 text-xs p-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-100 leading-relaxed transition-all duration-300 ease-in-out">
          <p>
            {displayCaption}
          </p>
        </div>
        <button
          onClick={() => setShowFullCaption(!showFullCaption)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 hover:border-teal-300 rounded-full transition-all duration-200 hover:shadow-sm"
        >
          {showFullCaption ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show More
            </>
          )}
        </button>
      </div>
    );
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Enter fullscreen
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as unknown as { webkitRequestFullscreen?: () => void })?.webkitRequestFullscreen) {
        (containerRef.current as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
      } else if ((containerRef.current as unknown as { msRequestFullscreen?: () => void })?.msRequestFullscreen) {
        (containerRef.current as unknown as { msRequestFullscreen: () => void }).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
        (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
      } else if ((document as unknown as { msExitFullscreen?: () => void }).msExitFullscreen) {
        (document as unknown as { msExitFullscreen: () => void }).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes and keyboard events
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreenRef.current) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array - runs once on mount
  const getStatusIcon = () => {
    switch (job.status) {
      case 'posted':
        return <CheckCircle className="h-3 w-3 mr-1 text-blue-500" />;
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'processing':
      case 'pending':
        return <Loader className="h-3 w-3 mr-1 animate-spin" />;
      case 'failed':
      case 'rejected':
        return <AlertCircle className="h-3 w-3 mr-1" />;
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  const getStatusVariant = () => {
    switch (job.status) {
      case 'completed':
      case 'approved':
      case 'posted':
        return 'default';
      case 'processing':
      case 'pending':
        return 'secondary';
      case 'failed':
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const renderContent = () => {
    // Helper function to check if URL is Google Drive
    const isGoogleDriveLink = (url: string) => {
      return url && (url.includes('drive.google.com') || url.includes('docs.google.com'));
    };

    // Helper function to convert Google Drive share URL to embeddable URL
    const getGoogleDriveEmbedUrl = (url: string) => {
      if (!isGoogleDriveLink(url)) return null;
      
      // Extract file ID from various Google Drive URL formats
      let fileId = '';
      if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1].split('/')[0];
      } else if (url.includes('id=')) {
        fileId = url.split('id=')[1].split('&')[0];
      }
      
      return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
    };

    // Helper function to convert Google Drive share URL to direct view URL
    const getGoogleDriveViewUrl = (url: string) => {
      if (!isGoogleDriveLink(url)) return url;
      
      // Extract file ID from various Google Drive URL formats
      let fileId = '';
      if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1].split('/')[0];
      } else if (url.includes('id=')) {
        fileId = url.split('id=')[1].split('&')[0];
      }
      
      return fileId ? `https://drive.google.com/file/d/${fileId}/view` : url;
    };

    if ((job.status === 'completed' || job.status === 'approved' || job.status === 'posted') && job.result_url) {
      const isGoogleDrive = isGoogleDriveLink(job.result_url);
      const viewUrl = isGoogleDrive ? getGoogleDriveViewUrl(job.result_url) : job.result_url;
      const embedUrl = isGoogleDrive ? getGoogleDriveEmbedUrl(job.result_url) : null;
      
      return (
        <div className="space-y-2">
          <div 
            ref={containerRef}
            className={`relative bg-gray-100 rounded-lg overflow-hidden transition-all duration-300 ${
              isFullscreen 
                ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' 
                : 'aspect-video'
            }`}
          >
            {embedUrl ? (
              // Google Drive embedded video
              <iframe
                src={embedUrl}
                className={`rounded-lg ${
                  isFullscreen 
                    ? 'w-full h-full max-w-none max-h-none' 
                    : 'w-full h-full'
                }`}
                allow="autoplay; fullscreen"
                allowFullScreen
                title="Reel Video"
              />
            ) : job.result_url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? (
              // Direct video file with responsive design
              <video
                ref={videoRef}
                className={`object-contain rounded-lg ${
                  isFullscreen 
                    ? 'w-full h-full max-w-none max-h-none' 
                    : 'w-full h-full object-cover'
                }`}
                controls
                preload="metadata"
                controlsList="nodownload"
              >
                <source src={job.result_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              // Fallback for other video types or preview not available
              <div className={`flex items-center justify-center relative ${
                isFullscreen ? 'w-full h-full' : 'w-full h-full'
              }`}>
                <div className="text-center">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Play className="h-4 w-4 text-white ml-0.5" />
                  </div>
                  <p className="text-xs text-gray-600">
                    {job.status === 'posted' ? 'Posted' : job.status === 'approved' ? 'Approved' : 'Reel Ready'}
                  </p>
                  {isGoogleDrive && (
                    <p className="text-xs text-blue-600 mt-1">Click to play video</p>
                  )}
                </div>
                {/* Clickable overlay for fallback */}
                <div 
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => window.open(viewUrl, '_blank')}
                />
              </div>
            )}
            
            {/* Fullscreen toggle button */}
            {(embedUrl || job.result_url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) && (
              <button
                onClick={toggleFullscreen}
                className={`absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200 ${
                  isFullscreen ? 'top-4 right-4' : ''
                }`}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          {!isFullscreen && (
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs"
                onClick={() => window.open(viewUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {isGoogleDrive ? 'Open in Drive' : 'View Full Screen'}
              </Button>
              {job.status !== 'posted' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs"
                  onClick={handlePostReel}
                  disabled={isPosting}
                >
                  {isPosting ? (
                    <>
                      <Loader className="h-3 w-3 mr-1 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Instagram className="h-3 w-3 mr-1" />
                      Post Now
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      );
    }

    if (job.status === 'processing' || job.status === 'pending') {
      return (
        <div className="space-y-2">
          <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Loader className="h-6 w-6 text-teal-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-600">
                {job.status === 'pending' ? 'Pending Approval...' : 'Generating...'}
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full text-sm h-10 border-teal-300 text-teal-600 hover:bg-teal-100 hover:border-teal-400 transition-all duration-200 active:scale-[0.98] font-medium"
            onClick={() => onRefresh(job)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
          </Button>
        </div>
      );
    }

    if (job.status === 'failed' || job.status === 'rejected') {
      return (
        <div className="space-y-2">
          <div className="aspect-video bg-red-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-xs text-red-600">
                {job.status === 'rejected' ? 'Rejected' : 'Generation Failed'}
              </p>
              {job.error_message && (
                <p className="text-xs text-red-500 mt-1 max-w-32 truncate" title={job.error_message}>
                  {job.error_message}
                </p>
              )}
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full text-sm h-10 border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 transition-all duration-200 active:scale-[0.98] font-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {job.status === 'rejected' ? 'Resubmit' : 'Retry Generation'}
          </Button>
        </div>
      );
    }

    // Default/unknown status
    return (
      <div className="space-y-2">
        <div className="aspect-video bg-yellow-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-xs text-yellow-600 capitalize">{job.status}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant={getStatusVariant()} className="text-xs">
            {getStatusIcon()}
            {job.status}
          </Badge>
          <span className="text-xs text-gray-500">
            {new Date(job.created_at).toLocaleDateString()}
          </span>
        </div>
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
          {job.category} - {job.type}
        </h3>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-gray-600">
          <p><strong>Type:</strong> {job.type}</p>
          <p><strong>Category:</strong> {job.category}</p>
          <p><strong>ID:</strong> {job.job_id.slice(0, 8)}...</p>
          {job.caption && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <p className="text-sm font-medium text-gray-800">Caption</p>
              </div>
              {renderCaption(job.caption)}
            </div>
          )}
        </div>
        
        {renderContent()}
      </CardContent>
    </Card>
  );
}
