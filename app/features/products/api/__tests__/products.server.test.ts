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
        lt: vi.fn().mockReturnThis(),
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

// Products with multiple categories for testing category filtering
const mockMultiCategoryProducts = Array.from({ length: 12 }, (_, i) => ({
  ...mockProducts[i],
  product_categories: [{ category: mockCategories[0] }, { category: mockCategories[1] }],
}));

describe('Products Server API', () => {
  let mockQueryBuilder: {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    gt: ReturnType<typeof vi.fn>;
    gte: ReturnType<typeof vi.fn>;
    lte: ReturnType<typeof vi.fn>;
    lt: ReturnType<typeof vi.fn>;
    or: ReturnType<typeof vi.fn>;
    ilike: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
  };

  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
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
    mockSupabase = {
      ...createMockSupabaseClient(),
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    // Use a type assertion to satisfy TypeScript
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);
  });

  describe('getProducts', () => {
    describe('category filtering', () => {
      it('should verify category filtering functionality', async () => {
        // Setup mock response
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockProducts,
          count: 20,
          error: null,
        });

        // Execute the category filter
        const result = await getProducts({
          categoryId: 'cat1',
        });

        // Verify basic functionality
        expect(result.products).toHaveLength(mockProducts.length);
        expect(mockSupabase.from).toHaveBeenCalledWith('products');

        // Verify category filter was applied correctly
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('product_categories.category_id', 'cat1');
      });
    });

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

    // NEW TESTS FOR CATEGORY FILTERING

    describe('category filtering', () => {
      it('should correctly apply category filter when provided as URL parameter', async () => {
        // Setup required mocks
        const fromSpy = vi.spyOn(mockSupabase, 'from');
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockProducts,
          count: 50,
          error: null,
        });

        await getProducts({
          categoryId: 'cat1',
        });

        // Verify that the from method was called with 'products'
        expect(fromSpy).toHaveBeenCalledWith('products');

        // Verify select was called
        expect(mockQueryBuilder.select).toHaveBeenCalled();

        // Verify category filter was applied correctly - check exact field path
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('product_categories.category_id', 'cat1');

        // Verify is_active filter is still applied when using category filtering
        // This is crucial - the bug might be that we're not applying necessary filters
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('is_active', true);
      });

      it('should correctly apply category filter when provided in filters object', async () => {
        // Setup required mocks
        const fromSpy = vi.spyOn(mockSupabase, 'from');
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockProducts,
          count: 50,
          error: null,
        });

        await getProducts({
          filters: {
            categoryId: 'cat1',
          },
        });

        // Verify that the from method was called with 'products'
        expect(fromSpy).toHaveBeenCalledWith('products');

        // Verify select was called
        expect(mockQueryBuilder.select).toHaveBeenCalled();

        // Verify category filter was applied correctly
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('product_categories.category_id', 'cat1');
      });

      it('should prioritize URL categoryId over filters object categoryId', async () => {
        // Setup required mocks
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockProducts,
          count: 50,
          error: null,
        });

        await getProducts({
          categoryId: 'cat1',
          filters: {
            categoryId: 'cat2', // This should be ignored in favor of the direct categoryId
          },
        });

        // Verify the correct category ID was used
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('product_categories.category_id', 'cat1');
        expect(mockQueryBuilder.eq).not.toHaveBeenCalledWith(
          'product_categories.category_id',
          'cat2'
        );
      });

      it('should apply price filters in combination with category filter', async () => {
        // Setup required mocks
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockProducts,
          count: 50,
          error: null,
        });

        await getProducts({
          categoryId: 'cat1',
          filters: {
            minPrice: 10,
            maxPrice: 100,
          },
        });

        // Verify category filter was applied
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('product_categories.category_id', 'cat1');

        // Verify price filters were applied along with category filter
        expect(mockQueryBuilder.gte).toHaveBeenCalledWith('retail_price', 10);
        expect(mockQueryBuilder.lte).toHaveBeenCalledWith('retail_price', 100);
      });

      it('should apply stock filter in combination with category filter', async () => {
        // Setup required mocks
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockProducts,
          count: 50,
          error: null,
        });

        await getProducts({
          categoryId: 'cat1',
          filters: {
            inStockOnly: true,
          },
        });

        // Verify category filter was applied
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('product_categories.category_id', 'cat1');

        // Verify stock filter was applied
        expect(mockQueryBuilder.gt).toHaveBeenCalledWith('stock', 0);
      });

      it('should handle cursor pagination with category filter correctly', async () => {
        // Setup required mocks for first page
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockProducts,
          count: 50,
          error: null,
        });

        const firstPage = await getProducts({
          categoryId: 'cat1',
        });

        // For second page, verify cursor is applied correctly
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockProducts.map(p => ({ ...p, id: `next-${p.id}` })),
          count: 50,
          error: null,
        });

        // Reset mocks to track the next call clearly
        vi.clearAllMocks();
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockProducts.map(p => ({ ...p, id: `next-${p.id}` })),
          count: 50,
          error: null,
        });

        // Get second page using cursor
        await getProducts({
          categoryId: 'cat1',
          cursor: firstPage.nextCursor || undefined,
        });

        // Verify category filter was still applied
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('product_categories.category_id', 'cat1');

        // Verify cursor pagination was applied with ID-based approach for category filtering
        expect(mockQueryBuilder.gt).toHaveBeenCalled();
      });

      it('should handle the case where both price and category filters are applied along with cursor', async () => {
        // Setup required mocks for first page
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockProducts,
          count: 50,
          error: null,
        });

        const firstPage = await getProducts({
          categoryId: 'cat1',
          filters: {
            minPrice: 10,
            maxPrice: 100,
          },
        });

        // Reset mocks to track the next call clearly
        vi.clearAllMocks();
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockProducts.map(p => ({ ...p, id: `next-${p.id}` })),
          count: 50,
          error: null,
        });

        // Get second page using cursor
        await getProducts({
          categoryId: 'cat1',
          cursor: firstPage.nextCursor || undefined,
          filters: {
            minPrice: 10,
            maxPrice: 100,
          },
        });

        // Verify all filters were applied
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('product_categories.category_id', 'cat1');
        expect(mockQueryBuilder.gte).toHaveBeenCalledWith('retail_price', 10);
        expect(mockQueryBuilder.lte).toHaveBeenCalledWith('retail_price', 100);
        expect(mockQueryBuilder.gt).toHaveBeenCalled(); // Cursor-based pagination

        // Verify a select call was made
        expect(mockQueryBuilder.select).toHaveBeenCalled();
      });

      it('should correctly transform products with multiple categories', async () => {
        // Setup required mocks with multi-category products
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockMultiCategoryProducts,
          count: 12,
          error: null,
        });

        const result = await getProducts({});

        // Check that the first product has both categories in transformed result
        expect(result.products[0].categories).toHaveLength(2);
        expect(result.products[0].categories[0].id).toBe('cat1');
        expect(result.products[0].categories[1].id).toBe('cat2');
      });

      it('should handle sorting in combination with category filters', async () => {
        // Setup required mocks
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockProducts,
          count: 50,
          error: null,
        });

        await getProducts({
          categoryId: 'cat1',
          filters: {
            sortOrder: 'price_asc',
          },
        });

        // Verify category filter was applied
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('product_categories.category_id', 'cat1');

        // Verify sort order was applied
        expect(mockQueryBuilder.order).toHaveBeenCalledWith('retail_price', { ascending: true });
      });

      it('should handle a null category value correctly', async () => {
        // Setup required mocks
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: mockProducts,
          count: 103,
          error: null,
        });

        // Call with explicit null categoryId
        await getProducts({
          categoryId: null,
        });

        // Verify standard query path was used, not category filter path
        expect(mockQueryBuilder.select).toHaveBeenCalledWith(
          expect.stringContaining('*,\n    product_categories'),
          expect.anything()
        );
        // Category filter shouldn't be applied
        expect(mockQueryBuilder.eq).not.toHaveBeenCalledWith(
          'product_categories.category_id',
          expect.anything()
        );
      });

      it('should handle errors in the category filter query path', async () => {
        // Setup mock error for category filter path
        mockQueryBuilder.limit.mockResolvedValueOnce({
          data: null,
          count: null,
          error: new Error('Database error in category filter'),
        });

        // Expect the query to throw an error
        await expect(
          getProducts({
            categoryId: 'cat1',
          })
        ).rejects.toThrow('Failed to fetch products');
      });
    });
  });
});
