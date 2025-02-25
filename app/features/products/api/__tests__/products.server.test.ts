import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createMockSupabaseClient } from '~/test/mocks/supabase';

// Mock Supabase lib including the stable order function
vi.mock('~/lib/supabase', () => {
  return {
    createStableOrder: vi.fn((column, options, query) => {
      // Add mock order method to simulate stable order
      query.order(column, options);
      return query;
    }),
    orderWithConfig: vi.fn(query => query),
    getSupabase: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      })),
    })),
  };
});

// Import after mocks
import { getProducts } from '../products.server';
import { getSupabase, createStableOrder } from '~/lib/supabase';

// Top-level mock data
const mockCategories = [
  { id: 'cat1', name: 'Category 1' },
  { id: 'cat2', name: 'Category 2' },
];

const mockProducts = Array.from({ length: 12 }, (_, i) => ({
  id: `prod${i + 1}`,
  name: `Product ${i + 1}`,
  description: `Description ${i + 1}`,
  retail_price: 10 + i,
  business_price: 20 + i,
  stock: 5,
  sku: `SKU${i + 1}`,
  image_url: `image${i + 1}.jpg`,
  is_active: true,
  featured: i === 0,
  has_variants: false,
  created_by: 'test-user',
  updated_by: 'test-user',
  created_at: '2024-02-18T00:00:00.000Z',
  product_categories: [
    {
      category: mockCategories[0],
    },
  ],
}));

describe('Products Server API', () => {
  let mockQueryBuilder: {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    gt: ReturnType<typeof vi.fn>;
    gte: ReturnType<typeof vi.fn>;
    lte: ReturnType<typeof vi.fn>;
    or: ReturnType<typeof vi.fn>;
    ilike: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      }),
    };

    // Create a mock client with the necessary query builder
    const mockSupabase = {
      ...createMockSupabaseClient(),
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    // Use a type assertion to satisfy TypeScript
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);
  });

  describe('getProducts', () => {
    it('should handle cursor-based pagination with featured sort order', async () => {
      // Setup mock response for first page
      mockQueryBuilder.limit.mockResolvedValueOnce({
        data: mockProducts,
        count: 103,
        error: null,
      });

      // Get first page
      const firstPage = await getProducts({ limit: 12 });
      expect(firstPage.products).toHaveLength(12);
      expect(firstPage.total).toBe(103);
      expect(firstPage.nextCursor).toBeDefined();

      // Verify sorting order
      expect(createStableOrder).toHaveBeenCalledWith(
        'featured',
        expect.objectContaining({ ascending: false, nullsLast: true }),
        expect.anything()
      );
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('id', { ascending: true });

      // Decode cursor to verify its structure
      const decodedCursor = JSON.parse(atob(firstPage.nextCursor!));
      expect(decodedCursor).toEqual({
        id: mockProducts[11].id,
        retail_price: mockProducts[11].retail_price,
        name: mockProducts[11].name,
        created_at: mockProducts[11].created_at,
        featured: mockProducts[11].featured,
      });

      // Setup mock response for second page
      const secondPageMockProducts = Array.from({ length: 12 }, (_, i) => ({
        ...mockProducts[0],
        id: `prod${i + 13}`,
        name: `Product ${i + 13}`,
        retail_price: 22 + i,
        featured: false,
      }));

      mockQueryBuilder.limit.mockResolvedValueOnce({
        data: secondPageMockProducts,
        count: 103,
        error: null,
      });

      // Get second page using cursor
      const secondPage = await getProducts({
        limit: 12,
        cursor: firstPage.nextCursor ?? undefined,
        filters: { sortOrder: 'featured' },
      });

      expect(secondPage.products).toHaveLength(12);
      expect(secondPage.total).toBe(103);
      expect(secondPage.nextCursor).toBeDefined();

      // Verify cursor condition was set
      expect(mockQueryBuilder.or).toHaveBeenCalled();
    });

    it('should handle cursor-based pagination with category filters', async () => {
      mockQueryBuilder.limit.mockResolvedValueOnce({
        data: mockProducts,
        count: 50,
        error: null,
      });

      const firstPage = await getProducts({
        limit: 12,
        categoryId: 'cat1',
      });

      expect(firstPage.products).toHaveLength(12);
      expect(firstPage.total).toBe(50);
      expect(firstPage.nextCursor).toBeDefined();

      // Verify category filter was set
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('product_categories.category_id', 'cat1');

      const secondPageMockProducts = mockProducts.map(p => ({
        ...p,
        id: `next-${p.id}`,
      }));

      mockQueryBuilder.limit.mockResolvedValueOnce({
        data: secondPageMockProducts,
        count: 50,
        error: null,
      });

      const secondPage = await getProducts({
        limit: 12,
        cursor: firstPage.nextCursor ?? undefined,
        categoryId: 'cat1',
      });

      expect(secondPage.products).toHaveLength(12);
      expect(secondPage.total).toBe(50);
      expect(secondPage.nextCursor).toBeDefined();

      // Verify cursor condition was set
      expect(mockQueryBuilder.gt).toHaveBeenCalled();
    });

    it('should handle filters and sort orders', async () => {
      mockQueryBuilder.limit.mockResolvedValueOnce({
        data: mockProducts,
        count: 30,
        error: null,
      });

      await getProducts({
        filters: {
          minPrice: 10,
          maxPrice: 100,
          inStockOnly: true,
          sortOrder: 'price_asc',
        },
      });

      // Verify filters were applied
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('retail_price', 10);
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('retail_price', 100);
      expect(mockQueryBuilder.gt).toHaveBeenCalledWith('stock', 0);

      // Verify sorting
      expect(createStableOrder).toHaveBeenCalledWith(
        'retail_price',
        expect.objectContaining({ ascending: true, nullsLast: true }),
        expect.anything()
      );
    });

    it('should handle admin filters', async () => {
      mockQueryBuilder.limit.mockResolvedValueOnce({
        data: mockProducts,
        count: 20,
        error: null,
      });

      await getProducts({
        isAdmin: true,
        filters: {
          search: 'test',
          minPrice: 10,
          maxPrice: 100,
          minStock: 5,
          maxStock: 50,
          isActive: true,
          hasVariants: false,
          sortBy: 'price',
          sortOrder: 'asc',
        },
      });

      // Verify admin filters were applied in correct order
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('name', '%test%');
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('retail_price', 10);
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('retail_price', 100);
      expect(mockQueryBuilder.gte).toHaveBeenCalledWith('stock', 5);
      expect(mockQueryBuilder.lte).toHaveBeenCalledWith('stock', 50);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('has_variants', false);

      // Verify sorting
      expect(createStableOrder).toHaveBeenCalledWith(
        'retail_price',
        expect.objectContaining({ ascending: true, nullsLast: true }),
        expect.anything()
      );
    });

    it('should handle error responses', async () => {
      // Mock error response
      mockQueryBuilder.limit.mockResolvedValueOnce({
        data: null,
        count: null,
        error: new Error('Database error'),
      });

      await expect(getProducts({})).rejects.toThrow('Failed to fetch products');
    });
  });
});
