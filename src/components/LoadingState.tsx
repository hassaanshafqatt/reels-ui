import React from "react";
import { Loader } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Loading reel categories..." }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center space-x-3">
        <Loader className="h-6 w-6 animate-spin text-teal-600" />
        <span className="text-gray-600">{message}</span>
      </div>
    </div>
  );
}
