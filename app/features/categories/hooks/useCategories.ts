import { useState, useEffect, useCallback } from 'react';
import type { Category, CategoryFormData } from '../types/category.types';
import { CategoryService } from '../api/categoryService';

export function useCategories(categoryService: CategoryService) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoryService.fetchCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load categories'));
    } finally {
      setLoading(false);
    }
  }, [categoryService]);

  const createCategory = async (data: CategoryFormData): Promise<Category> => {
    const category = await categoryService.createCategory(data);
    await loadCategories();
    return category;
  };

  const updateCategory = async (id: string, data: Partial<CategoryFormData>): Promise<Category> => {
    const category = await categoryService.updateCategory(id, data);
    await loadCategories();
    return category;
  };

  const deleteCategory = async (id: string): Promise<void> => {
    await categoryService.deleteCategory(id);
    await loadCategories();
  };

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    refresh: loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
