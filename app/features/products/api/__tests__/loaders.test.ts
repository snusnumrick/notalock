import { vi, describe, it, expect, beforeEach } from 'vitest';
import { productsLoader } from '../loaders';
import { getProducts } from '../products.server';
import { getCategories } from '../../../categories/api/categories.server';
import { DEFAULT_PAGE_LIMIT } from '../../../../config/pagination';

vi.mock('../products.server', () => ({
  getProducts: vi.fn(),
}));

vi.mock('~/features/categories/api/categories.server', () => ({
  getCategories: vi.fn(),
}));

describe('productsLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load products with default parameters', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product',
        price: 100,
      },
    ];

    const mockCategories = [
      {
        id: 'cat1',
        name: 'Category 1',
      },
    ];

    (getProducts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      products: mockProducts,
      total: 1,
      nextCursor: null,
    });

    (getCategories as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategories);

    const request = new Request('http://test.com');
    const result = await productsLoader({ request, params: {}, context: {} });

    expect(getProducts).toHaveBeenCalledWith({
      cursor: undefined,
      limit: DEFAULT_PAGE_LIMIT,
      filters: {
        minPrice: undefined,
        maxPrice: undefined,
        categoryId: undefined,
        inStockOnly: false,
        sortOrder: undefined,
      },
      isAdmin: false,
    });

    expect(getCategories).toHaveBeenCalledWith({ activeOnly: true });

    expect(result).toEqual({
      products: mockProducts,
      total: 1,
      nextCursor: null,
      initialLoad: true,
      filters: {
        minPrice: undefined,
        maxPrice: undefined,
        categoryId: undefined,
        inStockOnly: false,
        sortOrder: undefined,
      },
      categories: [
        {
          id: 'cat1',
          name: 'Category 1',
        },
      ],
    });
  });

  it('should parse URL parameters correctly', async () => {
    const mockProducts = [];
    const mockCategories = [];
    const mockNextCursor = 'next-cursor-value';

    (getProducts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      products: mockProducts,
      total: 0,
      nextCursor: mockNextCursor,
    });

    (getCategories as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategories);

    const request = new Request(
      'http://test.com?cursor=current-cursor&limit=24&minPrice=10&maxPrice=100&categoryId=cat1&inStockOnly=true&sortOrder=price_asc'
    );
    const result = await productsLoader({ request, params: {}, context: {} });

    expect(getProducts).toHaveBeenCalledWith({
      cursor: 'current-cursor',
      limit: 24,
      filters: {
        minPrice: 10,
        maxPrice: 100,
        categoryId: 'cat1',
        inStockOnly: true,
        sortOrder: 'price_asc',
      },
      isAdmin: false,
    });

    expect(result.nextCursor).toBe(mockNextCursor);
    expect(result.initialLoad).toBe(false);
    expect(result.filters).toEqual({
      minPrice: 10,
      maxPrice: 100,
      categoryId: 'cat1',
      inStockOnly: true,
      sortOrder: 'price_asc',
    });
  });

  it('should handle invalid URL parameters', async () => {
    const mockProducts = [];
    const mockCategories = [];

    (getProducts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      products: mockProducts,
      total: 0,
      nextCursor: null,
    });

    (getCategories as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockCategories);

    const request = new Request('http://test.com?limit=invalid&minPrice=invalid&maxPrice=invalid');
    const result = await productsLoader({ request, params: {}, context: {} });

    expect(getProducts).toHaveBeenCalledWith({
      cursor: undefined,
      limit: DEFAULT_PAGE_LIMIT,
      filters: {
        minPrice: undefined,
        maxPrice: undefined,
        categoryId: undefined,
        inStockOnly: false,
        sortOrder: undefined,
      },
      isAdmin: false,
    });

    expect(result.initialLoad).toBe(true);
  });

  it('should handle concurrent data fetching failures', async () => {
    (getProducts as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Products fetch failed')
    );

    (getCategories as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const request = new Request('http://test.com');
    await expect(productsLoader({ request, params: {}, context: {} })).rejects.toThrow(
      'Products fetch failed'
    );
  });

  it('should maintain existing filter values when only some parameters are provided', async () => {
    (getProducts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      products: [],
      total: 0,
      nextCursor: null,
    });

    (getCategories as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const request = new Request('http://test.com?minPrice=10&inStockOnly=true');
    const result = await productsLoader({ request, params: {}, context: {} });

    expect(result.filters).toEqual({
      minPrice: 10,
      maxPrice: undefined,
      categoryId: undefined,
      inStockOnly: true,
      sortOrder: undefined,
    });
  });

  it('should handle boolean filter parameters correctly', async () => {
    (getProducts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      products: [],
      total: 0,
      nextCursor: null,
    });

    (getCategories as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const request = new Request('http://test.com?inStockOnly=false');
    const result = await productsLoader({ request, params: {}, context: {} });

    expect(result.filters.inStockOnly).toBe(false);
  });
});
