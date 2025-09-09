import React from 'react';
import {
  Zap,
  Dumbbell,
  BookOpen,
  Sword,
  Music,
  Brain,
  Palette,
  Shield,
  Crown,
  HandHeart,
  Heart,
  Lightbulb,
  PaintBucket,
  Utensils,
  PawPrint,
  Settings,
  Users,
  Sparkles,
  Headphones
} from 'lucide-react';

/**
 * Maps database icon names to Lucide React components
 * @param iconName - The icon name stored in the database
 * @param className - CSS classes to apply to the icon (default: "h-4 w-4")
 * @returns React component for the icon
 */
export const getIconFromDatabase = (iconName: string, className: string = "h-4 w-4"): React.ReactElement => {
  const iconComponents: Record<string, React.ComponentType<{className?: string}>> = {
    'Zap': Zap,
    'Dumbbell': Dumbbell,
    'BookOpen': BookOpen,
    'Sword': Sword,
    'Music': Music,
    'Brain': Brain,
    'Palette': Palette,
    'Shield': Shield,
    'Crown': Crown,
    'HandHeart': HandHeart,
    'Heart': Heart,
    'Lightbulb': Lightbulb,
    'PaintBucket': PaintBucket,
    'Utensils': Utensils,
    'PawPrint': PawPrint,
    'Settings': Settings,
    'Users': Users,
    'Sparkles': Sparkles,
    'Headphones': Headphones
  };
  
  const IconComponent = iconComponents[iconName] || Sparkles;
  return React.createElement(IconComponent, { className });
};

/**
 * Get all available icon names for database storage
 * @returns Array of icon names
 */
export const getAvailableIconNames = (): string[] => {
  return [
    'Zap',
    'Dumbbell', 
    'BookOpen',
    'Sword',
    'Music',
    'Brain',
    'Palette',
    'Shield',
    'Crown',
    'HandHeart',
    'Heart',
    'Lightbulb',
    'PaintBucket',
    'Utensils',
    'PawPrint',
    'Settings',
    'Users',
    'Sparkles',
    'Headphones'
  ];
};
