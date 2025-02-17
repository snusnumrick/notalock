import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategories } from '../categories.server';
import { getSupabase } from '~/lib/supabase';

vi.mock('~/lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

describe('categories.server', () => {
  let mockSupabase: any;
  let mockQuery: any;

  beforeEach(() => {
    mockQuery = {
      from: vi.fn(),
      select: vi.fn(),
      order: vi.fn(),
      eq: vi.fn(),
      is: vi.fn(),
    };

    mockSupabase = {
      from: vi.fn(),
    };

    // Setup method chaining
    mockQuery.from.mockReturnValue(mockQuery);
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.order.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
    mockQuery.is.mockReturnValue(mockQuery);

    mockSupabase.from.mockReturnValue(mockQuery);

    (getSupabase as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('getCategories', () => {
    it('should fetch all categories by default', async () => {
      mockQuery.is.mockReturnValueOnce({
        data: [{ id: '1', name: 'Test Category', parent_id: null }],
        error: null,
      });

      const result = await getCategories();

      expect(mockSupabase.from).toHaveBeenCalledWith('categories');
      expect(mockQuery.is).toHaveBeenCalledWith('parent_id', null);
      expect(result).toEqual([
        expect.objectContaining({
          id: '1',
          name: 'Test Category',
          parentId: null,
        }),
      ]);
    });

    it('should filter active and visible categories when activeOnly is true', async () => {
      mockQuery.is.mockReturnValueOnce({
        data: [{ id: '1', is_active: true, is_visible: true }],
        error: null,
      });

      await getCategories({ activeOnly: true });

      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQuery.eq).toHaveBeenCalledWith('is_visible', true);
    });

    it('should filter by parent_id when specified', async () => {
      const parentId = '123';
      mockQuery.eq.mockReturnValueOnce({
        data: [{ id: '2', name: 'Child Category', parent_id: parentId }],
        error: null,
      });

      await getCategories({ parentId });

      expect(mockQuery.eq).toHaveBeenCalledWith('parent_id', parentId);
    });

    it('should fetch root categories when parentId is null', async () => {
      mockQuery.is.mockReturnValueOnce({
        data: [{ id: '1', parent_id: null }],
        error: null,
      });

      await getCategories({ parentId: null });

      expect(mockQuery.is).toHaveBeenCalledWith('parent_id', null);
    });

    it('should include children when includeChildren is true', async () => {
      // Mock parent category query
      mockQuery.is.mockReturnValueOnce({
        data: [{ id: '1', name: 'Parent', parent_id: null }],
        error: null,
      });

      // Mock child category query
      mockQuery.eq.mockReturnValueOnce({
        data: [{ id: '2', name: 'Child', parent_id: '1' }],
        error: null,
      });

      const result = await getCategories({ includeChildren: true });

      expect(result).toHaveLength(1);
      expect(result[0].children).toBeDefined();
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].name).toBe('Child');
    });

    it('should throw error when database query fails', async () => {
      mockQuery.is.mockReturnValueOnce({
        data: null,
        error: new Error('Database error'),
      });

      await expect(getCategories()).rejects.toThrow('Failed to fetch categories');
    });

    it('should return empty array when no data is found', async () => {
      mockQuery.is.mockReturnValueOnce({
        data: null,
        error: null,
      });

      const result = await getCategories();
      expect(result).toEqual([]);
    });
  });
});
