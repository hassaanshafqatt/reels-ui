import React from 'react';
import { Zap } from 'lucide-react';
import { iconMap } from '@/components/IconMap';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { type ReelType as DatabaseReelType } from '@/lib/reelService';

interface ReelTypeGridProps {
  types: DatabaseReelType[];
  selectedReel: DatabaseReelType | null;
  selectedCategory: string;
  categoryName: string;
  onReelSelect: (categoryId: string, typeId: string) => void;
}

export default function ReelTypeGrid({
  types,
  selectedReel,
  selectedCategory,
  categoryName,
  onReelSelect,
}: ReelTypeGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {types.map((type) => (
        <SimpleTooltip
          key={type.id}
          content={`Generate ${type.title} - ${type.description || 'Click to select this reel type and customize your content'}`}
          side="top"
        >
          <div
            className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedReel?.id === type.id && selectedCategory === categoryName
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
            }`}
            onClick={() => onReelSelect(categoryName, type.name)}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selectedReel?.id === type.id &&
                  selectedCategory === categoryName
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {iconMap[type.icon || ''] || <Zap className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                  {type.title}
                </h4>
                <p className="text-gray-500 text-xs sm:text-sm capitalize">
                  {categoryName}
                </p>
              </div>
            </div>
          </div>
        </SimpleTooltip>
      ))}
    </div>
  );
}
