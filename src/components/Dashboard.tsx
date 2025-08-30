"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Crown,
  Users,
  BookOpen,
  Heart,
  Shield,
  Brain,
  Palette,
  Clock,
  Settings,
  Sparkles,
  Dumbbell,
  Sword,
  Lightbulb,
  HandHeart,
  PaintBucket,
  Utensils,
  PawPrint,
  Instagram,
  ChevronDown,
  Plus
} from "lucide-react";

interface ReelType {
  id: string;
  title: string;
  icon: React.ReactNode;
  category: string;
  url: string; // Added URL field
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
    description: "High-engagement motivational content",
    types: [
      { 
        id: "gym-motivation", 
        title: "Gym Motivation", 
        icon: <Dumbbell className="h-4 w-4" />, 
        category: "viral",
        url: "/api/reels/gym-motivation"
      },
      { 
        id: "war-motivation", 
        title: "War Motivation/Wisdom", 
        icon: <Sword className="h-4 w-4" />, 
        category: "viral",
        url: "/api/reels/war-motivation"
      },
      { 
        id: "medieval-war", 
        title: "Medieval War Motivation", 
        icon: <Shield className="h-4 w-4" />, 
        category: "viral",
        url: "/api/reels/medieval-war"
      },
      { 
        id: "gangsters", 
        title: "1920s Gangsters", 
        icon: <Crown className="h-4 w-4" />, 
        category: "viral",
        url: "/api/reels/gangsters"
      },
    ]
  },
  {
    id: "proverbs",
    title: "Proverbs Viral Reels",
    description: "Wisdom-based content with deep meaning",
    types: [
      { 
        id: "wisdom", 
        title: "Wisdom", 
        icon: <Brain className="h-4 w-4" />, 
        category: "proverbs",
        url: "/api/reels/wisdom"
      },
      { 
        id: "motivation", 
        title: "Motivation", 
        icon: <Zap className="h-4 w-4" />, 
        category: "proverbs",
        url: "/api/reels/motivation"
      },
      { 
        id: "brotherhood", 
        title: "Brotherhood", 
        icon: <HandHeart className="h-4 w-4" />, 
        category: "proverbs",
        url: "/api/reels/brotherhood"
      },
      { 
        id: "bravery", 
        title: "Bravery", 
        icon: <Heart className="h-4 w-4" />, 
        category: "proverbs",
        url: "/api/reels/bravery"
      },
    ]
  },
  {
    id: "anime",
    title: "Anime Style Reels",
    description: "Anime-inspired creative content",
    types: [
      { 
        id: "theory", 
        title: "Theory", 
        icon: <Lightbulb className="h-4 w-4" />, 
        category: "anime",
        url: "https://n8n.nutrador.com/webhook-test/d1eb881a-33e3-4051-ba1f-1a1f31ba8b69"
      },
      { 
        id: "painting", 
        title: "Painting", 
        icon: <PaintBucket className="h-4 w-4" />, 
        category: "anime",
        url: "/api/reels/anime-painting"
      },
    ]
  },
  {
    id: "asmr",
    title: "ASMR Reels",
    description: "Relaxing and satisfying content",
    types: [
      { 
        id: "food", 
        title: "Food", 
        icon: <Utensils className="h-4 w-4" />, 
        category: "asmr",
        url: "/api/reels/asmr-food"
      },
      { 
        id: "animal", 
        title: "Animal", 
        icon: <PawPrint className="h-4 w-4" />, 
        category: "asmr",
        url: "/api/reels/asmr-animal"
      },
    ]
  }
];

interface DashboardProps {
  onReelSelect: (categoryId: string, typeId: string) => void;
}

