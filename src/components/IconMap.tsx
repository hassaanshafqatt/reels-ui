import React from 'react';
import {
  Dumbbell,
  Sword,
  Shield,
  Crown,
  Brain,
  Zap,
  HandHeart,
  Heart,
  Lightbulb,
  PaintBucket,
  Utensils,
  PawPrint,
  Music,
  Palette,
} from 'lucide-react';

// Icon mapping for database icon names
export const iconMap: Record<string, React.ReactNode> = {
  Dumbbell: <Dumbbell className="h-4 w-4" />,
  Sword: <Sword className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Crown: <Crown className="h-4 w-4" />,
  Brain: <Brain className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  HandHeart: <HandHeart className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Lightbulb: <Lightbulb className="h-4 w-4" />,
  PaintBucket: <PaintBucket className="h-4 w-4" />,
  Utensils: <Utensils className="h-4 w-4" />,
  PawPrint: <PawPrint className="h-4 w-4" />,
  Music: <Music className="h-4 w-4" />,
  Palette: <Palette className="h-4 w-4" />,
};

export default iconMap;
