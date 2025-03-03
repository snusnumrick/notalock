import { CategoryService } from '../api/categoryService';
import { SupabaseClient } from '@supabase/supabase-js';

// Create mock Supabase client
const createMockSupabaseClient = () => {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
        in: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: {}, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
};

describe('CategoryService', () => {
  describe('highlight management', () => {
    let categoryService: CategoryService;
    let mockClient: SupabaseClient;

    beforeEach(() => {
      mockClient = createMockSupabaseClient();
      categoryService = new CategoryService(mockClient);
    });

    it('fetches highlighted categories', async () => {
      const mockDBData = [{ id: '1', name: 'Category 1', is_highlighted: true }];

      // Expected camelCase result
      const expectedResult = [
        {
          id: '1',
          name: 'Category 1',
          isHighlighted: true,
          children: undefined,
          description: undefined,
          highlightPriority: 0,
          isActive: true,
          isVisible: true,
          parentId: undefined,
          position: 0,
          slug: undefined,
          sortOrder: 0,
          status: '',
        },
      ];

      mockClient.from = () =>
        ({
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: mockDBData, error: null }),
            }),
          }),
        }) as any;

      const result = await categoryService.fetchHighlightedCategories();
      expect(result).toEqual(expectedResult);
    });

    it('updates highlight status for multiple categories', async () => {
      const mockResponse = { data: null, error: null };
      mockClient.from = () =>
        ({
          update: () => ({
            in: () => Promise.resolve(mockResponse),
          }),
        }) as any;

      await expect(categoryService.updateHighlightStatus(['1', '2'], true)).resolves.not.toThrow();
    });

    it('updates highlight priority', async () => {
      const mockResponse = { data: null, error: null };
      mockClient.from = () =>
        ({
          update: () => ({
            eq: () => ({
              eq: () => Promise.resolve(mockResponse),
            }),
          }),
        }) as any;

      await expect(categoryService.updateHighlightPriority('1', 2)).resolves.not.toThrow();
    });

    it('creates category with highlight fields', async () => {
      const mockDBData = { id: '1', name: 'New Category' };

      // Expected transformed result
      const expectedResult = {
        id: '1',
        name: 'New Category',
        children: undefined,
        description: undefined,
        highlightPriority: 0,
        isActive: true,
        isHighlighted: false,
        isVisible: true,
        parentId: undefined,
        position: 0,
        slug: undefined,
        sortOrder: 0,
        status: '',
      };

      mockClient.from = () =>
        ({
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: mockDBData, error: null }),
            }),
          }),
        }) as any;

      const result = await categoryService.createCategory({
        name: 'New Category',
        isHighlighted: true,
        highlightPriority: 1,
      });
      expect(result).toEqual(expectedResult);
    });

    it('handles errors when fetching highlighted categories', async () => {
      mockClient.from = () =>
        ({
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: null, error: new Error('Failed to load') }),
            }),
          }),
        }) as any;

      await expect(categoryService.fetchHighlightedCategories()).rejects.toThrow(
        'Failed to load highlighted categories'
      );
    });

    it('handles errors when updating highlight status', async () => {
      mockClient.from = () =>
        ({
          update: () => ({
            in: () => Promise.resolve({ data: null, error: new Error('Failed to update') }),
          }),
        }) as any;

      await expect(categoryService.updateHighlightStatus(['1'], true)).rejects.toThrow(
        'Failed to update highlight status'
      );
    });

    it('handles errors when updating highlight priority', async () => {
      mockClient.from = () =>
        ({
          update: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ data: null, error: new Error('Failed to update') }),
            }),
          }),
        }) as any;

      await expect(categoryService.updateHighlightPriority('1', 2)).rejects.toThrow(
        'Failed to update highlight priority'
      );
    });
  });
});