export default function Dashboard({
  onReelSelect = () => {}
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState("creation");
  const [selectedReel, setSelectedReel] = useState<ReelType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [generateCaption, setGenerateCaption] = useState(true);
  const [customCaption, setCustomCaption] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReelSelect = (categoryId: string, typeId: string) => {
    const category = reelCategories.find(c => c.id === categoryId);
    const type = category?.types.find(t => t.id === typeId);
    if (type) {
      setSelectedReel(type);
      setSelectedCategory(categoryId);
      setError(null);
      setSuccess(null);
      onReelSelect(categoryId, typeId);
    }
  };

  const handleGenerate = async () => {
    if (!selectedReel) {
      setError("Please select a reel type first");
      return;
    }

    // Get the URL from the reel categories data
    const category = reelCategories.find(c => c.id === selectedCategory);
    const reelType = category?.types.find(t => t.id === selectedReel.id);
    
    if (!reelType?.url) {
      setError("API endpoint not configured for this reel type");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        reelType: selectedReel.id,
        category: selectedCategory,
        generateCaption,
        customCaption: generateCaption ? "" : customCaption,
        timestamp: new Date().toISOString()
      };
      console.log(reelType.url);
      try {
        const response = await fetch(reelType.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setSuccess(`Reel generated successfully! ${result.message || ''}`);
        
        console.log("Reel generation response:", result);
      } catch (error) {
        setError("Error generating reel: " + (error instanceof Error ? error.message : String(error)));
        console.error("Error generating reel:", error);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to generate reel: ${errorMessage}`);
      console.error("Error generating reel:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reel Generator Dashboard</h1>
          <p className="text-gray-600">Create engaging reels for your Instagram account</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
            <TabsTrigger 
              value="creation" 
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=inactive]:text-gray-700"
            >
              Creation
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=inactive]:text-gray-700"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger 
              value="workflows" 
              className="data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=inactive]:text-gray-700"
            >
              Workflows
            </TabsTrigger>
          </TabsList>

          <TabsContent value="creation" className="space-y-6 mt-6">
            {/* Error/Success Messages */}
            {error && (
              <Card className="border border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 text-red-700">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="font-medium">Error:</span>
                    <span>{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {success && (
              <Card className="border border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 text-green-700">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="font-medium">Success:</span>
                    <span>{success}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reel Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reelCategories.map((category) => (
                <Card key={category.id} className="border border-gray-200 hover:shadow-md transition-shadow bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-gray-800">{category.title}</span>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        {category.types.length} types
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-gray-600">{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {category.types.map((type) => {
                        const isSelected = selectedReel?.id === type.id;
                        return (
                          <Button
                            key={type.id}
                            variant="outline"
                            className={`h-auto p-4 flex-col gap-2 border-gray-200 hover:border-teal-300 transition-colors bg-white text-gray-700 hover:bg-gray-50 ${
                              isSelected ? 'border-teal-600 bg-teal-50' : ''
                            }`}
                            onClick={() => handleReelSelect(category.id, type.id)}
                          >
                            {type.icon}
                            <span className="text-sm font-medium">{type.title}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Caption Settings */}
            {selectedReel && (
              <Card className="border border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Sparkles className="h-5 w-5 text-teal-600" />
                    Caption Settings
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Configure your caption for the selected reel type: <span className="font-medium text-teal-600">{selectedReel.title}</span>
                    <br />
                    <span className="text-sm text-gray-500">
                      API Endpoint: {reelCategories.find(c => c.id === selectedCategory)?.types.find(t => t.id === selectedReel.id)?.url || 'Not configured'}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="generateCaption"
                      checked={generateCaption}
                      onChange={(e) => setGenerateCaption(e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="generateCaption" className="font-medium text-gray-700">
                      Generate caption automatically
                    </label>
                  </div>

                  {!generateCaption && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Caption
                      </label>
                      <textarea
                        value={customCaption}
                        onChange={(e) => setCustomCaption(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                        placeholder="Enter your custom caption here..."
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !selectedReel}
                      className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          <span>Generating Reel...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>Generate Reel</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Clock className="h-5 w-5 text-teal-600" />
                  Recent Generations
                </CardTitle>
                <CardDescription className="text-gray-600">Your previously generated reels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No recent activity</p>
                  <p className="text-sm">Generated reels will appear here once you create them</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-6 mt-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Settings className="h-5 w-5 text-teal-600" />
                  Automation Workflows
                </CardTitle>
                <CardDescription className="text-gray-600">Manage your workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Settings className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No workflows configured</p>
                  <p className="text-sm">Connect your workflows to automate reel generation and posting</p>
                  <Button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}