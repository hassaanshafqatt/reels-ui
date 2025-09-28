import React from 'react';
import { Upload, Music, X, AlertCircle } from 'lucide-react';

interface AudioUploadProps {
  customAudioFile: File | null;
  audioError: string | null;
  onFileSelect: (file: File | null) => void;
  onValidateFile: (file: File) => Promise<boolean>;
}

export default function AudioUpload({
  customAudioFile,
  audioError,
  onFileSelect,
  onValidateFile,
}: AudioUploadProps) {
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
      <div className="space-y-3">
        <div className="text-xs sm:text-sm font-medium text-teal-900">
          Upload Audio File
        </div>

        {!customAudioFile ? (
          <div className="relative">
            <input
              type="file"
              accept="audio/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const isValid = await onValidateFile(file);
                  if (isValid) {
                    onFileSelect(file);
                  }
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="border-2 border-dashed border-teal-300 rounded-lg p-4 text-center hover:border-teal-400 transition-colors">
              <Upload className="h-6 w-6 text-teal-500 mx-auto mb-2" />
              <div className="text-sm text-teal-700">
                Click to upload audio file
              </div>
              <div className="text-xs text-teal-600 mt-1">
                MP3, WAV, M4A • Max 60s • Up to 10MB
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-teal-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <Music className="h-4 w-4 text-teal-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-teal-900 truncate">
                    {customAudioFile.name}
                  </div>
                  <div className="text-xs text-teal-600">
                    {(customAudioFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <button
                onClick={() => onFileSelect(null)}
                className="text-teal-500 hover:text-teal-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Audio Error Display */}
        {audioError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{audioError}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
