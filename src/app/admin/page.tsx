"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { reelService, type ReelCategory, type ReelType } from "@/lib/reelService";
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
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section - Mobile Optimized */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
                  <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-teal-600 flex-shrink-0" />
                  <span className="break-words">Reel Management</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Manage reel categories and types for your application.</p>
              </div>
              
              {/* Mobile Stats */}
              <div className="flex gap-2 sm:gap-4">
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                  <div className="text-xs text-gray-500">Categories</div>
                  <div className="text-lg font-semibold text-teal-600">{categories.length}</div>
                </div>
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                  <div className="text-xs text-gray-500">Types</div>
                  <div className="text-lg font-semibold text-teal-600">{types.length}</div>
                </div>
              </div>
            </div>
          </div>

        {/* Success/Error Messages - Mobile Optimized */}
        {success && (
          <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-green-800 text-sm sm:text-base flex-1 break-words">{success}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSuccess(null)}
                className="text-green-600 hover:text-green-800 p-1 h-auto"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-red-800 text-sm sm:text-base flex-1 break-words">{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 p-1 h-auto"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Loader className="h-6 w-6 animate-spin text-teal-600" />
              <span className="text-gray-600 text-sm sm:text-base">Loading reel data...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Categories Section - Mobile Optimized */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg sm:text-xl">Categories ({categories.length})</CardTitle>
                    <CardDescription className="text-sm">Manage reel categories</CardDescription>
                  </div>
                  <Button 
                    onClick={() => {
                      resetCategoryForm();
                      setEditingCategory(null);
                      setShowCategoryDialog(true);
                    }}
                    className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {categories.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Settings className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm sm:text-base">No categories yet</p>
                      <p className="text-gray-400 text-xs sm:text-sm">Create your first category to get started</p>
                    </div>
                  ) : (
                    categories.map((category) => (
                      <div key={category.id} className="border rounded-lg p-3 sm:p-4 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-medium text-sm sm:text-base break-words">{category.title}</h3>
                              <Badge variant={category.is_active ? "default" : "secondary"} className="text-xs">
                                {category.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-1 break-words">Name: {category.name}</p>
                            {category.description && (
                              <p className="text-xs sm:text-sm text-gray-500 mb-2 break-words">{category.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                              <span>Types: {types.filter(t => t.category_id === category.id).length}</span>
                              <span>Icon: {category.icon || 'None'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditCategory(category)}
                              className="flex-1 sm:flex-none"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-800 flex-1 sm:flex-none"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Types Section - Mobile Optimized */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg sm:text-xl">Reel Types ({types.length})</CardTitle>
                    <CardDescription className="text-sm">Manage reel types and their configurations</CardDescription>
                  </div>
                  <Button 
                    onClick={() => {
                      resetTypeForm();
                      setEditingType(null);
                      setShowTypeDialog(true);
                    }}
                    className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
                    size="sm"
                    disabled={categories.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Type
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
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
        )}
      </div>
    </div>

      {/* Category Dialog - Mobile Optimized */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingCategory ? 'Update the category details.' : 'Create a new reel category.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                placeholder="e.g., viral, anime, asmr"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
              <input
                type="text"
                value={categoryForm.title}
                onChange={(e) => setCategoryForm({...categoryForm, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                placeholder="e.g., Viral Reels, Anime Style Reels"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                rows={3}
                placeholder="Brief description of this category"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
              <input
                type="text"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                placeholder="e.g., Zap, Palette, Music"
              />
              <p className="text-xs text-gray-500 mt-1">Lucide icon name</p>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="categoryActive"
                checked={categoryForm.is_active}
                onChange={(e) => setCategoryForm({...categoryForm, is_active: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="categoryActive" className="text-sm text-gray-700">Active</label>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
              className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
              disabled={!categoryForm.name || !categoryForm.title}
            >
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Type Dialog - Mobile Optimized */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingType ? 'Edit Reel Type' : 'Create Reel Type'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingType ? 'Update the reel type details.' : 'Create a new reel type.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
              <select
                value={typeForm.category_id}
                onChange={(e) => setTypeForm({...typeForm, category_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                <input
                  type="text"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({...typeForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="e.g., gym-motivation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                <input
                  type="text"
                  value={typeForm.title}
                  onChange={(e) => setTypeForm({...typeForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="e.g., Gym Motivation"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={typeForm.description}
                onChange={(e) => setTypeForm({...typeForm, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                rows={2}
                placeholder="Brief description"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input
                  type="text"
                  value={typeForm.icon}
                  onChange={(e) => setTypeForm({...typeForm, icon: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="e.g., Dumbbell"
                />
                <p className="text-xs text-gray-500 mt-1">Lucide icon name</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <input
                  type="text"
                  value={typeForm.message}
                  onChange={(e) => setTypeForm({...typeForm, message: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="Generation message"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
              <input
                type="text"
                value={typeForm.caption}
                onChange={(e) => setTypeForm({...typeForm, caption: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                placeholder="Default caption"
              />
            </div>
            
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">URL Configuration</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">External URL</label>
                    <input
                      type="text"
                      value={typeForm.external_url}
                      onChange={(e) => setTypeForm({...typeForm, external_url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                      placeholder="https://n8n.nutrador.com/webhook-test/..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Webhook URL for reel generation</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status URL</label>
                    <input
                      type="text"
                      value={typeForm.status_url}
                      onChange={(e) => setTypeForm({...typeForm, status_url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                      placeholder="/api/reels/status"
                    />
                    <p className="text-xs text-gray-500 mt-1">URL to check job status</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posting URL</label>
                    <input
                      type="text"
                      value={typeForm.posting_url}
                      onChange={(e) => setTypeForm({...typeForm, posting_url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                      placeholder="/api/reels/post"
                    />
                    <p className="text-xs text-gray-500 mt-1">URL for posting the reel</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="typeActive"
                checked={typeForm.is_active}
                onChange={(e) => setTypeForm({...typeForm, is_active: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="typeActive" className="text-sm text-gray-700">Active</label>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowTypeDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={editingType ? handleUpdateType : handleCreateType}
              className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
              disabled={!typeForm.category_id || !typeForm.name || !typeForm.title}
            >
              {editingType ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
