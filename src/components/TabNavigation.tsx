import React from "react";
import { Zap, Heart, Sparkles, Headphones, Crown, Brain } from "lucide-react";

interface Category {
  id: string;
  name: string;
  title: string;
}

interface TabNavigationProps {
  categories: Category[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNavigation({ categories, activeTab, onTabChange }: TabNavigationProps) {
  // Category icon mapping for enhanced visual appeal
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'fitness': <Zap className="h-4 w-4" />,
      'motivation': <Heart className="h-4 w-4" />,
      'proverbs': <Brain className="h-4 w-4" />,
      'anime': <Sparkles className="h-4 w-4" />,
      'asmr': <Headphones className="h-4 w-4" />,
      'default': <Crown className="h-4 w-4" />
    };
    return iconMap[categoryName] || iconMap['default'];
  };

  // Category color schemes for visual distinction - all teal-based flat colors
  const getCategoryColors = (categoryName: string, isActive: boolean) => {
    const colorMap: Record<string, { active: string; inactive: string; gradient: string }> = {
      'fitness': {
        active: 'bg-teal-500 text-white shadow-teal-200',
        inactive: 'text-teal-600 hover:bg-teal-50 border-teal-200',
        gradient: 'from-teal-500 to-emerald-600'
      },
      'motivation': {
        active: 'bg-teal-600 text-white shadow-teal-200',
        inactive: 'text-teal-700 hover:bg-teal-50 border-teal-300',
        gradient: 'from-teal-600 to-cyan-600'
      },
      'proverbs': {
        active: 'bg-emerald-600 text-white shadow-emerald-200',
        inactive: 'text-emerald-600 hover:bg-emerald-50 border-emerald-200',
        gradient: 'from-emerald-500 to-teal-600'
      },
      'anime': {
        active: 'bg-cyan-600 text-white shadow-cyan-200',
        inactive: 'text-cyan-600 hover:bg-cyan-50 border-cyan-200',
        gradient: 'from-cyan-500 to-teal-600'
      },
      'asmr': {
        active: 'bg-teal-700 text-white shadow-teal-200',
        inactive: 'text-teal-500 hover:bg-teal-50 border-teal-200',
        gradient: 'from-teal-400 to-teal-700'
      },
      'default': {
        active: 'bg-teal-600 text-white shadow-teal-200',
        inactive: 'text-teal-600 hover:bg-teal-50 border-teal-200',
        gradient: 'from-teal-500 to-cyan-600'
      }
    };
    const colors = colorMap[categoryName] || colorMap['default'];
    return isActive ? colors.active : colors.inactive;
  };

  return (
    <div className="mb-6 sm:mb-8">
      {/* Unified design for both mobile and desktop */}
      <div className="border-b border-gray-200 bg-white rounded-t-xl">
        {/* Mobile: Scrollable container */}
        <div className="sm:hidden overflow-x-auto scrollbar-hide">
          <nav className="flex px-4 min-w-max">
            {categories.map((category) => {
              const mobileTitle = category.title
                .replace("Viral Reels", "Viral")
                .replace("Proverbs Viral Reels", "Proverbs") 
                .replace("Anime Style Reels", "Anime")
                .replace("ASMR Reels", "ASMR");
              
              const isActive = activeTab === category.name;
              
              return (
                <button
                  key={category.id}
                  onClick={() => onTabChange(category.name)}
                  className={`relative py-4 px-4 text-sm font-medium border-b-2 transition-all duration-200 group whitespace-nowrap ${
                    isActive
                      ? 'text-teal-600 border-teal-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {/* Icon for mobile */}
                    <div className={`transition-transform duration-300 ${isActive ? 'text-teal-600' : 'text-gray-400'}`}>
                      {getCategoryIcon(category.name)}
                    </div>
                    <span>{mobileTitle}</span>
                  </div>
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-teal-600 rounded-full"></div>
                  )}
                  {/* Hover effect */}
                  <div className={`absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gray-300 rounded-full transition-all duration-200 group-hover:w-full ${isActive ? 'hidden' : ''}`}></div>
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
                  <div className={`absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gray-300 rounded-full transition-all duration-200 group-hover:w-full ${isActive ? 'hidden' : ''}`}></div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
