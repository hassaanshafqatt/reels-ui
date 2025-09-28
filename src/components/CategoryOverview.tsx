import React from 'react';
import { Sparkles } from 'lucide-react';

interface CategoryOverviewProps {
  title: string;
  description?: string;
}

export default function CategoryOverview({
  title,
  description,
}: CategoryOverviewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="bg-teal-600 p-4 sm:p-6 rounded-t-xl text-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold truncate">{title}</h2>
            {description && (
              <p className="text-teal-100 mt-1 text-sm sm:text-base">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
