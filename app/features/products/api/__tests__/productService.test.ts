import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '../productService';
import type { ProductFormData } from '../../types/product.types';

// Top-level mock data
const mockProduct = {
  id: 'test-product-id',
  name: 'Test Product',
  sku: 'TEST-123',
  description: 'Test description',
  retail_price: 10.99,
  business_price: 8.99,
  stock: 100,
  is_active: true,
  categories: [
    {
      category: {
        id: 'cat-1',
        name: 'Original Category',
      },
    },
  ],
};

const mockUpdatedProduct = {
  ...mockProduct,
  name: 'Updated Product',
  categories: [
    {
      category: {
        id: 'cat-2',
        name: 'New Category',
      },
    },
  ],
};

describe('ProductService', () => {
  let productService: ProductService;
  let mockSupabaseClient: any;
  const mockSession = {
    user: { id: 'test-user-id' },
    access_token: 'test-token',
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        setSession: vi.fn(),
      },
      from: vi.fn(),
    };
    productService = new ProductService(mockSupabaseClient);
    productService.setSession(mockSession as any);
  });

  describe('updateProduct', () => {
    const mockFormData: ProductFormData = {
      name: 'Updated Product',
      sku: 'TEST-123',
      description: 'Test description',
      retail_price: '10.99',
      business_price: '8.99',
      stock: '100',
      is_active: true,
      category_ids: ['cat-2'],
    };

    it('updates product data and returns with new categories', async () => {
      // Create a mock for the sequence of operations on products table
      const productsQueryBuilder = {
        // Initial update operation
        update: vi.fn().mockReturnThis(),
        // Final select operation
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedProduct, error: null }),
      };

      // Mock category operations
      const categoriesQueryBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      // Return different query builders based on the table name
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'product_categories') {
          return categoriesQueryBuilder;
        }
        return productsQueryBuilder;
      });

      const result = await productService.updateProduct('test-product-id', mockFormData);

      // Verify the returned data structure
      expect(result).toEqual(mockUpdatedProduct);
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].category.id).toBe('cat-2');
      expect(result.categories[0].category.name).toBe('New Category');

      // Verify the sequence of operations
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('product_categories');
      expect(productsQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockFormData.name,
          sku: mockFormData.sku,
        })
      );
      expect(categoriesQueryBuilder.delete).toHaveBeenCalled();
      expect(categoriesQueryBuilder.insert).toHaveBeenCalled();
    });

    it('handles category update failure properly', async () => {
      // Mock successful product update
      const productsQueryBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      // Mock category deletion failure
      const categoriesQueryBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Failed to update product categories'),
        }),
      };

      // Return different query builders based on the table name
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'product_categories') {
          return categoriesQueryBuilder;
        }
        return productsQueryBuilder;
      });

      await expect(productService.updateProduct('test-product-id', mockFormData)).rejects.toThrow(
        'Failed to update product categories'
      );

      // Verify operation sequence
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('product_categories');
      expect(categoriesQueryBuilder.delete).toHaveBeenCalled();
    });

    it('handles product update failure properly', async () => {
      // Mock product update failure
      const productsQueryBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Failed to update product'),
        }),
      };

      mockSupabaseClient.from.mockReturnValue(productsQueryBuilder);

      await expect(productService.updateProduct('test-product-id', mockFormData)).rejects.toThrow(
        'Failed to update product'
      );

      // Verify operation sequence stopped at product update
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(productsQueryBuilder.update).toHaveBeenCalled();
    });
  });
});
