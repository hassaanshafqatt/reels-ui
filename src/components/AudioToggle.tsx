import React from 'react';
import { Music, Upload } from 'lucide-react';
import { SimpleTooltip } from '@/components/ui/tooltip';

interface AudioToggleProps {
  useCustomAudio: boolean;
  onToggleAudio: (useCustom: boolean) => void;
  disabled?: boolean;
}

export default function AudioToggle({
  useCustomAudio,
  onToggleAudio,
  disabled = false,
}: AudioToggleProps) {
  return (
    <div className="bg-gray-50 p-1 rounded-xl">
      <div className="grid grid-cols-2 gap-1">
        {/* Auto Audio Toggle */}
        <SimpleTooltip
          content={
            disabled
              ? 'Audio options are disabled for this reel type'
              : 'AI automatically selects appropriate background music that matches your content'
          }
          side="top"
        >
          <button
            onClick={() => !disabled && onToggleAudio(false)}
            className={`p-3 rounded-lg transition-all duration-200 text-left ${
              !useCustomAudio
                ? 'bg-white shadow-sm border border-gray-200'
                : 'hover:bg-gray-100'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  !useCustomAudio ? 'bg-teal-600' : 'bg-gray-400'
                }`}
              >
                <Music className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`font-medium text-xs sm:text-sm ${
                    !useCustomAudio ? 'text-gray-900' : 'text-gray-600'
                  }`}
                >
                  Auto Audio
                </div>
                <p
                  className={`text-xs ${
                    !useCustomAudio ? 'text-gray-600' : 'text-gray-500'
                  }`}
                >
                  AI selects music
                </p>
              </div>
            </div>
          </button>
        </SimpleTooltip>

        {/* Custom Audio Toggle */}
        <SimpleTooltip
          content={
            disabled
              ? 'Audio options are disabled for this reel type'
              : 'Upload your own audio file (max 10MB, 60 seconds). Supports MP3, WAV, and other common formats'
          }
          side="top"
        >
          <button
            onClick={() => !disabled && onToggleAudio(true)}
            className={`p-3 rounded-lg transition-all duration-200 text-left ${
              useCustomAudio
                ? 'bg-white shadow-sm border border-gray-200'
                : 'hover:bg-gray-100'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  useCustomAudio ? 'bg-teal-600' : 'bg-gray-400'
                }`}
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`font-medium text-xs sm:text-sm ${
                    useCustomAudio ? 'text-gray-900' : 'text-gray-600'
                  }`}
                >
                  Custom Audio
                </div>
                <p
                  className={`text-xs ${
                    useCustomAudio ? 'text-gray-600' : 'text-gray-500'
                  }`}
                >
                  Upload your own
                </p>
              </div>
            </div>
          </button>
        </SimpleTooltip>
      </div>
    </div>
  );
}
