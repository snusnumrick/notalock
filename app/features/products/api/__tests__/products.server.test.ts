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

    // Create the products query chain
    productsQuery = {
      eq: vi.fn(),
      gt: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      select: vi.fn(),
    };

    // Create the count query chain
    countQuery = {
      eq: vi.fn(),
      gt: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
    };

    // Set up chain returns for products query
    Object.values(productsQuery).forEach(method => {
      method.mockReturnValue(productsQuery);
    });

    // Set up chain returns for count query
    Object.values(countQuery).forEach(method => {
      method.mockReturnValue(countQuery);
    });

    // Mock select function
    selectMock = vi.fn().mockImplementation((fields: string, options?: { count: string }) => {
      console.log('Select called with:', { fields, options });
      return options?.count === 'exact' ? countQuery : productsQuery;
    });

    // Mock Supabase client
    (getSupabase as jest.Mock).mockReturnValue({
      from: vi.fn().mockReturnValue({ select: selectMock }),
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
      categories: [],
    }));

    // Expected transformed response
    const expectedProducts = mockSupabaseProducts.map(product => ({
      id: product.id,
      name: product.name,
      price: product.retail_price,
      description: product.description,
      image_url: product.image_url,
      sku: product.sku,
      stock: product.stock,
      featured: product.featured,
      created_at: product.created_at,
      hasVariants: product.has_variants,
      categories: [],
    }));

    // Mock products query
    productsQuery.limit.mockReturnValue(
      Promise.resolve({
        data: mockSupabaseProducts,
        error: null,
      })
    );

    // Mock count query
    countQuery.eq.mockReturnValue(countQuery);
    countQuery.then = (resolve: any) => resolve({ count: 20, error: null }); // More than the limit
    Object.defineProperty(countQuery, Symbol.toStringTag, { value: 'Promise' });

    const result = await getProducts({});
    console.log('Test result:', {
      productsLength: result.products.length,
      total: result.total,
      hasNextCursor: result.nextCursor !== null,
    });

    // Verify outputs
    expect(result.products).toEqual(expectedProducts);
    expect(result.total).toBe(20);
    expect(result.nextCursor).not.toBeNull();
  });

  it('should handle cursor-based pagination', async () => {
    countQuery.eq.mockReturnValue(countQuery);
    countQuery.then = (resolve: any) => resolve({ count: 0, error: null });
    Object.defineProperty(countQuery, Symbol.toStringTag, { value: 'Promise' });

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
    countQuery.eq.mockReturnValue(countQuery);
    countQuery.then = (resolve: any) => resolve({ count: 0, error: null });
    Object.defineProperty(countQuery, Symbol.toStringTag, { value: 'Promise' });

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
    expect(productsQuery.eq).toHaveBeenCalledWith('categories.category.id', 'cat1');
    expect(productsQuery.order).toHaveBeenCalledWith('retail_price', { ascending: true });
  });

  it('should handle database errors', async () => {
    productsQuery.limit.mockRejectedValueOnce(new Error('Failed to fetch products'));
    countQuery.eq.mockReturnValue(countQuery);
    countQuery.then = (resolve: any) => resolve({ count: 0, error: null });
    Object.defineProperty(countQuery, Symbol.toStringTag, { value: 'Promise' });

    await expect(getProducts({})).rejects.toThrow('Failed to fetch products');
  });

  it('should return empty results when no data is found', async () => {
    productsQuery.limit.mockResolvedValueOnce({ data: [], error: null });
    countQuery.eq.mockReturnValue(countQuery);
    countQuery.then = (resolve: any) => resolve({ count: 0, error: null });
    Object.defineProperty(countQuery, Symbol.toStringTag, { value: 'Promise' });

    const result = await getProducts({});

    expect(result.products).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.nextCursor).toBeNull();
  });

  it('should handle featured product sorting', async () => {
    countQuery.eq.mockReturnValue(countQuery);
    countQuery.then = (resolve: any) => resolve({ count: 0, error: null });
    Object.defineProperty(countQuery, Symbol.toStringTag, { value: 'Promise' });

    await getProducts({ filters: { sortOrder: 'featured' } });

    expect(productsQuery.order).toHaveBeenCalledWith('featured', { ascending: false });
    expect(productsQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});
