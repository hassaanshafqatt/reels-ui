import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
}

export default function ErrorState({
  title = 'Failed to load reel data',
  message,
}: ErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
        <div>
          <h3 className="font-medium text-red-900">{title}</h3>
          <p className="text-red-700 text-sm mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}
