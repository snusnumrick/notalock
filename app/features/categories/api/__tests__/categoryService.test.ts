import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryService } from '../categoryService';
import { createClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockSupabase: any;

  beforeEach(() => {
    // Create base query chain with all possible methods
    const queryChain = {
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      data: null,
      error: null,
    };

    // Set up mock implementation
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            ...queryChain,
            eq: vi.fn().mockReturnValue({
              ...queryChain,
              in: vi.fn().mockReturnValue({
                data: null,
                error: null,
              }),
            }),
            update: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    categoryService = new CategoryService(mockSupabase);
  });

  describe('Service Method Tests', () => {
    it('should fetch categories with correct query parameters', async () => {
      // Set up mock data
      const mockData = [{ id: '1', name: 'Test' }];

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      await categoryService.fetchCategories({ isHighlighted: true, isVisible: true });

      const fromCall = mockSupabase.from.mock.results[0].value;
      const selectCall = fromCall.select.mock.results[0].value;
      const orderCall = selectCall.order.mock.results[0].value;

      expect(mockSupabase.from).toHaveBeenCalledWith('categories');
      expect(orderCall.eq).toHaveBeenCalledWith('is_highlighted', true);
      expect(orderCall.eq().eq).toHaveBeenCalledWith('is_visible', true);
    });

    it('should handle category tree building correctly', async () => {
      const mockCategories = [
        { id: '1', name: 'Parent', parent_id: null },
        { id: '2', name: 'Child', parent_id: '1' },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          data: mockCategories,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const tree = await categoryService.fetchCategoryTree();

      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].name).toBe('Child');
    });

    it('should validate highlight priority', async () => {
      await expect(categoryService.updateHighlightPriority('1', -1)).rejects.toThrow(
        'Priority must be non-negative'
      );
    });

    it('should reset highlight priority when removing highlight status', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          data: null,
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });

      await categoryService.updateHighlightStatus(['1'], false);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_highlighted: false,
          highlight_priority: null,
        })
      );
    });
  });
});
