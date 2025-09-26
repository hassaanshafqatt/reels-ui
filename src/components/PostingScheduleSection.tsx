import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  RefreshCw,
  Instagram,
  Plus,
  Settings,
  ExternalLink,
} from 'lucide-react';

export default function PostingScheduleSection() {
  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              Posting Schedule
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-600 mt-1">
              Manage your Instagram posting schedule and automation
            </CardDescription>
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <Badge
              variant="outline"
              className="text-teal-600 border-teal-200 bg-teal-50"
            >
              Auto-Post Ready
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Posting Schedule Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Daily Schedule */}
          <Card className="border border-gray-200 hover:border-teal-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                <Clock className="h-5 w-5 text-teal-600 mr-2" />
                Daily Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Next Post:</strong> Today at 3:00 PM
                </p>
                <p>
                  <strong>Frequency:</strong> 2 posts per day
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className="text-green-600 font-medium">Active</span>
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Edit Schedule
              </Button>
            </CardContent>
          </Card>

          {/* Content Queue */}
          <Card className="border border-gray-200 hover:border-teal-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                <RefreshCw className="h-5 w-5 text-teal-600 mr-2" />
                Content Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Queued:</strong> 12 reels ready
                </p>
                <p>
                  <strong>In Progress:</strong> 3 generating
                </p>
                <p>
                  <strong>Failed:</strong> 0 posts
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View Queue
              </Button>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="border border-gray-200 hover:border-teal-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                <Instagram className="h-5 w-5 text-teal-600 mr-2" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                <p>
                  <strong>This Week:</strong> 14 posts
                </p>
                <p>
                  <strong>Avg. Reach:</strong> 25.3K
                </p>
                <p>
                  <strong>Engagement:</strong>{' '}
                  <span className="text-green-600 font-medium">+8.2%</span>
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Post
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Posting Settings
            </Button>
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect Instagram
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
