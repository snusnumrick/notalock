import { vi, describe, it, expect } from 'vitest';
import { findCategoryBySlug, getCategoryPath, getCategoryDescendants } from '../categoryUtils';

// Mock the categories data
vi.mock('../../../../data/categories', () => ({
  categories: [
    {
      id: 'electronics',
      name: 'Electronics',
      slug: 'electronics',
      children: [
        {
          id: 'phones',
          name: 'Phones',
          slug: 'phones',
          children: [
            {
              id: 'smartphones',
              name: 'Smartphones',
              slug: 'smartphones',
              children: [],
            },
          ],
        },
      ],
    },
    {
      id: 'clothing',
      name: 'Clothing',
      slug: 'clothing',
      children: [],
    },
  ],
}));

describe('categoryUtils', () => {
  describe('findCategoryBySlug', () => {
    it('finds top-level category by slug', () => {
      const result = findCategoryBySlug('electronics');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('electronics');
      expect(result?.name).toBe('Electronics');
    });

    it('finds nested category by slug', () => {
      const result = findCategoryBySlug('phones');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('phones');
      expect(result?.name).toBe('Phones');
    });

    it('finds deeply nested category by slug', () => {
      const result = findCategoryBySlug('smartphones');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('smartphones');
      expect(result?.name).toBe('Smartphones');
    });

    it('returns null for non-existent slug', () => {
      const result = findCategoryBySlug('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getCategoryPath', () => {
    it('returns path for top-level category', () => {
      const result = getCategoryPath('electronics');
      expect(result).toEqual(['electronics']);
    });

    it('returns path for nested category', () => {
      const result = getCategoryPath('phones');
      expect(result).toEqual(['electronics', 'phones']);
    });

    it('returns path for deeply nested category', () => {
      const result = getCategoryPath('smartphones');
      expect(result).toEqual(['electronics', 'phones', 'smartphones']);
    });

    it('returns empty array for non-existent slug', () => {
      const result = getCategoryPath('non-existent');
      expect(result).toEqual([]);
    });
  });

  describe('getCategoryDescendants', () => {
    it('returns descendant IDs for top-level category', () => {
      const result = getCategoryDescendants('electronics');
      expect(result).toContain('electronics');
      expect(result).toContain('phones');
      expect(result).toContain('smartphones');
      expect(result.length).toBe(3);
    });

    it('returns descendant IDs for mid-level category', () => {
      const result = getCategoryDescendants('phones');
      expect(result).toContain('phones');
      expect(result).toContain('smartphones');
      expect(result.length).toBe(2);
    });

    it('returns only the category ID for leaf category', () => {
      const result = getCategoryDescendants('smartphones');
      expect(result).toEqual(['smartphones']);
    });

    it('returns empty array for non-existent category ID', () => {
      const result = getCategoryDescendants('non-existent');
      expect(result).toEqual([]);
    });
  });
});
