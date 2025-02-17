import { CategoryService } from '../api/categoryService';
import { createClient } from '@supabase/supabase-js';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('CategoryService - Highlight Features', () => {
  let categoryService: CategoryService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    categoryService = new CategoryService(mockSupabase);
  });

  describe('fetchHighlightedCategories', () => {
    it('should fetch highlighted categories successfully', async () => {
      const mockHighlightedCategories = [
        {
          id: '1',
          name: 'Highlighted Category 1',
          is_highlighted: true,
          highlight_priority: 2,
        },
        {
          id: '2',
          name: 'Highlighted Category 2',
          is_highlighted: true,
          highlight_priority: 1,
        },
      ];

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              data: mockHighlightedCategories,
              error: null,
            }),
          }),
        }),
      }));

      const result = await categoryService.fetchHighlightedCategories();

      expect(result).toEqual(mockHighlightedCategories);
      expect(mockSupabase.from).toHaveBeenCalledWith('categories');
    });

    it('should throw error when fetching highlighted categories fails', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              data: null,
              error: new Error('Failed to load highlighted categories'),
            }),
          }),
        }),
      }));

      await expect(categoryService.fetchHighlightedCategories()).rejects.toThrow(
        'Failed to load highlighted categories'
      );
    });
  });

  describe('updateHighlightStatus', () => {
    it('should update highlight status successfully', async () => {
      const categoryIds = ['1', '2'];
      const isHighlighted = true;

      mockSupabase.from.mockImplementation(() => ({
        update: () => ({
          in: () => ({
            data: null,
            error: null,
          }),
        }),
      }));

      await expect(
        categoryService.updateHighlightStatus(categoryIds, isHighlighted)
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('categories');
    });

    it('should reset highlight priority when removing highlight status', async () => {
      const categoryIds = ['1'];
      const isHighlighted = false;

      mockSupabase.from.mockImplementation(() => ({
        update: data => ({
          in: () => {
            expect(data.highlight_priority).toBeNull();
            return { data: null, error: null };
          },
        }),
      }));

      await categoryService.updateHighlightStatus(categoryIds, isHighlighted);
    });

    it('should throw error when update highlight status fails', async () => {
      mockSupabase.from.mockImplementation(() => ({
        update: () => ({
          in: () => ({
            data: null,
            error: new Error('Failed to update highlight status'),
          }),
        }),
      }));

      await expect(categoryService.updateHighlightStatus(['1'], true)).rejects.toThrow(
        'Failed to update highlight status'
      );
    });
  });

  describe('updateHighlightPriority', () => {
    it('should update highlight priority successfully', async () => {
      const categoryId = '1';
      const priority = 1;

      mockSupabase.from.mockImplementation(() => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              data: null,
              error: null,
            }),
          }),
        }),
      }));

      await expect(
        categoryService.updateHighlightPriority(categoryId, priority)
      ).resolves.not.toThrow();
    });

    it('should throw error for negative priority', async () => {
      await expect(categoryService.updateHighlightPriority('1', -1)).rejects.toThrow(
        'Priority must be non-negative'
      );
    });

    it('should only update highlighted categories', async () => {
      const categoryId = '1';
      const priority = 1;

      mockSupabase.from.mockImplementation(() => ({
        update: () => ({
          eq: (field: string, value: any) => {
            if (field === 'is_highlighted') {
              expect(value).toBe(true);
            }
            return {
              eq: () => ({
                data: null,
                error: null,
              }),
            };
          },
        }),
      }));

      await categoryService.updateHighlightPriority(categoryId, priority);
    });

    it('should throw error when update priority fails', async () => {
      mockSupabase.from.mockImplementation(() => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              data: null,
              error: new Error('Failed to update highlight priority'),
            }),
          }),
        }),
      }));

      await expect(categoryService.updateHighlightPriority('1', 1)).rejects.toThrow(
        'Failed to update highlight priority'
      );
    });
  });
});
