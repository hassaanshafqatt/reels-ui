import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CheckCircle,
  AlertCircle,
  Loader,
  Clock,
  RefreshCw,
  ExternalLink,
  Instagram,
  Sparkles
} from "lucide-react";
import { type StoredJob } from "@/lib/jobService";

interface JobStatusCardProps {
  job: StoredJob;
  isRefreshing: boolean;
  onRefresh: (job: StoredJob) => void;
}

export default function JobStatusCard({ job, isRefreshing, onRefresh }: JobStatusCardProps) {
  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'processing':
        return <Loader className="h-3 w-3 mr-1 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 mr-1" />;
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  const getStatusVariant = () => {
    switch (job.status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const renderContent = () => {
    if (job.status === 'completed' && job.result_url) {
      return (
        <div className="space-y-2">
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <p className="text-xs text-gray-600">Reel Ready</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs"
              onClick={() => window.open(job.result_url, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Reel
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-xs"
            >
              <Instagram className="h-3 w-3 mr-1" />
              Post Now
            </Button>
          </div>
        </div>
      );
    }

    if (job.status === 'processing') {
      return (
        <div className="space-y-2">
          <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Loader className="h-6 w-6 text-teal-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-600">Generating...</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full text-sm h-10 border-teal-300 text-teal-600 hover:bg-teal-100 hover:border-teal-400 transition-all duration-200 active:scale-[0.98] font-medium"
            onClick={() => onRefresh(job)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
          </Button>
        </div>
      );
    }

    if (job.status === 'failed') {
      return (
        <div className="space-y-2">
          <div className="aspect-video bg-red-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-xs text-red-600">Generation Failed</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full text-sm h-10 border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 transition-all duration-200 active:scale-[0.98] font-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Generation
          </Button>
        </div>
      );
    }

    // Pending status
    return (
      <div className="space-y-2">
        <div className="aspect-video bg-yellow-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-xs text-yellow-600">Pending</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant={getStatusVariant()} className="text-xs">
            {getStatusIcon()}
            {job.status}
          </Badge>
          <span className="text-xs text-gray-500">
            {new Date(job.created_at).toLocaleDateString()}
          </span>
        </div>
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
          {job.category} - {job.type}
        </h3>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-gray-600">
          <p><strong>Type:</strong> {job.type}</p>
          <p><strong>Category:</strong> {job.category}</p>
          <p><strong>ID:</strong> {job.job_id.slice(0, 8)}...</p>
        </div>
        
        {renderContent()}
      </CardContent>
    </Card>
  );
}
