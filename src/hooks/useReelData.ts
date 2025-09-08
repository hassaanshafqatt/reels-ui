import { useState, useEffect } from 'react';
import { reelService, type ReelCategory, type ReelType } from '@/lib/reelService';

export interface ReelCategoryWithTypes extends ReelCategory {
  types: ReelType[];
}

export const useReelData = () => {
  const [categories, setCategories] = useState<ReelCategoryWithTypes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReelData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Small delay to ensure cookies are set after login
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const [categoriesData, typesData] = await Promise.all([
        reelService.getCategories(true), // Only active categories
        reelService.getTypes(undefined, true) // Only active types
      ]);

      // Group types by category
      const categoriesWithTypes: ReelCategoryWithTypes[] = categoriesData.map(category => ({
        ...category,
        types: typesData.filter(type => type.category_id === category.id)
      }));

      setCategories(categoriesWithTypes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reel data');
      console.error('Error fetching reel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReelData();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchReelData
  };
};
