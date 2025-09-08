import React from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

interface MessageProps {
  type: "error" | "success";
  message: string;
  onClose?: () => void;
}

export default function Message({ type, message, onClose }: MessageProps) {
  const isError = type === "error";
  
  return (
    <div className={`${
      isError 
        ? "bg-red-50 border-red-200" 
        : "bg-emerald-50 border-emerald-200"
    } border rounded-xl p-3 sm:p-4 animate-in slide-in-from-top-2 duration-300 relative`}>
      <div className="flex items-start space-x-3">
        <div className={`w-5 h-5 ${
          isError ? "bg-red-500" : "bg-emerald-500"
        } rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
          {isError ? (
            <AlertCircle className="h-3 w-3 text-white" />
          ) : (
            <CheckCircle className="h-3 w-3 text-white" />
          )}
        </div>
        <div className="min-w-0 flex-1 pr-8">
          <span className={`font-semibold ${
            isError ? "text-red-800" : "text-emerald-800"
          } text-sm sm:text-base`}>
            {isError ? "Error" : "Success"}
          </span>
          <p className={`${
            isError ? "text-red-700" : "text-emerald-700"
          } text-xs sm:text-sm mt-1 break-words`}>
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`absolute top-2 right-2 p-1 rounded-lg hover:bg-white/50 transition-colors ${
              isError ? "text-red-600 hover:text-red-800" : "text-emerald-600 hover:text-emerald-800"
            }`}
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
