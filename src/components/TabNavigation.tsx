import React from 'react';
import { getIconFromDatabase } from '@/lib/iconUtils';

interface Category {
  id: string;
  name: string;
  title: string;
  icon?: string;
}

interface TabNavigationProps {
  categories: Category[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNavigation({
  categories,
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  // Category color schemes for visual distinction - all teal-based flat colors
  // getCategoryColors intentionally omitted - keep for future UI theming
  const getCategoryColors = (name: string) => {
    void name;
    return 'bg-gray-400';
  };
  void getCategoryColors;

  return (
    <div className="mb-6 sm:mb-8">
      {/* Unified design for both mobile and desktop */}
      <div className="border-b border-gray-200 bg-white rounded-t-xl">
        {/* Mobile: Scrollable container */}
        <div className="sm:hidden overflow-x-auto scrollbar-hide">
          <nav className="flex px-3 min-w-max space-x-2">
            {categories.map((category) => {
              const mobileTitle = category.title
                .replace('Viral Reels', 'Viral')
                .replace('Proverbs Viral Reels', 'Proverbs')
                .replace('Anime Style Reels', 'Anime')
                .replace('ASMR Reels', 'ASMR');

              const isActive = activeTab === category.name;

              return (
                <button
                  key={category.id}
                  onClick={() => onTabChange(category.name)}
                  className={`relative py-3 px-3 text-sm font-medium border-b-2 transition-all duration-200 group whitespace-nowrap touch-target min-w-[64px] truncate ${
                    isActive
                      ? 'text-teal-600 border-teal-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {/* Icon from database */}
                    <div
                      className={`transition-transform duration-300 ${isActive ? 'text-teal-600' : 'text-gray-400'}`}
                    >
                      {getIconFromDatabase(category.icon || 'Sparkles')}
                    </div>
                    <span className="max-w-[84px] truncate text-xs">
                      {mobileTitle}
                    </span>
                  </div>
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-teal-600 rounded-full"></div>
                  )}
                  {/* Hover effect */}
                  <div
                    className={`absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gray-300 rounded-full transition-all duration-200 group-hover:w-full ${isActive ? 'hidden' : ''}`}
                  ></div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop: Standard layout */}
        <div className="hidden sm:block">
          <nav className="flex space-x-8 px-6">
            {categories.map((category) => {
              const isActive = activeTab === category.name;

              return (
                <button
                  key={category.id}
                  onClick={() => onTabChange(category.name)}
                  className={`relative py-4 px-1 text-sm font-medium border-b-2 transition-all duration-200 group ${
                    isActive
                      ? 'text-teal-600 border-teal-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {category.title}
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-teal-600 rounded-full"></div>
                  )}
                  {/* Hover effect */}
                  <div
                    className={`absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gray-300 rounded-full transition-all duration-200 group-hover:w-full ${isActive ? 'hidden' : ''}`}
                  ></div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
