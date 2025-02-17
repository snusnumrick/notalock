import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategories } from '../api/categories.server';
import { getSupabase } from '~/lib/supabase';

vi.mock('~/lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

describe('categories.server', () => {
  let mockQuery;
  let mockSupabase;

  beforeEach(() => {
    mockQuery = {
      data: null,
      error: null,
    };

    // Create base query chain with all possible methods
    const queryChain = {
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      data: mockQuery.data,
      error: mockQuery.error,
    };

    // Create the mock chain
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            ...queryChain,
            eq: vi.fn().mockReturnValue({
              ...queryChain,
              is: vi.fn().mockReturnValue(mockQuery),
            }),
            is: vi.fn().mockReturnValue(mockQuery),
          }),
        }),
      }),
    };

    (getSupabase as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('getCategories', () => {
    it('should fetch all categories by default', async () => {
      const mockData = [
        {
          id: '1',
          name: 'Category 1',
          slug: 'category-1',
          description: 'Description 1',
          parent_id: null,
          position: 1,
          is_active: true,
          sort_order: 1,
          is_visible: true,
          status: 'active',
          is_highlighted: false,
          highlight_priority: 0,
        },
      ];

      mockQuery.data = mockData;

      const result = await getCategories();

      expect(result).toEqual([
        {
          id: '1',
          name: 'Category 1',
          slug: 'category-1',
          description: 'Description 1',
          parentId: null,
          position: 1,
          isActive: true,
          sortOrder: 1,
          isVisible: true,
          status: 'active',
          isHighlighted: false,
          highlightPriority: 0,
        },
      ]);
    });

    it('should filter active and visible categories when activeOnly is true', async () => {
      const mockData = [
        {
          id: '1',
          name: 'Active Category',
          is_active: true,
          is_visible: true,
        },
      ];

      mockQuery.data = mockData;

      await getCategories({ activeOnly: true });

      const query = mockSupabase.from().select().order();
      expect(query.eq).toHaveBeenCalledWith('is_active', true);
      expect(query.eq().eq).toHaveBeenCalledWith('is_visible', true);
    });

    it('should filter by parent_id when specified', async () => {
      const parentId = '123';
      const mockData = [
        {
          id: '2',
          name: 'Child Category',
          parent_id: parentId,
        },
      ];

      mockQuery.data = mockData;

      await getCategories({ parentId });

      const query = mockSupabase.from().select().order();
      expect(query.eq).toHaveBeenCalledWith('parent_id', parentId);
    });

    it('should fetch root categories when parentId is null', async () => {
      const mockData = [
        {
          id: '1',
          name: 'Root Category',
          parent_id: null,
        },
      ];

      mockQuery.data = mockData;

      await getCategories({ parentId: null });

      const query = mockSupabase.from().select().order();
      expect(query.is).toHaveBeenCalledWith('parent_id', null);
    });

    it('should include children when includeChildren is true', async () => {
      // Set up parent data
      const parentCategory = {
        id: '1',
        name: 'Parent',
        parent_id: null,
      };

      // Set up child data
      const childCategory = {
        id: '2',
        name: 'Child',
        parent_id: '1',
      };

      // First call for parent
      mockQuery.data = [parentCategory];

      // Create a new mock for child query
      const childQuery = {
        data: [childCategory],
        error: null,
      };

      // Set up the mock chain for the second call
      const secondCallMock = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue(childQuery),
            }),
          }),
        }),
      };

      // First call uses original mock, second call uses new mock
      (getSupabase as jest.Mock)
        .mockReturnValueOnce(mockSupabase)
        .mockReturnValueOnce(secondCallMock);

      const result = await getCategories({ includeChildren: true });

      expect(result).toHaveLength(1);
      expect(result[0].children).toBeDefined();
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('2');
    });

    it('should throw error when database query fails', async () => {
      mockQuery.error = new Error('Database error');
      mockQuery.data = null;

      await expect(getCategories()).rejects.toThrow('Failed to fetch categories');
    });

    it('should return empty array when no data is found', async () => {
      mockQuery.data = null;
      mockQuery.error = null;

      const result = await getCategories();
      expect(result).toEqual([]);
    });
  });
});
