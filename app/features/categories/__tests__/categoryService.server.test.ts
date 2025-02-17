import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategoryService } from '../api/categoryService.server';
import { createSupabaseServerClient } from '~/server/services/supabase.server';
import { CategoryService } from '../api/categoryService';

// Mock the CategoryService class
vi.mock('../api/categoryService', () => ({
  CategoryService: vi.fn(),
}));

// Mock the Supabase client creation
vi.mock('~/server/services/supabase.server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

describe('categoryService.server', () => {
  const mockRequest = new Request('http://localhost');
  const mockResponse = new Response();
  let mockSupabaseClient: any;
  let mockCategoryService: any;

  beforeEach(() => {
    // Reset modules between tests
    vi.resetModules();

    // Create mock functions for the chain
    const fromSpy = vi.fn();
    const selectSpy = vi.fn();
    const orderSpy = vi.fn();

    orderSpy.mockReturnValue({
      data: [],
      error: null,
    });

    selectSpy.mockReturnValue({
      order: orderSpy,
    });

    fromSpy.mockReturnValue({
      select: selectSpy,
    });

    // Create the mock client with the spy chain
    mockSupabaseClient = {
      from: fromSpy,
    };

    // Create mock instance of CategoryService that uses the client
    mockCategoryService = {
      client: mockSupabaseClient,
      fetchCategories: async function () {
        const { data } = await this.client
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });
        return data;
      },
    };

    // Set up the mock implementations
    (CategoryService as jest.Mock).mockImplementation(() => mockCategoryService);
    (createSupabaseServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('getCategoryService', () => {
    beforeEach(() => {
      // Clear any existing instance
      (getCategoryService as any).instance = null;
    });

    it('should create a new instance when first called', () => {
      const service = getCategoryService(mockRequest, mockResponse);

      expect(service).toBeDefined();
      expect(createSupabaseServerClient).toHaveBeenCalledWith({
        request: mockRequest,
        response: mockResponse,
      });
      expect(CategoryService).toHaveBeenCalledWith(mockSupabaseClient);
    });

    it('should return the same instance on subsequent calls', () => {
      const firstInstance = getCategoryService(mockRequest, mockResponse);
      const secondInstance = getCategoryService(mockRequest, mockResponse);

      expect(firstInstance).toBe(secondInstance);
      expect(createSupabaseServerClient).toHaveBeenCalledTimes(1);
      expect(CategoryService).toHaveBeenCalledTimes(1);
    });

    it('should initialize the service with the correct Supabase client', async () => {
      const service = getCategoryService(mockRequest, mockResponse);

      // Mock data for the fetch response
      const mockData = [{ id: '1', name: 'Test Category' }];
      const mockReturn = {
        data: mockData,
        error: null,
      };

      // Set up the mock chain
      const fromSpy = vi.fn();
      const selectSpy = vi.fn();
      const orderSpy = vi.fn();

      orderSpy.mockReturnValue(mockReturn);
      selectSpy.mockReturnValue({
        order: orderSpy,
      });
      fromSpy.mockReturnValue({
        select: selectSpy,
      });

      // Update the client on the service instance
      service.client = {
        from: fromSpy,
      };

      // Call the method that uses the client
      await service.fetchCategories();

      // Verify the client was used correctly
      expect(fromSpy).toHaveBeenCalledWith('categories');
      expect(selectSpy).toHaveBeenCalledWith('*');
      expect(orderSpy).toHaveBeenCalledWith('sort_order', { ascending: true });
    });
  });
});
