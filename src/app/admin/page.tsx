"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { reelService, type ReelCategory, type ReelType } from "@/lib/reelService";
import { SystemSettings } from "@/components/SystemSettings";
import { UserManagement } from "@/components/UserManagement";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Loader,
  AlertCircle,
  CheckCircle,
  Settings,
  Users,
  Database,
  FileAudio
} from "lucide-react";

export default function AdminPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const [categories, setCategories] = useState<ReelCategory[]>([]);
  const [types, setTypes] = useState<ReelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ReelCategory | null>(null);
  const [editingType, setEditingType] = useState<ReelType | null>(null);

  const [fileStats, setFileStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    totalSizeMB: '0',
    files: [],
    oldestFile: null,
    newestFile: null
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    title: '',
    description: '',
    icon: '',
    is_active: true
  });

  const [typeForm, setTypeForm] = useState({
    category_id: '',
    name: '',
    title: '',
    description: '',
    icon: '',
    message: '',
    caption: '',
    min_caption_length: 50,
    max_caption_length: 300,
    include_author: false,
    external_url: '',
    status_url: '',
    posting_url: '',
    is_active: true
  });

  const getDefaultTypeForm = () => ({
    category_id: '',
    name: '',
    title: '',
    description: '',
    icon: '',
    message: '',
    caption: '',
    min_caption_length: 50,
    max_caption_length: 300,
    include_author: false,
    external_url: '',
    status_url: '',
    posting_url: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [categoriesData, typesData] = await Promise.all([
        reelService.getCategories(),
        reelService.getTypes()
      ]);
      
      setCategories(categoriesData);
      setTypes(typesData);

      // Load file stats
      try {
        const response = await fetch('/api/uploads/audio/stats', {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '123456'
          }
        });
        if (response.ok) {
          const stats = await response.json();
          setFileStats(stats);
        }
      } catch (statsErr) {
        // File stats failed to load, but don't fail the whole page
        console.warn('Failed to load file stats:', statsErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      setError(null);
      await reelService.createCategory(categoryForm);
      setSuccess('Category created successfully');
      setShowCategoryDialog(false);
      setCategoryForm({ name: '', title: '', description: '', icon: '', is_active: true });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    
    try {
      setError(null);
      await reelService.updateCategory(editingCategory.id, categoryForm);
      setSuccess('Category updated successfully');
      setShowCategoryDialog(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', title: '', description: '', icon: '', is_active: true });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      setError(null);
      await reelService.deleteCategory(id);
      setSuccess('Category deleted successfully');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const handleCreateType = async () => {
    try {
      setError(null);
      await reelService.createType(typeForm);
      setSuccess('Reel type created successfully');
      setShowTypeDialog(false);
      setTypeForm(getDefaultTypeForm());
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reel type');
    }
  };

  const handleUpdateType = async () => {
    if (!editingType) return;
    
    try {
      setError(null);
      await reelService.updateType(editingType.id, typeForm);
      setSuccess('Reel type updated successfully');
      setShowTypeDialog(false);
      setEditingType(null);
      setTypeForm(getDefaultTypeForm());
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reel type');
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reel type?')) return;
    
    try {
      setError(null);
      await reelService.deleteType(id);
      setSuccess('Reel type deleted successfully');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reel type');
    }
  };

  const openCategoryDialog = (category?: ReelCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        title: category.title,
        description: category.description || '',
        icon: category.icon || '',
        is_active: category.is_active
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', title: '', description: '', icon: '', is_active: true });
    }
    setShowCategoryDialog(true);
  };

  const openTypeDialog = (type?: ReelType) => {
    if (type) {
      setEditingType(type);
      setTypeForm({
        category_id: type.category_id,
        name: type.name,
        title: type.title,
        description: type.description || '',
        icon: type.icon || '',
        message: type.message || '',
        caption: type.caption || '',
        min_caption_length: type.min_caption_length || 50,
        max_caption_length: type.max_caption_length || 300,
        include_author: type.include_author || false,
        external_url: type.external_url || '',
        status_url: type.status_url || '',
        posting_url: type.posting_url || '',
        is_active: type.is_active
      });
    } else {
      setEditingType(null);
      setTypeForm(getDefaultTypeForm());
    }
    setShowTypeDialog(true);
  };

  // Check if user is admin
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader className="h-6 w-6 animate-spin text-teal-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You need administrator privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <span>Admin Panel</span>
                </h1>
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
                  Manage system settings, users, and reel categories for your application.
                </p>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 hover:shadow-md transition-shadow duration-200">
                  <div className="text-sm font-medium text-gray-500">Categories</div>
                  <div className="text-2xl font-bold text-teal-600">{categories.length}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 hover:shadow-md transition-shadow duration-200">
                  <div className="text-sm font-medium text-gray-500">Types</div>
                  <div className="text-2xl font-bold text-teal-600">{types.length}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 hover:shadow-md transition-shadow duration-200">
                  <div className="text-sm font-medium text-gray-500">Audio Files</div>
                  <div className="text-2xl font-bold text-orange-600">{fileStats.totalFiles}</div>
                  <div className="text-xs text-gray-500 mt-1">{fileStats.totalSizeMB} MB</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 hover:shadow-md transition-shadow duration-200">
                  <div className="text-sm font-medium text-gray-500">Storage Used</div>
                  <div className="text-2xl font-bold text-purple-600">{fileStats.totalSizeMB}</div>
                  <div className="text-xs text-gray-500 mt-1">MB total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <span className="text-green-800 font-medium">{success}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSuccess(null)}
                  className="text-green-600 hover:text-green-800 h-auto p-1 ml-auto"
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <span className="text-red-800 font-medium">{error}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800 h-auto p-1 ml-auto"
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          {/* Tabs Layout */}
          <Tabs defaultValue="settings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-gray-100 rounded-lg">
              <TabsTrigger value="settings" className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">System Settings</span>
                <span className="sm:hidden">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">User Management</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Reel Management</span>
                <span className="sm:hidden">Database</span>
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FileAudio className="h-4 w-4" />
                <span className="hidden sm:inline">File Management</span>
                <span className="sm:hidden">Files</span>
              </TabsTrigger>
            </TabsList>

            {/* System Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardHeader className="bg-gray-50 border-b border-gray-100 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-xl sm:text-2xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                          <Settings className="h-5 w-5 text-white" />
                        </div>
                        System Settings
                      </CardTitle>
                      <CardDescription className="text-base text-gray-600">
                        Configure global system behavior and polling settings
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8">
                  <SystemSettings />
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-6">
              <UserManagement />
            </TabsContent>

            {/* Reel Management Tab */}
            <TabsContent value="database" className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12 lg:py-20">
                  <div className="flex flex-col items-center gap-4 lg:gap-6 max-w-sm mx-auto text-center">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-teal-600 rounded-lg flex items-center justify-center">
                      <Loader className="h-6 w-6 lg:h-8 lg:w-8 animate-spin text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Loading Reel Data</h3>
                      <p className="text-sm lg:text-base text-gray-600">
                        Fetching reel categories and types...
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                  {/* Categories Section */}
                  <Card className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b border-gray-100 pb-6">
                      <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                          <CardTitle className="text-lg sm:text-xl flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                              <Database className="h-4 w-4 text-white" />
                            </div>
                            Categories ({categories.length})
                          </CardTitle>
                          <CardDescription className="text-sm sm:text-base">
                            Manage reel categories and their properties
                          </CardDescription>
                        </div>
                        <Button 
                          onClick={() => openCategoryDialog()}
                          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          <span className="hidden xs:inline">Add Category</span>
                          <span className="xs:hidden">Add</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-3">
                        {categories.map((category) => (
                          <div key={category.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm sm:text-base truncate">{category.title}</h4>
                                <Badge variant={category.is_active ? "default" : "secondary"} className="text-xs">
                                  {category.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{category.description}</p>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openCategoryDialog(category)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-red-600 border-red-200 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {categories.length === 0 && (
                          <div className="text-center py-8 lg:py-12">
                            <Database className="h-10 w-10 lg:h-12 lg:w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm lg:text-base text-gray-500">No categories found</p>
                            <p className="text-xs lg:text-sm text-gray-400 mt-1">Create your first category to get started</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Types Section */}
                  <Card className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b border-gray-100 pb-6">
                      <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                          <CardTitle className="text-lg sm:text-xl flex items-center gap-3">
                            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                              <Database className="h-4 w-4 text-white" />
                            </div>
                            Reel Types ({types.length})
                          </CardTitle>
                          <CardDescription className="text-sm sm:text-base">
                            Manage reel types within categories
                          </CardDescription>
                        </div>
                        <Button 
                          onClick={() => openTypeDialog()}
                          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
                          disabled={categories.length === 0}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          <span className="hidden xs:inline">Add Reel Type</span>
                          <span className="xs:hidden">Add Type</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-3">
                        {types.map((type) => {
                          const category = categories.find(c => c.id === type.category_id);
                          return (
                            <div key={type.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm sm:text-base truncate">{type.title}</h4>
                                  <Badge variant={type.is_active ? "default" : "secondary"} className="text-xs">
                                    {type.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-1">{type.description}</p>
                                <p className="text-xs text-gray-500">Category: {category?.title || 'Unknown'}</p>
                              </div>
                              <div className="flex items-center gap-2 self-end sm:self-center">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openTypeDialog(type)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteType(type.id)}
                                  className="text-red-600 border-red-200 hover:bg-red-50 h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                        {types.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">No reel types found</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* File Management Tab */}
            <TabsContent value="files" className="space-y-6">
              <Card className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardHeader className="bg-gray-50 border-b border-gray-100 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-lg sm:text-xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                          <FileAudio className="h-4 w-4 text-white" />
                        </div>
                        Audio File Management
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        Monitor uploaded audio files, manage storage, and cleanup old files
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/uploads/audio/cleanup', {
                              method: 'POST',
                              headers: {
                                'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '123456'
                              }
                            });
                            const result = await response.json();
                            if (result.success) {
                              setSuccess(`Cleaned up ${result.cleanedFiles.length} files`);
                              // Refresh stats after cleanup
                              try {
                                const statsResponse = await fetch('/api/uploads/audio/stats', {
                                  headers: {
                                    'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '123456'
                                  }
                                });
                                if (statsResponse.ok) {
                                  const stats = await statsResponse.json();
                                  setFileStats(stats);
                                }
                              } catch {
                                    // Stats refresh failed, but cleanup succeeded
                                  }
                            } else {
                              setError('Failed to cleanup files');
                            }
                          } catch {
                            setError('Failed to cleanup files');
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cleanup Old Files
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/uploads/audio/stats', {
                              headers: {
                                'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '123456'
                              }
                            });
                            if (response.ok) {
                              const stats = await response.json();
                              setFileStats(stats);
                              setSuccess('File stats updated successfully');
                            } else {
                              setError('Failed to fetch file stats');
                            }
                          } catch {
                            setError('Failed to get file stats');
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        View Stats
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FileAudio className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Duplicate Detection</span>
                        </div>
                        <p className="text-xs text-blue-700">
                          Automatically detects and reuses identical files to save storage space
                        </p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Trash2 className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-900">Auto Cleanup</span>
                        </div>
                        <p className="text-xs text-green-700">
                          Files are automatically deleted 1 hour after first access to free up space
                        </p>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-5 w-5 text-orange-600" />
                          <span className="text-sm font-medium text-orange-900">Storage Management</span>
                        </div>
                        <p className="text-xs text-orange-700">
                          Manual cleanup removes files older than 24 hours
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">File Management Features:</h4>
                      <ul className="text-xs text-gray-700 space-y-1">
                        <li>• <strong>Duplicate Prevention:</strong> Same file uploaded twice returns existing URL</li>
                        <li>• <strong>Auto Cleanup:</strong> Files deleted 1 hour after first access</li>
                        <li>• <strong>Manual Cleanup:</strong> Remove files older than 24 hours</li>
                        <li>• <strong>Storage Monitoring:</strong> Track file count, size, and age statistics</li>
                        <li>• <strong>Secure Access:</strong> Files served through API with proper authentication</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-lg p-8">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="w-6 h-6 bg-teal-600 rounded-lg flex items-center justify-center">
                <Database className="h-4 w-4 text-white" />
              </div>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription className="text-base">
              {editingCategory 
                ? 'Update the category information below.' 
                : 'Add a new reel category to the system.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-2">
            <div className="space-y-4">
              <Label htmlFor="categoryName" className="text-sm font-medium text-gray-700 block">Name (ID)</Label>
              <Input
                id="categoryName"
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                placeholder="unique-category-name"
                className="h-12 px-4 text-base"
              />
            </div>
            <div className="space-y-4">
              <Label htmlFor="categoryTitle" className="text-sm font-medium text-gray-700 block">Display Title</Label>
              <Input
                id="categoryTitle"
                type="text"
                value={categoryForm.title}
                onChange={(e) => setCategoryForm({...categoryForm, title: e.target.value})}
                placeholder="Category Display Name"
                className="h-12 px-4 text-base"
              />
            </div>
            <div className="space-y-4">
              <Label htmlFor="categoryDescription" className="text-sm font-medium text-gray-700 block">Description</Label>
              <Textarea
                id="categoryDescription"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                rows={4}
                placeholder="Category description..."
                className="resize-none px-4 py-3 text-base min-h-[100px]"
              />
            </div>
            <div className="space-y-4">
              <Label htmlFor="categoryIcon" className="text-sm font-medium text-gray-700 block">Icon</Label>
              <Input
                id="categoryIcon"
                type="text"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                placeholder="icon-name"
                className="h-12 px-4 text-base"
              />
            </div>
            <div className="flex items-center space-x-4 pt-4">
              <input
                type="checkbox"
                id="categoryActive"
                checked={categoryForm.is_active}
                onChange={(e) => setCategoryForm({...categoryForm, is_active: e.target.checked})}
                className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
              />
              <Label htmlFor="categoryActive" className="text-base font-medium text-gray-700 cursor-pointer">
                Active Category
              </Label>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-4 pt-8 border-t border-gray-200 mt-8">
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)} className="h-12 px-6 text-base">
              Cancel
            </Button>
            <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory} className="bg-teal-600 hover:bg-teal-700 h-12 px-6 text-base">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Type Dialog */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto p-8">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              {editingType ? 'Edit Reel Type' : 'Create Reel Type'}
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              {editingType 
                ? 'Update the reel type information below.' 
                : 'Add a new reel type to a category.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
              {/* Basic Information */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                    <div className="w-6 h-6 bg-teal-100 rounded-md flex items-center justify-center">
                      <Database className="h-4 w-4 text-teal-600" />
                    </div>
                    Basic Information
                  </h3>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label htmlFor="typeCategory" className="text-sm font-medium text-gray-700 block">Category</Label>
                      <select
                        id="typeCategory"
                        value={typeForm.category_id}
                        onChange={(e) => setTypeForm({...typeForm, category_id: e.target.value})}
                        className="flex h-12 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-base ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select a category</option>
                        {categories.filter(c => c.is_active).map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="typeName" className="text-sm font-medium text-gray-700 block">Name (ID)</Label>
                      <Input
                        id="typeName"
                        type="text"
                        value={typeForm.name}
                        onChange={(e) => setTypeForm({...typeForm, name: e.target.value})}
                        placeholder="unique-type-name"
                        className="h-12 px-4 text-base"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="typeTitle" className="text-sm font-medium text-gray-700 block">Display Title</Label>
                      <Input
                        id="typeTitle"
                        type="text"
                        value={typeForm.title}
                        onChange={(e) => setTypeForm({...typeForm, title: e.target.value})}
                        placeholder="Type Display Name"
                        className="h-12 px-4 text-base"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="typeDescription" className="text-sm font-medium text-gray-700 block">Description</Label>
                      <Textarea
                        id="typeDescription"
                        value={typeForm.description}
                        onChange={(e) => setTypeForm({...typeForm, description: e.target.value})}
                        rows={4}
                        placeholder="Type description..."
                        className="resize-none px-4 py-3 text-base min-h-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="typeIcon" className="text-sm font-medium text-gray-700 block">Icon</Label>
                      <Input
                        id="typeIcon"
                        type="text"
                        value={typeForm.icon}
                        onChange={(e) => setTypeForm({...typeForm, icon: e.target.value})}
                        placeholder="icon-name"
                        className="h-12 px-4 text-base"
                      />
                    </div>
                </div>
              </div>
                        </div>
              {/* Content & URLs */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                      <Settings className="h-4 w-4 text-blue-600" />
                    </div>
                    Content & URLs
                  </h3>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label htmlFor="typeMessage" className="text-sm font-medium text-gray-700 block">Message Template</Label>
                      <Textarea
                        id="typeMessage"
                        value={typeForm.message}
                        onChange={(e) => setTypeForm({...typeForm, message: e.target.value})}
                        rows={4}
                        placeholder="Default message template..."
                        className="resize-none px-4 py-3 text-base min-h-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="typeCaption" className="text-sm font-medium text-gray-700 block">Caption Template</Label>
                      <Textarea
                        id="typeCaption"
                        value={typeForm.caption}
                        onChange={(e) => setTypeForm({...typeForm, caption: e.target.value})}
                        rows={4}
                        placeholder="Default caption template..."
                        className="resize-none px-4 py-3 text-base min-h-[100px]"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <Label htmlFor="minCaptionLength" className="text-sm font-medium text-gray-700 block">Min Caption Length</Label>
                        <Input
                          id="minCaptionLength"
                          type="number"
                          value={typeForm.min_caption_length}
                          onChange={(e) => setTypeForm({...typeForm, min_caption_length: parseInt(e.target.value) || 0})}
                          min="0"
                          className="h-12 px-4 text-base"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label htmlFor="maxCaptionLength" className="text-sm font-medium text-gray-700 block">Max Caption Length</Label>
                        <Input
                          id="maxCaptionLength"
                          type="number"
                          value={typeForm.max_caption_length}
                          onChange={(e) => setTypeForm({...typeForm, max_caption_length: parseInt(e.target.value) || 0})}
                          min="0"
                          className="h-12 px-4 text-base"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="externalUrl" className="text-sm font-medium text-gray-700 block">External URL</Label>
                      <Input
                        id="externalUrl"
                        type="url"
                        value={typeForm.external_url}
                        onChange={(e) => setTypeForm({...typeForm, external_url: e.target.value})}
                        placeholder="https://example.com/api/endpoint"
                        className="h-12 px-4 text-base"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="statusUrl" className="text-sm font-medium text-gray-700 block">Status URL</Label>
                      <Input
                        id="statusUrl"
                        type="url"
                        value={typeForm.status_url}
                        onChange={(e) => setTypeForm({...typeForm, status_url: e.target.value})}
                        placeholder="https://example.com/status/endpoint"
                        className="h-12 px-4 text-base"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <Label htmlFor="postingUrl" className="text-sm font-medium text-gray-700 block">Posting URL</Label>
                      <Input
                        id="postingUrl"
                        type="url"
                        value={typeForm.posting_url}
                        onChange={(e) => setTypeForm({...typeForm, posting_url: e.target.value})}
                        placeholder="https://example.com/post/endpoint"
                        className="h-12 px-4 text-base"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Settings */}
            <div className="space-y-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                  <Settings className="h-4 w-4 text-green-600" />
                </div>
                Settings
              </h3>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="includeAuthor"
                    checked={typeForm.include_author}
                    onChange={(e) => setTypeForm({...typeForm, include_author: e.target.checked})}
                    className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <Label htmlFor="includeAuthor" className="text-base font-medium text-gray-700">
                    Include Author
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="typeActive"
                    checked={typeForm.is_active}
                    onChange={(e) => setTypeForm({...typeForm, is_active: e.target.checked})}
                    className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <Label htmlFor="typeActive" className="text-base font-medium text-gray-700">
                    Active Reel Type
                  </Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-4 pt-8 border-t border-gray-200 mt-8">
            <Button variant="outline" onClick={() => setShowTypeDialog(false)} className="h-12 px-6 text-base">
              Cancel
            </Button>
            <Button onClick={editingType ? handleUpdateType : handleCreateType} className="bg-teal-600 hover:bg-teal-700 h-12 px-6 text-base">
              {editingType ? 'Update Reel Type' : 'Create Reel Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}