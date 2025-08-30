"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Sword,
  Crown,
  Users,
  BookOpen,
  Heart,
  Shield,
  Brain,
  Palette,
  Utensils,
  PawPrint,
  Clock,
  TrendingUp,
  Settings
} from "lucide-react";

interface ReelType {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: string;
}

interface ReelCategory {
  id: string;
  title: string;
  description: string;
  types: ReelType[];
}

const reelCategories: ReelCategory[] = [
  {
    id: "viral",
    title: "Viral Reels",
    description: "High-engagement content designed to go viral",
    types: [
      { id: "gym-motivation", title: "Gym Motivation", icon: <Zap className="h-5 w-5" />, category: "viral" },
      { id: "war-motivation", title: "War Motivation/Wisdom", icon: <Sword className="h-5 w-5" />, category: "viral" },
      { id: "medieval-war", title: "Medieval War Motivation", icon: <Crown className="h-5 w-5" />, category: "viral" },
      { id: "gangsters", title: "1920s Gangsters", icon: <Users className="h-5 w-5" />, category: "viral" },
    ]
  },
  {
    id: "proverbs",
    title: "Proverbs Viral Reels",
    description: "Wisdom-based content with powerful messages",
    types: [
      { id: "wisdom", title: "Wisdom", icon: <BookOpen className="h-5 w-5" />, category: "proverbs" },
      { id: "motivation", title: "Motivation", icon: <Heart className="h-5 w-5" />, category: "proverbs" },
      { id: "brotherhood", title: "Brotherhood", icon: <Users className="h-5 w-5" />, category: "proverbs" },
      { id: "bravery", title: "Bravery", icon: <Shield className="h-5 w-5" />, category: "proverbs" },
    ]
  },
  {
    id: "anime",
    title: "Anime Style Reels",
    description: "Anime-inspired content with unique aesthetics",
    types: [
      { id: "theory", title: "Theory", icon: <Brain className="h-5 w-5" />, category: "anime" },
      { id: "painting", title: "Painting", icon: <Palette className="h-5 w-5" />, category: "anime" },
    ]
  },
  {
    id: "asmr",
    title: "ASMR Reels",
    description: "Relaxing and satisfying content",
    types: [
      { id: "food", title: "Food", icon: <Utensils className="h-5 w-5" />, category: "asmr" },
      { id: "animal", title: "Animal", icon: <PawPrint className="h-5 w-5" />, category: "asmr" },
    ]
  }
];

interface DashboardProps {
  onReelSelect: (categoryId: string, typeId: string) => void;
}

export const Dashboard = ({ onReelSelect }: DashboardProps) => {
  const [selectedReel, setSelectedReel] = useState<{ category: string; type: string } | null>(null);

  const handleReelSelect = (categoryId: string, typeId: string) => {
    setSelectedReel({ category: categoryId, type: typeId });
    onReelSelect(categoryId, typeId);
  };

  return (
    <div className="flex-1 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reel Generator Dashboard</h1>
        <p className="text-gray-600">Create engaging content for your Instagram account</p>
      </div>

      <Tabs defaultValue="creation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="creation">Creation</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="creation" className="space-y-6">
          <div className="grid gap-6">
            {reelCategories.map((category) => (
              <Card key={category.id} className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {category.title}
                    <Badge variant="secondary" className="text-xs">
                      {category.types.length} types
                    </Badge>
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {category.types.map((type) => {
                      const isSelected = selectedReel?.category === category.id && selectedReel?.type === type.id;
                      return (
                        <Button
                          key={type.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`h-auto p-4 flex-col gap-2 ${isSelected ? 'bg-blue-600 text-white' : ''}`}
                          onClick={() => handleReelSelect(category.id, type.id)}
                        >
                          {type.icon}
                          <span className="text-sm">{type.title}</span>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Generations
              </CardTitle>
              <CardDescription>Your previously generated reels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity found</p>
                <p className="text-sm">Generated reels will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                n8n Workflows
              </CardTitle>
              <CardDescription>Manage your automation workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No workflows configured</p>
                <p className="text-sm">Connect your n8n workflows to automate reel generation</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function Home() {
  const handleReelSelect = (categoryId: string, typeId: string) => {
    console.log('Selected reel:', { categoryId, typeId });
    // Handle reel selection logic here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard onReelSelect={handleReelSelect} />
    </div>
  );
}
