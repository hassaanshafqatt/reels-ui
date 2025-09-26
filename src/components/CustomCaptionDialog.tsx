"use client"

import { DialogFooter } from "@/components/ui/dialog"

import type React from "react"
import { useId, useMemo, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface CustomCaptionDialogProps {
  isOpen: boolean
  onClose: () => void
  tempCustomCaption: string
  setTempCustomCaption: (caption: string) => void
  tempAuthor: string
  setTempAuthor: (author: string) => void
  activeTab?: string
  onSave: () => void
  minCaptionLength?: number
  maxCaptionLength?: number
  includeAuthor?: boolean
  // Label overrides from admin settings
  titleLabel?: string
  descriptionLabel?: string
  captionLabel?: string
  captionPlaceholder?: string
  cancelLabel?: string
  saveLabel?: string
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
  includeAuthor = false,
  titleLabel = "Custom Caption",
  descriptionLabel = "Write your own caption for the reel. This will override the AI-generated caption.",
  captionLabel = "Caption",
  captionPlaceholder = `Write your custom caption here... (${minCaptionLength}-${maxCaptionLength} words required)`,
  cancelLabel = "Cancel",
  saveLabel = "",
}: CustomCaptionDialogProps) {
  void activeTab

  // a11y: generate stable ids for inputs and helper texts
  const captionId = useId()
  const authorId = useId()
  const captionCountId = `${captionId}-count`
  const captionMsgId = `${captionId}-msg`
  const authorHelpId = `${authorId}-help`

  const countWords = useCallback((text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length
  }, [])

  const trimmedCaption = useMemo(() => tempCustomCaption.trim(), [tempCustomCaption])

  const wordCount = useMemo(() => countWords(tempCustomCaption), [tempCustomCaption, countWords])

  const isValidLength = useMemo(() => {
    return wordCount >= minCaptionLength && wordCount <= maxCaptionLength && trimmedCaption.length > 0
  }, [wordCount, minCaptionLength, maxCaptionLength, trimmedCaption])

  const getWordCountColor = () => {
    if (wordCount < minCaptionLength) return "text-red-500"
    if (wordCount > maxCaptionLength) return "text-red-500"
    return "text-green-600"
  }

  const getWordCountMessage = () => {
    if (wordCount < minCaptionLength && trimmedCaption.length > 0) {
      return `Caption needs at least ${minCaptionLength - wordCount} more words`
    }
    if (wordCount > maxCaptionLength) {
      return `Caption exceeds limit by ${wordCount - maxCaptionLength} words`
    }
    return null
  }

  const handleCaptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      const newWordCount = countWords(newValue)
      // Preserves existing behavior: block updates beyond max words
      if (newWordCount <= maxCaptionLength) {
        setTempCustomCaption(newValue)
      }
    },
    [countWords, maxCaptionLength, setTempCustomCaption],
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-8">
        <DialogClose onClose={onClose}>
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader className="pb-6">
          <DialogTitle className="text-lg font-semibold">{titleLabel}</DialogTitle>
          <DialogDescription className="text-base">{descriptionLabel}</DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3" htmlFor={captionId}>
                {captionLabel}
              </label>
              <textarea
                id={captionId}
                rows={4}
                className="w-full min-h-[120px] max-h-[200px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-base leading-relaxed"
                placeholder={captionPlaceholder}
                value={tempCustomCaption}
                onChange={handleCaptionChange}
                aria-invalid={trimmedCaption.length > 0 && !isValidLength ? true : undefined}
                aria-describedby={
                  trimmedCaption.length > 0
                    ? `${captionCountId}${getWordCountMessage() ? ` ${captionMsgId}` : ""}`
                    : undefined
                }
                autoCorrect="on"
                autoCapitalize="sentences"
                spellCheck={true}
              />
              <div className="flex justify-end items-center mt-3">
                {trimmedCaption.length > 0 && (
                  <div
                    id={captionCountId}
                    role="status"
                    aria-live="polite"
                    className={`text-sm font-medium ${getWordCountColor()}`}
                  >
                    {wordCount}/{minCaptionLength}-{maxCaptionLength} words
                  </div>
                )}
              </div>
              {getWordCountMessage() && (
                <div id={captionMsgId} className="text-sm text-red-500 mt-2" role="alert" aria-live="assertive">
                  {getWordCountMessage()}
                </div>
              )}
            </div>

            {/* Author field - show based on reel type setting */}
            {includeAuthor && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3" htmlFor={authorId}>
                  Author <span className="text-gray-500 text-sm">(optional)</span>
                </label>
                <input
                  id={authorId}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base h-12"
                  placeholder="e.g., Sun Tzu, Marcus Aurelius, etc."
                  value={tempAuthor}
                  onChange={(e) => setTempAuthor(e.target.value)}
                  maxLength={50}
                  aria-describedby={authorHelpId}
                />
                <div id={authorHelpId} className="text-sm text-gray-500 mt-2">
                  Attribution for quotes or wisdom
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-4 pt-8 border-t border-gray-200 mt-8">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto text-base h-12 px-6 bg-transparent"
            type="button"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onSave}
            disabled={!isValidLength}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-base h-12 px-6"
            type="button"
          >
            {saveLabel && saveLabel.length > 0 ? saveLabel : `Save ${captionLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
