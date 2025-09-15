import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CustomCaptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tempCustomCaption: string;
  setTempCustomCaption: (caption: string) => void;
  tempAuthor: string;
  setTempAuthor: (author: string) => void;
  activeTab: string;
  onSave: () => void;
  minCaptionLength?: number;
  maxCaptionLength?: number;
  includeAuthor?: boolean;
}

export default function CustomCaptionDialog({
  isOpen,
  onClose,
  tempCustomCaption,
  setTempCustomCaption,
  tempAuthor,
  setTempAuthor,
  activeTab,
  onSave,
  minCaptionLength = 110,
  maxCaptionLength = 140,
  includeAuthor = false
}: CustomCaptionDialogProps) {
  const wordCount = tempCustomCaption.trim().split(/\s+/).filter(word => word.length > 0).length;
  const isValidLength = wordCount >= minCaptionLength && wordCount <= maxCaptionLength && tempCustomCaption.trim().length > 0;

  const getWordCountColor = () => {
    if (wordCount < minCaptionLength) return 'text-red-500';
    if (wordCount > maxCaptionLength) return 'text-red-500';
    return 'text-green-600';
  };

  const getWordCountMessage = () => {
    if (wordCount < minCaptionLength && tempCustomCaption.trim().length > 0) {
      return `Caption needs at least ${minCaptionLength - wordCount} more words`;
    }
    if (wordCount > maxCaptionLength) {
      return `Caption exceeds limit by ${wordCount - maxCaptionLength} words`;
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="">
        <DialogClose onClose={onClose}>
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-semibold">Custom Caption</DialogTitle>
          <DialogDescription className="text-sm">
            Write your own caption for the reel. This will override the AI-generated caption.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 pt-0">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Caption
              </label>
              <textarea
                rows={4}
                className="w-full min-h-[100px] max-h-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm leading-relaxed"
                placeholder={`Write your custom caption here... (${minCaptionLength}-${maxCaptionLength} words required)`}
                value={tempCustomCaption}
                onChange={(e) => {
                  const newValue = e.target.value;
                  const newWordCount = newValue.trim().split(/\s+/).filter(word => word.length > 0).length;
                  
                  // Only allow the change if word count is at or below the maximum
                  if (newWordCount <= maxCaptionLength) {
                    setTempCustomCaption(newValue);
                  }
                }}
              />
              <div className="flex justify-end items-center mt-2">
                {tempCustomCaption.trim().length > 0 && (
                  <div className={`text-xs font-medium ${getWordCountColor()}`}>
                    {wordCount}/{minCaptionLength}-{maxCaptionLength} words
                  </div>
                )}
              </div>
              {getWordCountMessage() && (
                <div className="text-xs text-red-500 mt-1">
                  {getWordCountMessage()}
                </div>
              )}
            </div>

            {/* Author field - show based on reel type setting */}
            {includeAuthor && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Author <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="e.g., Sun Tzu, Marcus Aurelius, etc."
                  value={tempAuthor}
                  onChange={(e) => setTempAuthor(e.target.value)}
                  maxLength={50}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Attribution for quotes or wisdom
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 pt-2 flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto text-sm h-10"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={!isValidLength}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm h-10"
          >
            Save Caption
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
