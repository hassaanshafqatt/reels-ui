import React from 'react';
import { Sparkles, Instagram, Clock } from 'lucide-react';

interface SubTabNavigationProps {
  activeSubTab: string;
  onSubTabChange: (subTab: string) => void;
}

export default function SubTabNavigation({
  activeSubTab,
  onSubTabChange,
}: SubTabNavigationProps) {
  const subTabs = [
    {
      key: 'generate',
      label: 'Generate',
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      key: 'post',
      label: 'Post & Schedule',
      icon: <Instagram className="h-4 w-4" />,
    },
    { key: 'history', label: 'History', icon: <Clock className="h-4 w-4" /> },
  ];

  return (
    <div className="border-b border-gray-100">
      <nav className="flex">
        {subTabs.map((subTab) => {
          const isActive = activeSubTab === subTab.key;

          return (
            <button
              key={subTab.key}
              onClick={() => onSubTabChange(subTab.key)}
              className={`flex-1 relative px-4 sm:px-6 py-4 text-sm font-medium transition-all duration-300 group ${
                isActive
                  ? 'text-teal-600 bg-teal-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <div
                  className={`transition-colors duration-300 ${
                    isActive
                      ? 'text-teal-600'
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                >
                  {subTab.icon}
                </div>
                <span className="hidden sm:inline">{subTab.label}</span>
                <span className="sm:hidden">{subTab.label.split(' ')[0]}</span>
              </div>
              {/* Active indicator */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 transition-all duration-300 ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {/* Hover indicator */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300 transition-all duration-300 ${
                  !isActive ? 'opacity-0 group-hover:opacity-50' : 'opacity-0'
                }`}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
