import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts } from '../products.server';
import { getSupabase } from '~/lib/supabase';

vi.mock('~/lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

describe('getProducts', () => {
  let productsQuery: any;
  let countQuery: any;
  let selectMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create the products query chain with proper method chaining
    productsQuery = {
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
    };

    // Create the count query chain with proper method chaining
    countQuery = {
      eq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
    };

    // Mock select function with proper chaining
    selectMock = vi.fn().mockImplementation((fields: string, options?: { count: string }) => {
      return options?.count === 'exact' ? countQuery : productsQuery;
    });

    // Mock Supabase client with proper chaining
    (getSupabase as jest.Mock).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: selectMock,
        ...productsQuery,
      }),
    });
  });

  it('should fetch products with default parameters', async () => {
    // Create multiple mock products to trigger cursor
    const mockSupabaseProducts = Array.from({ length: 12 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Product ${i + 1}`,
      retail_price: 100,
      description: 'Test product',
      image_url: null,
      sku: `SKU${i + 1}`,
      stock: 10,
      featured: false,
      created_at: '2024-01-01',
      has_variants: false,
      product_categories: [],
    }));

    // Mock the final response
    productsQuery.limit.mockResolvedValueOnce({
      data: mockSupabaseProducts,
      error: null,
      count: 20,
    });

    const result = await getProducts({});

    expect(result.products).toHaveLength(12);
    expect(result.total).toBe(20);
    expect(result.nextCursor).not.toBeNull();
  });

  it('should handle cursor-based pagination', async () => {
    // Mock successful empty response
    productsQuery.limit.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 0,
    });

    const cursor = btoa(
      JSON.stringify({
        id: '1',
        retail_price: 100,
        name: 'Product 1',
        created_at: '2024-01-01',
      })
    );

    await getProducts({ cursor });

    expect(productsQuery.gt).toHaveBeenCalledWith('id', '1');
    expect(productsQuery.order).toHaveBeenCalledWith('id');
  });

  it('should handle customer filters correctly', async () => {
    // Mock successful empty response
    productsQuery.limit.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 0,
    });

    await getProducts({
      filters: {
        minPrice: 10,
        maxPrice: 100,
        inStockOnly: true,
        categoryId: 'cat1',
        sortOrder: 'price_asc' as const,
      },
    });

    expect(productsQuery.gte).toHaveBeenCalledWith('retail_price', 10);
    expect(productsQuery.lte).toHaveBeenCalledWith('retail_price', 100);
    expect(productsQuery.gt).toHaveBeenCalledWith('stock', 0);
    expect(productsQuery.order).toHaveBeenCalledWith('retail_price', { ascending: true });
  });

  it('should handle database errors', async () => {
    productsQuery.limit.mockRejectedValueOnce(new Error('Failed to fetch products'));

    await expect(getProducts({})).rejects.toThrow('Failed to fetch products');
  });

  it('should return empty results when no data is found', async () => {
    productsQuery.limit.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 0,
    });

    const result = await getProducts({});

    expect(result.products).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.nextCursor).toBeNull();
  });

  it('should handle featured product sorting', async () => {
    // Mock successful empty response
    productsQuery.limit.mockResolvedValueOnce({
      data: [],
      error: null,
      count: 0,
    });

    await getProducts({ filters: { sortOrder: 'featured' } });

    expect(productsQuery.order).toHaveBeenCalledWith('featured', { ascending: false });
    expect(productsQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});
