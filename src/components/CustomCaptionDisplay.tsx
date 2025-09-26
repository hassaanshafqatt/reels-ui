import React from "react";

interface CustomCaptionDisplayProps {
  customCaption: string;
  customAuthor?: string;
  activeTab?: string;
  includeAuthor?: boolean;
  captionLabel?: string;
}

export default function CustomCaptionDisplay({ 
  customCaption, 
  customAuthor, 
  activeTab,
  includeAuthor = false
  , captionLabel
}: CustomCaptionDisplayProps) {
  void activeTab;
  if (!customCaption) return null;

  return (
    <div className="bg-white border border-black rounded-lg p-3 shadow-sm">
      <div className="text-xs sm:text-sm font-medium text-black mb-1">{captionLabel ? `Current ${captionLabel}:` : 'Current Custom Caption:'}</div>
      <div className="text-xs sm:text-sm text-black break-words">{customCaption}</div>
      {includeAuthor && customAuthor && (
        <div className="mt-2 pt-2 border-t border-gray-300">
          <div className="text-xs font-medium text-black">Author:</div>
          <div className="text-xs text-black">— {customAuthor}</div>
        </div>
      )}
    </div>
  );
}
