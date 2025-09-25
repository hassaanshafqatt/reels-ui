// Service for managing reel categories and types
import Cookies from 'js-cookie';

export interface ReelCategory {
  id: string;
  name: string;
  title: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReelType {
  id: string;
  category_id: string;
  name: string;
  title: string;
  description?: string;
  icon?: string;
  message?: string;
  caption?: string;
  min_caption_length?: number;
  max_caption_length?: number;
  include_author?: boolean;
  allow_custom_audio?: boolean;
  external_url?: string;
  status_url?: string;
  posting_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // From joined query
  category_name?: string;
  category_title?: string;
}

class ReelService {
  private getAuthHeaders() {
    const token = Cookies.get('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // Category operations
  async getCategories(activeOnly = false): Promise<ReelCategory[]> {
    const params = new URLSearchParams();
    if (activeOnly) params.set('active', 'true');
    
    const response = await fetch(`/api/reels/categories?${params}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    const data = await response.json();
    return data.categories;
  }

  async getCategory(id: string): Promise<ReelCategory> {
    const response = await fetch(`/api/reels/categories/${id}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch category');
    }
    
    const data = await response.json();
    return data.category;
  }

  async createCategory(categoryData: Omit<ReelCategory, 'id' | 'created_at' | 'updated_at'>): Promise<ReelCategory> {
    const response = await fetch('/api/reels/categories', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(categoryData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create category');
    }
    
    const data = await response.json();
    return data.category;
  }

  async updateCategory(id: string, updates: Partial<Omit<ReelCategory, 'id' | 'created_at' | 'updated_at'>>): Promise<ReelCategory> {
    const response = await fetch(`/api/reels/categories/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update category');
    }
    
    const data = await response.json();
    return data.category;
  }

  async deleteCategory(id: string): Promise<void> {
    const response = await fetch(`/api/reels/categories/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete category');
    }
  }

  // Type operations
  async getTypes(categoryId?: string, activeOnly = false): Promise<ReelType[]> {
    const params = new URLSearchParams();
    if (categoryId) params.set('category', categoryId);
    if (activeOnly) params.set('active', 'true');
    
    const response = await fetch(`/api/reels/types?${params}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch types');
    }
    
    const data = await response.json();
    return data.types;
  }

  async getType(id: string): Promise<ReelType> {
    const response = await fetch(`/api/reels/types/${id}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch type');
    }
    
    const data = await response.json();
    return data.type;
  }

  async createType(typeData: Omit<ReelType, 'id' | 'created_at' | 'updated_at' | 'category_name' | 'category_title'>): Promise<ReelType> {
    const response = await fetch('/api/reels/types', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(typeData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create type');
    }
    
    const data = await response.json();
    return data.type;
  }

  async updateType(id: string, updates: Partial<Omit<ReelType, 'id' | 'created_at' | 'updated_at' | 'category_name' | 'category_title'>>): Promise<ReelType> {
    const response = await fetch(`/api/reels/types/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update type');
    }
    
    const data = await response.json();
    return data.type;
  }

  async deleteType(id: string): Promise<void> {
    const response = await fetch(`/api/reels/types/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete type');
    }
  }
}

// Export singleton instance
export const reelService = new ReelService();
