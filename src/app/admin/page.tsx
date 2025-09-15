"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { reelService, type ReelCategory, type ReelType } from "@/lib/reelService";
import { SystemSettings } from "@/components/SystemSettings";
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
  Settings
} from "lucide-react";

export default function ReelManagement() {
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
    min_caption_length: 10,
    max_caption_length: 100,
    include_author: true,
    external_url: '',
    status_url: '',
    posting_url: '',
    is_active: true
  });

  useEffect(() => {
    console.log('Admin useEffect triggered, user:', !!user, 'authLoading:', authLoading);
    if (user) {
      console.log('Loading data for user:', user.email);
      loadData();
    }
  }, [user]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      await reelService.createCategory(categoryForm);
      setSuccess('Category created successfully');
      setShowCategoryDialog(false);
      resetCategoryForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    try {
      await reelService.updateCategory(editingCategory.id, categoryForm);
      setSuccess('Category updated successfully');
      setShowCategoryDialog(false);
      setEditingCategory(null);
      resetCategoryForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await reelService.deleteCategory(id);
      setSuccess('Category deleted successfully');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const handleCreateType = async () => {
    try {
      await reelService.createType(typeForm);
      setSuccess('Reel type created successfully');
      setShowTypeDialog(false);
      resetTypeForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reel type');
    }
  };

  const handleUpdateType = async () => {
    if (!editingType) return;
    try {
      await reelService.updateType(editingType.id, typeForm);
      setSuccess('Reel type updated successfully');
      setShowTypeDialog(false);
      setEditingType(null);
      resetTypeForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reel type');
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reel type?')) return;
    try {
      await reelService.deleteType(id);
      setSuccess('Reel type deleted successfully');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reel type');
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      title: '',
      description: '',
      icon: '',
      is_active: true
    });
  };

  const resetTypeForm = () => {
    setTypeForm({
      category_id: '',
      name: '',
      title: '',
      description: '',
      icon: '',
      message: '',
      caption: '',
      min_caption_length: 10,
      max_caption_length: 100,
      include_author: true,
      external_url: '',
      status_url: '',
      posting_url: '',
      is_active: true
    });
  };

  const openEditCategory = (category: ReelCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      title: category.title,
      description: category.description || '',
      icon: category.icon || '',
      is_active: category.is_active
    });
    setShowCategoryDialog(true);
  };

  const openEditType = (type: ReelType) => {
    setEditingType(type);
    setTypeForm({
      category_id: type.category_id,
      name: type.name,
      title: type.title,
      description: type.description || '',
      icon: type.icon || '',
      message: type.message || '',
      caption: type.caption || '',
      min_caption_length: type.min_caption_length || 10,
      max_caption_length: type.max_caption_length || 100,
      include_author: type.include_author !== undefined ? type.include_author : true,
      external_url: type.external_url || '',
      status_url: type.status_url || '',
      posting_url: type.posting_url || '',
      is_active: type.is_active
    });
    setShowTypeDialog(true);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You need to be logged in to access the reel management interface.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Section - Enhanced */}
          <div className="mb-8 sm:mb-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <span>Admin Panel</span>
                </h1>
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
                  Manage system settings, reel categories, and types for your application.
                </p>
              </div>
              
              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-2 gap-4 lg:gap-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 hover:shadow-md transition-shadow duration-200">
                  <div className="text-sm font-medium text-gray-500">Categories</div>
                  <div className="text-2xl font-bold text-teal-600">{categories.length}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 hover:shadow-md transition-shadow duration-200">
                  <div className="text-sm font-medium text-gray-500">Types</div>
                  <div className="text-2xl font-bold text-teal-600">{types.length}</div>
                </div>
              </div>
            </div>
          </div>

        {/* Success/Error Messages - Enhanced */}
        {success && (
          <div className="mb-6 sm:mb-8 bg-green-50 border border-green-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <span className="text-green-800 font-medium text-sm sm:text-base">{success}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSuccess(null)}
                className="text-green-600 hover:text-green-800 h-auto p-1 -mt-1"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 sm:mb-8 bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-red-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <span className="text-red-800 font-medium text-sm sm:text-base">{error}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 h-auto p-1 -mt-1"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 lg:py-32">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 bg-teal-600 rounded-lg flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-white" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">Loading Admin Panel</h3>
                <p className="text-gray-600 max-w-md">
                  Fetching reel categories, types, and system settings...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 lg:space-y-12">
            {/* System Settings Section - Enhanced */}
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

            {/* Management Cards Grid */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Categories Section - Enhanced */}
              <Card className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardHeader className="bg-gray-50 border-b border-gray-100 pb-6">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-xl sm:text-2xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                          <Settings className="h-5 w-5 text-white" />
                        </div>
                        Categories ({categories.length})
                      </CardTitle>
                      <CardDescription className="text-base text-gray-600">
                        Manage reel categories and their properties
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => {
                        resetCategoryForm();
                        setEditingCategory(null);
                        setShowCategoryDialog(true);
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow-md transition-all duration-200 w-full rounded-lg"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Category
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8">
                <div className="space-y-4">
                  {categories.length === 0 ? (
                    <div className="text-center py-12 lg:py-16">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Settings className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories yet</h3>
                      <p className="text-gray-500 text-base max-w-sm mx-auto">
                        Create your first category to start organizing your reel types
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:gap-6">
                      {categories.map((category) => (
                        <div key={category.id} className="group border border-gray-200 rounded-xl p-4 sm:p-6 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:shadow-md">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="font-semibold text-lg text-gray-900">{category.title}</h3>
                                <Badge 
                                  variant={category.is_active ? "default" : "secondary"} 
                                  className={`text-sm px-3 py-1 ${
                                    category.is_active 
                                      ? "bg-green-100 text-green-800 border-green-200" 
                                      : "bg-gray-100 text-gray-600 border-gray-200"
                                  }`}
                                >
                                  {category.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Name:</span> {category.name}
                                </p>
                                {category.description && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Description:</span> {category.description}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                                  {types.filter(t => t.category_id === category.id).length} Types
                                </span>
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  Icon: {category.icon || 'None'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 lg:flex-col lg:gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditCategory(category)}
                                className="flex-1 lg:flex-none hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
                                className="flex-1 lg:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

              {/* Types Section - Enhanced */}
              <Card className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardHeader className="bg-gray-50 border-b border-gray-100 pb-6">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-xl sm:text-2xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                          <Settings className="h-5 w-5 text-white" />
                        </div>
                        Reel Types ({types.length})
                      </CardTitle>
                      <CardDescription className="text-base text-gray-600">
                        Manage reel types and their configurations
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => {
                        resetTypeForm();
                        setEditingType(null);
                        setShowTypeDialog(true);
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow-md transition-all duration-200 w-full rounded-lg"
                      size="lg"
                      disabled={categories.length === 0}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Type
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 lg:p-8">
                <div className="space-y-3 sm:space-y-4">
                  {types.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Settings className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm sm:text-base">No reel types yet</p>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {categories.length === 0 ? 'Create a category first' : 'Create your first reel type'}
                      </p>
                    </div>
                  ) : (
                    types.map((type) => {
                      const category = categories.find(c => c.id === type.category_id);
                      return (
                        <div key={type.id} className="border rounded-lg p-3 sm:p-4 bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col gap-3">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <h3 className="font-medium text-sm sm:text-base break-words">{type.title}</h3>
                                  <Badge variant={type.is_active ? "default" : "secondary"} className="text-xs">
                                    {type.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                  {category && (
                                    <Badge variant="outline" className="text-xs">{category.title}</Badge>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1 break-words">Name: {type.name}</p>
                                {type.description && (
                                  <p className="text-xs sm:text-sm text-gray-500 mb-2 break-words">{type.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openEditType(type)}
                                  className="flex-1 sm:flex-none"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteType(type.id)}
                                  className="text-red-600 hover:text-red-800 flex-1 sm:flex-none"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">Delete</span>
                                </Button>
                              </div>
                            </div>
                            
                            {/* URLs Section - Mobile Collapsible */}
                            <div className="border-t pt-3">
                              <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                                {type.external_url && (
                                  <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-0 flex-shrink-0">External:</span>
                                    <span className="break-all font-mono bg-gray-50 px-1 rounded text-xs">{type.external_url}</span>
                                  </div>
                                )}
                                {type.status_url && (
                                  <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-0 flex-shrink-0">Status:</span>
                                    <span className="break-all font-mono bg-gray-50 px-1 rounded text-xs">{type.status_url}</span>
                                  </div>
                                )}
                                {type.posting_url && (
                                  <div className="flex items-start gap-2">
                                    <span className="font-medium min-w-0 flex-shrink-0">Posting:</span>
                                    <span className="break-all font-mono bg-gray-50 px-1 rounded text-xs">{type.posting_url}</span>
                                  </div>
                                )}
                                {type.icon && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Icon:</span>
                                    <span className="font-mono bg-gray-50 px-1 rounded">{type.icon}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Category Dialog - Enhanced */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex flex-col max-h-[85vh]">
            <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-100">
              <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="truncate">{editingCategory ? 'Edit Category' : 'Create Category'}</span>
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-gray-600 mt-2">
                {editingCategory ? 'Update the category details below.' : 'Create a new reel category for organizing content.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Name*</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                    placeholder="e.g., viral, anime, asmr"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Title*</label>
                  <input
                    type="text"
                    value={categoryForm.title}
                    onChange={(e) => setCategoryForm({...categoryForm, title: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                    placeholder="e.g., Viral Reels, Anime Style Reels"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white resize-none"
                    rows={3}
                    placeholder="Brief description of this category"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Icon</label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                    placeholder="e.g., Zap, Palette, Music"
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Lucide icon name for display</p>
                </div>
                
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="categoryActive"
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm({...categoryForm, is_active: e.target.checked})}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 bg-white border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                  />
                  <label htmlFor="categoryActive" className="text-sm sm:text-base font-medium text-gray-800">
                    Active Category
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3 px-4 sm:px-6 py-4 sm:py-6 border-t border-gray-100">
              <Button 
                variant="outline" 
                onClick={() => setShowCategoryDialog(false)} 
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base border-gray-300 hover:bg-gray-50 rounded-lg order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 order-1 sm:order-2"
                disabled={!categoryForm.name || !categoryForm.title}
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Type Dialog - Enhanced */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden max-w-2xl">
          <div className="flex flex-col max-h-[85vh]">
            <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-100">
              <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="truncate">{editingType ? 'Edit Reel Type' : 'Create Reel Type'}</span>
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-gray-600 mt-2">
                {editingType ? 'Update the reel type details below.' : 'Create a new reel type with specific configurations.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Category*</label>
                  <select
                    value={typeForm.category_id}
                    onChange={(e) => setTypeForm({...typeForm, category_id: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.title}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Name*</label>
                  <input
                    type="text"
                    value={typeForm.name}
                    onChange={(e) => setTypeForm({...typeForm, name: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                    placeholder="e.g., gym-motivation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Title*</label>
                  <input
                    type="text"
                    value={typeForm.title}
                    onChange={(e) => setTypeForm({...typeForm, title: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                    placeholder="e.g., Gym Motivation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
                  <textarea
                    value={typeForm.description}
                    onChange={(e) => setTypeForm({...typeForm, description: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white resize-none"
                    rows={3}
                    placeholder="Brief description of this reel type"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Icon</label>
                  <input
                    type="text"
                    value={typeForm.icon}
                    onChange={(e) => setTypeForm({...typeForm, icon: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                    placeholder="e.g., Dumbbell"
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Lucide icon name for display</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Message</label>
                  <input
                    type="text"
                    value={typeForm.message}
                    onChange={(e) => setTypeForm({...typeForm, message: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                    placeholder="Generation message for AI"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Caption</label>
                  <input
                    type="text"
                    value={typeForm.caption}
                    onChange={(e) => setTypeForm({...typeForm, caption: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                    placeholder="Default caption template"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Min Caption Length</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={typeForm.min_caption_length}
                      onChange={(e) => setTypeForm({...typeForm, min_caption_length: parseInt(e.target.value) || 10})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                      placeholder="10"
                    />
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Minimum characters for captions</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Max Caption Length</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={typeForm.max_caption_length}
                      onChange={(e) => setTypeForm({...typeForm, max_caption_length: parseInt(e.target.value) || 100})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                      placeholder="100"
                    />
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Maximum characters for captions</p>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="includeAuthor"
                      checked={typeForm.include_author}
                      onChange={(e) => setTypeForm({...typeForm, include_author: e.target.checked})}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 bg-white border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                    />
                    <div>
                      <label htmlFor="includeAuthor" className="text-sm sm:text-base font-medium text-gray-800">
                        Include Author
                      </label>
                      <p className="text-xs text-gray-500">Add author info to reels</p>
                    </div>
                  </div>
                </div>
                
                {typeForm.min_caption_length >= typeForm.max_caption_length && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Warning: Minimum caption length should be less than maximum caption length.
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">External URL</label>
                  <input
                    type="text"
                    value={typeForm.external_url}
                    onChange={(e) => setTypeForm({...typeForm, external_url: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                    placeholder="https://n8n.nutrador.com/webhook-test/..."
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Webhook URL for reel generation</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Status URL</label>
                  <input
                    type="text"
                    value={typeForm.status_url}
                    onChange={(e) => setTypeForm({...typeForm, status_url: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                    placeholder="/api/reels/status"
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">URL to check job status</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Posting URL</label>
                  <input
                    type="text"
                    value={typeForm.posting_url}
                    onChange={(e) => setTypeForm({...typeForm, posting_url: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base transition-all duration-200 bg-white"
                    placeholder="/api/reels/post"
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">URL for posting the reel</p>
                </div>
                
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="typeActive"
                    checked={typeForm.is_active}
                    onChange={(e) => setTypeForm({...typeForm, is_active: e.target.checked})}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 bg-white border-gray-300 rounded focus:ring-teal-500 focus:ring-2"
                  />
                  <label htmlFor="typeActive" className="text-sm sm:text-base font-medium text-gray-800">
                    Active Reel Type
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3 px-4 sm:px-6 py-4 sm:py-6 border-t border-gray-100">
              <Button 
                variant="outline" 
                onClick={() => setShowTypeDialog(false)} 
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base border-gray-300 hover:bg-gray-50 rounded-lg order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={editingType ? handleUpdateType : handleCreateType}
                className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 order-1 sm:order-2"
                disabled={!typeForm.category_id || !typeForm.name || !typeForm.title}
              >
                {editingType ? 'Update Type' : 'Create Type'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
