import { CategoryService } from '../services/categoryService';
import { createClient } from '@supabase/supabase-js';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [
            {
              id: '1',
              name: 'Test Category',
              slug: 'test-category',
              sort_order: 0,
              is_visible: true,
            },
          ],
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: '1',
              name: 'New Category',
              slug: 'new-category',
              sort_order: 0,
              is_visible: true,
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: '1',
                name: 'Updated Category',
                slug: 'updated-category',
                sort_order: 1,
                is_visible: true,
              },
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
      upsert: vi.fn(() => ({
        data: null,
        error: null,
      })),
    })),
  })),
}));

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createClient('fake-url', 'fake-key');
    categoryService = new CategoryService(mockSupabase);
  });

  describe('fetchCategories', () => {
    it('should fetch categories successfully', async () => {
      const categories = await categoryService.fetchCategories();
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Test Category');
    });

    it('should handle fetch error', async () => {
      mockSupabase.from().select = vi.fn(() => ({
        order: vi.fn(() => ({
          data: null,
          error: new Error('Failed to load categories'),
        })),
      }));

      await expect(categoryService.fetchCategories()).rejects.toThrow('Failed to load categories');
    });
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      const newCategory = await categoryService.createCategory({
        name: 'New Category',
        description: '',
        parent_id: null,
        sort_order: 0,
        is_visible: true,
      });
      expect(newCategory.name).toBe('New Category');
      expect(newCategory.slug).toBe('new-category');
    });

    it('should generate slug if not provided', async () => {
      const newCategory = await categoryService.createCategory({
        name: 'Test Category Name',
        description: '',
        parent_id: null,
        sort_order: 0,
        is_visible: true,
      });
      expect(newCategory.slug).toBe('new-category'); // Using mock response
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const updatedCategory = await categoryService.updateCategory('1', {
        name: 'Updated Category',
      });
      expect(updatedCategory.name).toBe('Updated Category');
    });

    it('should update slug when name changes', async () => {
      const updatedCategory = await categoryService.updateCategory('1', {
        name: 'Updated Category',
      });
      expect(updatedCategory.slug).toBe('updated-category');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      await expect(categoryService.deleteCategory('1')).resolves.not.toThrow();
    });

    it('should handle delete error', async () => {
      mockSupabase.from().delete = vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: new Error('Delete failed'),
        })),
      }));

      await expect(categoryService.deleteCategory('1')).rejects.toThrow('Delete failed');
    });
  });

  describe('updatePositions', () => {
    it('should update positions successfully', async () => {
      const updates = [
        { id: '1', position: 1 },
        { id: '2', position: 2 },
      ];

      await expect(categoryService.updatePositions(updates)).resolves.not.toThrow();
    });

    it('should handle update positions error', async () => {
      mockSupabase.from().upsert = vi.fn(() => ({
        data: null,
        error: new Error('Update positions failed'),
      }));

      await expect(categoryService.updatePositions([{ id: '1', position: 1 }])).rejects.toThrow(
        'Update positions failed'
      );
    });
  });

  describe('buildCategoryTree', () => {
    it('should build tree structure correctly', async () => {
      const categories = [
        {
          id: '1',
          name: 'Parent',
          slug: 'parent',
          sort_order: 0,
          is_visible: true,
          parent_id: null,
        },
        {
          id: '2',
          name: 'Child',
          slug: 'child',
          sort_order: 0,
          is_visible: true,
          parent_id: '1',
        },
      ];

      mockSupabase.from().select = vi.fn(() => ({
        order: vi.fn(() => ({
          data: categories,
          error: null,
        })),
      }));

      const tree = await categoryService.fetchCategoryTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].name).toBe('Child');
    });
  });
});
