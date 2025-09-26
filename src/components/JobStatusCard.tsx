'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  AlertCircle,
  Loader,
  Clock,
  RefreshCw,
  ExternalLink,
  Instagram,
  Play,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { StoredJob } from '@/lib/jobService';
import { useAuth } from '@/contexts/AuthContext';
import Cookies from 'js-cookie';

interface JobStatusCardProps {
  job: StoredJob;
  isRefreshing: boolean;
  onRefresh: (job: StoredJob) => void;
}

export default function JobStatusCard({
  job,
  isRefreshing,
  onRefresh,
}: JobStatusCardProps) {
  const { token } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false); // kept for legacy variable use in classnames
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ensure isFullscreen local flag is reset when dialog closes/open
  React.useEffect(() => {
    if (!isDialogOpen) setIsFullscreen(false);
  }, [isDialogOpen]);

  // Helper: parse result_url into an array of string URLs.
  const parseMediaUrls = React.useCallback((raw?: string): string[] => {
    if (!raw) return [];

    const tryJson = (s: string): unknown | null => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    };

    const isRecord = (v: unknown): v is Record<string, unknown> =>
      typeof v === 'object' && v !== null;

    const extractFromRecord = (
      r: Record<string, unknown>
    ): string | undefined => {
      if (typeof r.url === 'string') return r.url as string;
      if (typeof r.src === 'string') return r.src as string;
      return undefined;
    };

    const parsed = tryJson(raw);

    if (Array.isArray(parsed)) {
      // Array of strings
      if (parsed.every((p) => typeof p === 'string')) {
        return parsed as string[];
      }

      // Array of objects with url/src
      if (
        parsed.every(
          (p) =>
            isRecord(p) &&
            (typeof (p as Record<string, unknown>).url === 'string' ||
              typeof (p as Record<string, unknown>).src === 'string')
        )
      ) {
        return (parsed as Record<string, unknown>[]).map(
          (p) => extractFromRecord(p as Record<string, unknown>) as string
        );
      }

      // Mixed array: try to extract string-like values
      return (parsed as unknown[])
        .map((p) => {
          if (typeof p === 'string') return p;
          if (isRecord(p)) return extractFromRecord(p);
          return null;
        })
        .filter(Boolean) as string[];
    }

    if (isRecord(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.media)) {
        return (obj.media as unknown[])
          .map((m) => {
            if (typeof m === 'string') return m;
            if (isRecord(m))
              return extractFromRecord(m as Record<string, unknown>);
            return null;
          })
          .filter(Boolean) as string[];
      }
      if (Array.isArray(obj.urls)) {
        return (obj.urls as unknown[]).filter(
          (u) => typeof u === 'string'
        ) as string[];
      }
      if (typeof obj.result_url === 'string')
        return parseMediaUrls(obj.result_url as string);
      if (typeof obj.url === 'string') return [obj.url as string];
    }

    // If raw is a string but not JSON array/object, try comma-split and trimming
    const s = raw.trim();
    if (s.startsWith('[') && s.endsWith(']')) {
      const inner = s.slice(1, -1);
      return inner
        .split(',')
        .map((u) => u.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
    if (s.includes(',')) {
      return s
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);
    }

    // Fallback: single URL string
    return [raw];
  }, []);

  // Keep activeIndex valid when the job.result_url changes
  React.useEffect(() => {
    const urls = parseMediaUrls(job?.result_url);
    if (!urls || urls.length === 0) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((cur) => (cur >= urls.length ? 0 : cur));
  }, [job?.result_url, parseMediaUrls]);

  // Function to handle posting the reel
  const handlePostReel = async () => {
    setIsPosting(true);
    try {
      // Get token from cookies (same method as auth context)
      const authToken = token || Cookies.get('auth_token');

      if (!authToken) {
        // Could add a notification system here if needed
        return;
      }

      // Determine selected media URL (support JSON array stored in result_url)
      const selectedMediaUrl = (() => {
        if (!job.result_url) return undefined;
        try {
          const parsed = JSON.parse(job.result_url);
          if (
            Array.isArray(parsed) &&
            parsed.every((v) => typeof v === 'string')
          ) {
            return parsed[activeIndex] ?? parsed[0];
          }
        } catch {
          // not JSON, fall through
        }
        return job.result_url;
      })();

      const response = await fetch('/api/reels/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          jobId: job.job_id,
          category: job.category,
          type: job.type,
          // Send the selected media URL (if undefined, server can handle)
          videoUrl: selectedMediaUrl,
          caption: job.caption,
        }),
      });

      if (response.ok) {
        await response.json();

        // Refresh the job to get updated status
        onRefresh(job);
      } else {
        // Handle specific error cases (token expired etc.)
        if (response.status === 401) {
          // Authentication failed - token may be expired
        }
      }
    } catch {
      // Error posting reel
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
          <p>{displayCaption}</p>
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

  // Dialog-based fullscreen viewer will handle escape & backdrop click via Dialog component
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
      return (
        url &&
        (url.includes('drive.google.com') || url.includes('docs.google.com'))
      );
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

      return fileId
        ? `https://drive.google.com/file/d/${fileId}/preview`
        : null;
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

    // Build media list: support single URL or JSON array of URLs stored in result_url
    const getMediaList = (raw?: string): string[] => {
      return parseMediaUrls(raw);
    };

    if (
      (job.status === 'completed' ||
        job.status === 'approved' ||
        job.status === 'posted') &&
      job.result_url
    ) {
      const media = getMediaList(job.result_url);
      const firstUrl = media[activeIndex] || media[0];
      const isGoogleDrive = isGoogleDriveLink(firstUrl);
      const viewUrl = isGoogleDrive
        ? getGoogleDriveViewUrl(firstUrl)
        : firstUrl;
      const embedUrl = isGoogleDrive ? getGoogleDriveEmbedUrl(firstUrl) : null;

      // Development debug: log media detection to help troubleshooting
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.debug('JobStatusCard media debug', {
            job_id: job.job_id,
            media,
            firstUrl,
            isGoogleDrive,
            viewUrl,
            embedUrl,
            matchesVideo: firstUrl?.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)
              ? true
              : false,
            matchesImage: firstUrl?.match(
              /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i
            )
              ? true
              : false,
          });
        } catch {
          // ignore logging errors in production/dev
        }
      }

      // Simplified preview card with arrow controls and a dialog-based fullscreen viewer
      return (
        <div className="space-y-2">
          <div
            className="relative bg-gray-100 rounded-lg overflow-hidden transition-all duration-300 aspect-video"
            tabIndex={0}
            aria-roledescription="carousel"
            aria-label={`Reel media carousel, ${media.length} items`}
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (!media || media.length <= 1) return;
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setActiveIndex((s) => (s - 1 + media.length) % media.length);
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setActiveIndex((s) => (s + 1) % media.length);
              }
            }}
          >
            {/* Left nav */}
            {media.length > 1 && (
              <button
                aria-label="Previous"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((s) => (s - 1 + media.length) % media.length);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 shadow-sm"
              >
                ‹
              </button>
            )}

            {/* Right nav */}
            {media.length > 1 && (
              <button
                aria-label="Next"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((s) => (s + 1) % media.length);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 shadow-sm"
              >
                ›
              </button>
            )}

            {/* Media content */}
            <div className="w-full h-full flex items-center justify-center bg-black/5">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className={`rounded-lg w-full h-full`}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  title="Reel Media"
                />
              ) : firstUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? (
                <video
                  ref={videoRef}
                  className={`rounded-lg w-full h-full object-contain`}
                  controls
                  preload="metadata"
                  controlsList="nodownload"
                >
                  <source src={firstUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : firstUrl.match(/\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i) ||
                isGoogleDrive ? (
                isGoogleDrive && embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className={`rounded-lg w-full h-full`}
                    allow="autoplay"
                    title="Reel Image"
                  />
                ) : (
                  <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-50">
                    <Image
                      src={firstUrl || '/placeholder.svg'}
                      alt="Reel Media"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Play className="h-4 w-4 text-white ml-0.5" />
                    </div>
                    <p className="text-xs text-gray-600">
                      {job.status === 'posted'
                        ? 'Posted'
                        : job.status === 'approved'
                          ? 'Approved'
                          : 'Reel Ready'}
                    </p>
                  </div>
                </div>
              )}

              {/* Caption overlay */}
              {job.caption && (
                <div className="absolute left-0 right-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white text-xs">
                  <div className="max-w-full truncate">{job.caption}</div>
                </div>
              )}
            </div>
          </div>

          {/* Controls: Fullscreen dialog + Post button */}
          <div className="flex space-x-2">
            <Button
              size="sm"
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs"
              onClick={() => setIsDialogOpen(true)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View in fullscreen
            </Button>

            {job.status !== 'posted' && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs bg-transparent"
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

          {/* Fullscreen Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="p-0 bg-black">
              <DialogHeader className="p-3">
                <DialogTitle>Preview — {job.job_id}</DialogTitle>
                <DialogClose onClose={() => setIsDialogOpen(false)} />
              </DialogHeader>

              <div className="relative w-full h-[70vh] sm:h-[75vh] md:h-[80vh] flex items-center justify-center">
                {/* Left arrow inside dialog */}
                {media.length > 1 && (
                  <button
                    aria-label="Previous"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(
                        (s) => (s - 1 + media.length) % media.length
                      );
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 shadow"
                  >
                    ‹
                  </button>
                )}

                {/* Right arrow inside dialog */}
                {media.length > 1 && (
                  <button
                    aria-label="Next"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex((s) => (s + 1) % media.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 shadow"
                  >
                    ›
                  </button>
                )}

                <div className="w-full h-full flex items-center justify-center">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      title="Fullscreen Media"
                    />
                  ) : firstUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-contain"
                      controls
                      preload="metadata"
                      controlsList="nodownload"
                    >
                      <source src={firstUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : firstUrl.match(
                      /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i
                    ) || isGoogleDrive ? (
                    isGoogleDrive && embedUrl ? (
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allow="autoplay"
                        title="Fullscreen Image"
                      />
                    ) : (
                      <div className="w-full h-full relative">
                        <Image
                          src={firstUrl || '/placeholder.svg'}
                          alt="Fullscreen Media"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-white">No preview available</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
                {job.status === 'pending'
                  ? 'Pending Approval...'
                  : 'Generating...'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-sm h-10 border-teal-300 text-teal-600 hover:bg-teal-100 hover:border-teal-400 transition-all duration-200 active:scale-[0.98] font-medium bg-transparent"
            onClick={() => onRefresh(job)}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
            />
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
                <p
                  className="text-xs text-red-500 mt-1 max-w-32 truncate"
                  title={job.error_message}
                >
                  {job.error_message}
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-sm h-10 border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 transition-all duration-200 active:scale-[0.98] font-medium bg-transparent"
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
          <span className="text-xs text-gray-500">Job ID: {job.job_id}</span>
        </div>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
