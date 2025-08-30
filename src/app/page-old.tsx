"use client";

import React, { useState } from 'react';
import { Play, Settings, Activity, Workflow, ChevronDown, User, Plus, Edit3, Sparkles, Clock, Check } from 'lucide-react';

const ReelGenerationApp = () => {
  const [activeTab, setActiveTab] = useState('creation');
  const [selectedAccount, setSelectedAccount] = useState('main_account');
  const [selectedReelType, setSelectedReelType] = useState<string | null>(null);
  const [selectedSubType, setSelectedSubType] = useState<string | null>(null);
  const [customCaption, setCustomCaption] = useState('');
  const [generateCaption, setGenerateCaption] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const accounts = [
    { id: 'main_account', name: '@fitness_motivation', followers: '125K' },
    { id: 'secondary', name: '@warrior_wisdom', followers: '89K' },
    { id: 'anime_page', name: '@anime_theories', followers: '67K' }
  ];

  const reelTypes = {
    'viral': {
      title: 'Viral Reels',
      icon: '🔥',
      subtypes: ['Gym Motivation', 'War Motivation/Wisdom', 'Medieval War Motivation', '1920s Gangsters']
    },
    'proverbs': {
      title: 'Proverbs Viral Reels',
      icon: '💭',
      subtypes: ['Wisdom', 'Motivation', 'Brotherhood', 'Bravery']
    },
    'anime': {
      title: 'Anime Style Reels',
      icon: '🎨',
      subtypes: ['Theory', 'Painting']
    },
    'asmr': {
      title: 'ASMR Reels',
      icon: '🎧',
      subtypes: ['Food', 'Animal']
    }
  };

  const recentActivity = [
    { id: 1, type: 'Gym Motivation', status: 'completed', time: '2 hours ago', views: '45K' },
    { id: 2, type: 'War Wisdom', status: 'processing', time: '4 hours ago', views: '-' },
    { id: 3, type: 'Anime Theory', status: 'completed', time: '1 day ago', views: '23K' },
    { id: 4, type: 'ASMR Food', status: 'completed', time: '2 days ago', views: '67K' }
  ];

  const workflows = [
    { id: 1, name: 'Viral Reel Generator', status: 'active', lastRun: '30 min ago' },
    { id: 2, name: 'Caption Generator', status: 'active', lastRun: '1 hour ago' },
    { id: 3, name: 'Auto Poster', status: 'paused', lastRun: '3 hours ago' }
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate API call to n8n workflow
    setTimeout(() => {
      setIsGenerating(false);
      // Reset form
      setSelectedReelType(null);
      setSelectedSubType(null);
      setCustomCaption('');
      setGenerateCaption(true);
    }, 3000);
  };

  const AccountSwitcher = () => (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Switcher</h2>
        <div className="space-y-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              onClick={() => setSelectedAccount(account.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedAccount === account.id
                  ? 'bg-teal-50 border-2 border-teal-200'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">{account.name}</div>
                  <div className="text-sm text-gray-500">{account.followers} followers</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t pt-4">
        <button className="w-full flex items-center space-x-2 p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
          <Plus size={16} />
          <span className="text-sm font-medium">Add Account</span>
        </button>
      </div>
    </div>
  );

  const CreationTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Reel Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(reelTypes).map(([key, type]) => (
            <div
              key={key}
              onClick={() => {
                setSelectedReelType(key);
                setSelectedSubType(null);
              }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedReelType === key
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="font-medium text-gray-800">{type.title}</div>
              <div className="text-sm text-gray-500 mt-1">
                {type.subtypes.length} options
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedReelType && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Style</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {reelTypes[selectedReelType as keyof typeof reelTypes].subtypes.map((subtype: string) => (
              <button
                key={subtype}
                onClick={() => setSelectedSubType(subtype)}
                className={`p-3 rounded-lg text-left transition-all ${
                  selectedSubType === subtype
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {subtype}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedSubType && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Caption Settings</h3>
          
          <div className="space-y-4">
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

            <div className="pt-4 border-t">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
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
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const ActivityTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  item.status === 'completed' ? 'bg-green-500' : 
                  item.status === 'processing' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
                <div>
                  <div className="font-medium text-gray-800">{item.type}</div>
                  <div className="text-sm text-gray-500">{item.time}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-800">{item.views} views</div>
                <div className={`text-sm ${
                  item.status === 'completed' ? 'text-green-600' : 
                  item.status === 'processing' ? 'text-yellow-600' : 'text-gray-500'
                }`}>
                  {item.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const WorkflowsTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">n8n Workflows</h3>
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  workflow.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div>
                  <div className="font-medium text-gray-800">{workflow.name}</div>
                  <div className="text-sm text-gray-500">Last run: {workflow.lastRun}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  workflow.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {workflow.status}
                </span>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <Settings size={16} className="text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AccountSwitcher />
      
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Reel Generator</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Connected: <span className="font-medium text-teal-600">{accounts.find(a => a.id === selectedAccount)?.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 px-6">
          <div className="flex space-x-8">
            {[
              { id: 'creation', label: 'Creation', icon: Plus },
              { id: 'activity', label: 'Activity', icon: Activity },
              { id: 'workflows', label: 'Workflows', icon: Workflow }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 px-3 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="p-6">
          {activeTab === 'creation' && <CreationTab />}
          {activeTab === 'activity' && <ActivityTab />}
          {activeTab === 'workflows' && <WorkflowsTab />}
        </main>
      </div>
    </div>
  );
};

export default ReelGenerationApp;
