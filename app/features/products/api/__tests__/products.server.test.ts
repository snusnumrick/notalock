import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getProducts } from '../products.server';
import { getSupabase } from '~/lib/supabase';

// Mock Supabase client
vi.mock('~/lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

describe('getProducts', () => {
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockGte = vi.fn();
  const mockLte = vi.fn();
  const mockIlike = vi.fn();
  const mockGt = vi.fn();
  const mockOrder = vi.fn();
  const mockRange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset chain of mock functions
    mockSelect.mockReturnValue({
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      ilike: mockIlike,
      gt: mockGt,
      order: mockOrder,
      range: mockRange,
    });
    mockEq.mockReturnValue({
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      ilike: mockIlike,
      gt: mockGt,
      order: mockOrder,
      range: mockRange,
    });
    mockGte.mockReturnValue({
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      ilike: mockIlike,
      gt: mockGt,
      order: mockOrder,
      range: mockRange,
    });
    mockLte.mockReturnValue({
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      ilike: mockIlike,
      gt: mockGt,
      order: mockOrder,
      range: mockRange,
    });
    mockIlike.mockReturnValue({
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      ilike: mockIlike,
      gt: mockGt,
      order: mockOrder,
      range: mockRange,
    });
    mockGt.mockReturnValue({
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      ilike: mockIlike,
      gt: mockGt,
      order: mockOrder,
      range: mockRange,
    });
    mockOrder.mockReturnValue({
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      ilike: mockIlike,
      gt: mockGt,
      order: mockOrder,
      range: mockRange,
    });

    // Mock Supabase client
    (getSupabase as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      from: () => ({
        select: mockSelect,
      }),
    });
  });

  it('should fetch products with default parameters', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        description: 'Description',
        retail_price: 100,
        image_url: 'test.jpg',
        sku: 'TEST-1',
        stock: 10,
        has_variants: false,
        categories: [
          {
            category: {
              id: 'cat1',
              name: 'Category 1',
            },
          },
        ],
      },
    ];

    mockRange.mockResolvedValue({
      data: mockProducts,
      count: 1,
      error: null,
    });

    const result = await getProducts();

    expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('id'), { count: 'exact' });
    expect(mockEq).toHaveBeenCalledWith('is_active', true);
    expect(mockRange).toHaveBeenCalledWith(0, 11);
    expect(result).toEqual({
      products: [
        {
          id: '1',
          name: 'Test Product',
          description: 'Description',
          price: 100,
          thumbnailUrl: 'test.jpg',
          sku: 'TEST-1',
          stock: 10,
          hasVariants: false,
          categories: [
            {
              id: 'cat1',
              name: 'Category 1',
            },
          ],
        },
      ],
      total: 1,
    });
  });

  it('should apply admin filters correctly', async () => {
    mockRange.mockResolvedValue({
      data: [],
      count: 0,
      error: null,
    });

    const adminFilters = {
      search: 'test',
      minPrice: 10,
      maxPrice: 100,
      minStock: 5,
      maxStock: 50,
      isActive: true,
      hasVariants: false,
      sortBy: 'price' as const,
      sortOrder: 'asc' as const,
    };

    await getProducts({
      isAdmin: true,
      filters: adminFilters,
    });

    expect(mockIlike).toHaveBeenCalledWith('name', '%test%');
    expect(mockGte).toHaveBeenCalledWith('retail_price', 10);
    expect(mockLte).toHaveBeenCalledWith('retail_price', 100);
    expect(mockGte).toHaveBeenCalledWith('stock', 5);
    expect(mockLte).toHaveBeenCalledWith('stock', 50);
    expect(mockEq).toHaveBeenCalledWith('is_active', true);
    expect(mockEq).toHaveBeenCalledWith('has_variants', false);
    expect(mockOrder).toHaveBeenCalledWith('retail_price', { ascending: true });
  });

  it('should apply customer filters correctly', async () => {
    mockRange.mockResolvedValue({
      data: [],
      count: 0,
      error: null,
    });

    const customerFilters = {
      minPrice: 20,
      maxPrice: 200,
      inStockOnly: true,
      sortOrder: 'price_asc' as const,
      categoryId: 'cat1',
    };

    await getProducts({
      filters: customerFilters,
    });

    expect(mockGte).toHaveBeenCalledWith('retail_price', 20);
    expect(mockLte).toHaveBeenCalledWith('retail_price', 200);
    expect(mockGt).toHaveBeenCalledWith('stock', 0);
    expect(mockOrder).toHaveBeenCalledWith('retail_price', { ascending: true });
    expect(mockEq).toHaveBeenCalledWith('product_categories.category_id', 'cat1');
  });

  it('should handle database errors', async () => {
    mockRange.mockResolvedValue({
      data: null,
      error: new Error('Database error'),
    });

    await expect(getProducts()).rejects.toThrow('Failed to fetch products from database');
  });

  it('should return empty results when no data is found', async () => {
    mockRange.mockResolvedValue({
      data: null,
      count: null,
      error: null,
    });

    const result = await getProducts();
    expect(result).toEqual({
      products: [],
      total: 0,
    });
  });

  it('should handle pagination correctly', async () => {
    mockRange.mockResolvedValue({
      data: [],
      count: 100,
      error: null,
    });

    await getProducts({ page: 3, limit: 20 });

    expect(mockRange).toHaveBeenCalledWith(40, 59);
  });

  it('should handle category filtering with categoryId parameter', async () => {
    mockRange.mockResolvedValue({
      data: [],
      count: 0,
      error: null,
    });

    await getProducts({ categoryId: 'test-category' });

    expect(mockEq).toHaveBeenCalledWith('product_categories.category_id', 'test-category');
  });

  it('should verify INNER JOIN behavior with category filtering', async () => {
    // Mock product data to simulate database response
    const mockProducts = [
      {
        id: '1',
        name: 'Product with Category',
        retail_price: 100,
        categories: [{ category: { id: 'cat1', name: 'Category 1' } }],
      },
      {
        id: '2',
        name: 'Product without Category',
        retail_price: 200,
        categories: [],
      },
    ];

    mockRange.mockResolvedValue({
      data: mockProducts,
      count: 2,
      error: null,
    });

    // Verify the select query includes INNER JOIN
    await getProducts({ categoryId: 'cat1' });

    // Check if the select was called with an INNER JOIN
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining('categories:product_categories!inner'),
      expect.any(Object)
    );

    // Verify category filter
    expect(mockEq).toHaveBeenCalledWith('product_categories.category_id', 'cat1');
  });

  it('should handle featured product sorting for customer view', async () => {
    mockRange.mockResolvedValue({
      data: [],
      count: 0,
      error: null,
    });

    await getProducts({
      filters: { sortOrder: 'featured' },
    });

    expect(mockOrder).toHaveBeenCalledWith('featured', { ascending: false });
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});
