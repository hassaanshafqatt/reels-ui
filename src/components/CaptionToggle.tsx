import React from "react";
import { Brain, Palette } from "lucide-react";

interface CaptionToggleProps {
  generateCaption: boolean;
  onToggleCaption: (generate: boolean) => void;
  onOpenCustomDialog: () => void;
  // Optional override labels
  labelAuto?: string;
  labelAutoSub?: string;
  labelCustom?: string;
  labelCustomSub?: string;
}

export default function CaptionToggle({ 
  generateCaption, 
  onToggleCaption, 
  onOpenCustomDialog,
  labelAuto = 'Auto-Generate',
  labelAutoSub = 'AI creates caption',
  labelCustom = 'Custom Caption',
  labelCustomSub = 'Write your own'
}: CaptionToggleProps) {
  return (
    <div className="bg-gray-50 p-1 rounded-xl">
      <div className="grid grid-cols-2 gap-1">
        {/* Auto-Generate Caption Toggle */}
        <button
          onClick={() => onToggleCaption(true)}
          className={`p-3 rounded-lg transition-all duration-200 text-left ${
            generateCaption
              ? 'bg-white shadow-sm border border-gray-200'
              : 'hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              generateCaption ? 'bg-teal-600' : 'bg-gray-400'
            }`}>
              <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`font-medium text-xs sm:text-sm ${
                generateCaption ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {labelAuto}
              </div>
              <p className={`text-xs ${
                generateCaption ? 'text-gray-600' : 'text-gray-500'
              }`}>{labelAutoSub}</p>
            </div>
          </div>
        </button>

        {/* Custom Caption Toggle */}
        <button
          onClick={onOpenCustomDialog}
          className={`p-3 rounded-lg transition-all duration-200 text-left ${
            !generateCaption
              ? 'bg-white shadow-sm border border-gray-200'
              : 'hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              !generateCaption ? 'bg-teal-600' : 'bg-gray-400'
            }`}>
              <Palette className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`font-medium text-xs sm:text-sm ${
                !generateCaption ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {labelCustom}
              </div>
              <p className={`text-xs ${
                !generateCaption ? 'text-gray-600' : 'text-gray-500'
              }`}>{labelCustomSub}</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
