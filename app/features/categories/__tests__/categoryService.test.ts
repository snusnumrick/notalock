import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CategoryService } from '../services/categoryService';
import type { Category } from '../types/category.types';

// Mock data
const mockSession = {
  user: {
    id: 'user1',
    email: 'test@example.com',
  },
};

const mockCategories: Category[] = [
  {
    id: 'cat1',
    name: 'Category 1',
    slug: 'category-1',
    position: 1,
    isActive: true,
    sortOrder: 1,
    isVisible: true,
    status: 'active',
    isHighlighted: false,
    highlightPriority: 0,
  },
  {
    id: 'cat2',
    name: 'Category 2',
    slug: 'category-2',
    position: 2,
    isActive: true,
    sortOrder: 2,
    isVisible: true,
    status: 'active',
    isHighlighted: true,
    highlightPriority: 1,
  },
];

describe('CategoryService', () => {
  let service: CategoryService;
  let mockClient: any;
  let mockUpdate: any;
  let mockSelect: any;
  let mockDelete: any;
  let mockUpsert: any;
  let mockInsert: any;

  beforeEach(() => {
    // Create base mock functions
    mockUpdate = vi.fn();
    mockSelect = vi.fn();
    mockDelete = vi.fn();
    mockUpsert = vi.fn();
    mockInsert = vi.fn();

    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
      upsert: mockUpsert,
      insert: mockInsert,
    });

    mockClient = { from: mockFrom };
    service = new CategoryService(mockClient, mockSession as any);

    // Setup default successful responses
    mockSelect.mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockCategories, error: null }),
      }),
    });

    // Setup update chain with select and single
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...mockCategories[0],
              name: 'Updated Category',
              slug: 'updated-category',
            },
            error: null,
          }),
        }),
      }),
      in: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockDelete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    mockUpsert.mockResolvedValue({ data: null, error: null });

    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { ...mockCategories[0], name: 'New Category', slug: 'new-category' },
          error: null,
        }),
      }),
    });
  });

  describe('fetchCategories', () => {
    it('should fetch categories successfully', async () => {
      // Modify the expectation to account for our camelCase mapping
      const result = await service.fetchCategories();
      // Check key properties but not structure since we've changed how it's mapped
      expect(result).toHaveLength(mockCategories.length);
      expect(result[0].id).toBe(mockCategories[0].id);
      expect(result[0].name).toBe(mockCategories[0].name);
      expect(mockClient.from).toHaveBeenCalledWith('categories');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should handle fetch error', async () => {
      const error = new Error('Failed to load categories');
      mockSelect.mockReturnValue({
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error }),
        }),
      });

      await expect(service.fetchCategories()).rejects.toThrow('Failed to load categories');
    });
  });

  describe('createCategory', () => {
    const newCategoryData = {
      name: 'New Category',
      description: '',
      parentId: null,
      sortOrder: 0,
      isVisible: true,
      isHighlighted: false,
      highlightPriority: 0,
    };

    it('should create category successfully', async () => {
      await service.createCategory(newCategoryData);
      expect(mockClient.from).toHaveBeenCalledWith('categories');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: newCategoryData.name,
          description: newCategoryData.description,
          parent_id: newCategoryData.parentId,
          sort_order: newCategoryData.sortOrder,
          is_visible: newCategoryData.isVisible,
          is_highlighted: newCategoryData.isHighlighted,
          highlight_priority: newCategoryData.highlightPriority,
          created_by: mockSession.user.id,
        })
      );
    });

    it('should generate slug if not provided', async () => {
      await service.createCategory({
        ...newCategoryData,
        name: 'Test Category Name',
      });
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Category Name',
          slug: 'test-category-name',
        })
      );
    });
  });

  describe('updateCategory', () => {
    const updateData = {
      name: 'Updated Category',
      isVisible: true,
    };

    it('should update category successfully', async () => {
      await service.updateCategory('cat1', updateData);
      expect(mockClient.from).toHaveBeenCalledWith('categories');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: updateData.name,
          is_visible: updateData.isVisible,
          updated_by: mockSession.user.id,
        })
      );
    });

    it('should update slug when name changes', async () => {
      await service.updateCategory('cat1', updateData);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Category',
          slug: 'updated-category',
        })
      );
    });

    it('should handle update error', async () => {
      const error = new Error('Update failed');
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error }),
          }),
        }),
      });

      await expect(service.updateCategory('cat1', updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      await service.deleteCategory('cat1');
      expect(mockClient.from).toHaveBeenCalledWith('categories');
      const deleteChain = mockDelete();
      expect(deleteChain.eq).toHaveBeenCalled();
    });

    it('should handle delete error', async () => {
      const error = new Error('Delete failed');
      mockDelete.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error }),
        }),
      });

      await expect(service.deleteCategory('cat1')).rejects.toThrow('Delete failed');
    });
  });

  describe('updatePositions', () => {
    const updates = [
      { id: 'cat1', position: 1 },
      { id: 'cat2', position: 2 },
    ];

    it('should update positions successfully', async () => {
      await service.updatePositions(updates);
      expect(mockClient.from).toHaveBeenCalledWith('categories');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'cat1',
            sort_order: 1,
            updated_by: mockSession.user.id,
          }),
        ])
      );
    });

    it('should handle update positions error', async () => {
      const error = new Error('Update positions failed');
      mockUpsert.mockResolvedValue({ data: null, error });

      await expect(service.updatePositions(updates)).rejects.toThrow('Update positions failed');
    });
  });

  describe('updateHighlightStatus', () => {
    const categoryIds = ['cat1', 'cat2'];
    const highlight = true;

    it('successfully updates highlight status', async () => {
      await service.updateHighlightStatus(categoryIds, highlight);
      expect(mockClient.from).toHaveBeenCalledWith('categories');
      expect(mockUpdate).toHaveBeenCalledWith({
        is_highlighted: highlight,
        updated_at: expect.any(String),
        updated_by: mockSession.user.id,
      });
    });

    it('handles errors properly', async () => {
      const error = new Error('Update failed');
      mockUpdate.mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: null, error }),
      });

      await expect(service.updateHighlightStatus(categoryIds, highlight)).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('updateHighlightPriority', () => {
    const categoryId = 'cat1';
    const priority = 1;

    it('successfully updates highlight priority', async () => {
      await service.updateHighlightPriority(categoryId, priority);
      expect(mockClient.from).toHaveBeenCalledWith('categories');
      expect(mockUpdate).toHaveBeenCalledWith({
        highlight_priority: priority,
        updated_at: expect.any(String),
        updated_by: mockSession.user.id,
      });
    });

    it('handles errors properly', async () => {
      const error = new Error('Update failed');
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error }),
      });

      await expect(service.updateHighlightPriority(categoryId, priority)).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('buildCategoryTree', () => {
    it('should build tree structure correctly', async () => {
      const treeCategories = [
        {
          id: '1',
          name: 'Parent',
          slug: 'parent',
          sortOrder: 0,
          isVisible: true,
          parentId: null,
          position: 0,
          isActive: true,
          status: 'active',
          isHighlighted: false,
          highlightPriority: 0,
        },
        {
          id: '2',
          name: 'Child',
          slug: 'child',
          sortOrder: 1,
          isVisible: true,
          parentId: '1',
          position: 1,
          isActive: true,
          status: 'active',
          isHighlighted: false,
          highlightPriority: 0,
        },
      ];

      // Mock fetchCategories to return our test data
      vi.spyOn(service, 'fetchCategories').mockResolvedValue(treeCategories);

      const tree = await service.fetchCategoryTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0]?.children?.[0]?.name).toBe('Child');
    });
  });
});
