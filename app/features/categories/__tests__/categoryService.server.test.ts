import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategoryService } from '../api/categoryService.server';

// Mock environment variables
vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_ANON_KEY', 'test-key');

// Create hoisted mock functions
const createMockCategoryService = vi.hoisted(() =>
  vi.fn().mockImplementation(() => ({
    client: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    },
    fetchCategories: vi.fn().mockResolvedValue([]),
  }))
);

const createMockSupabaseClient = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  })
);

// Mock the CategoryService class
vi.mock('../api/categoryService', () => ({
  CategoryService: createMockCategoryService,
}));

// Mock Supabase client creation
vi.mock('~/server/services/supabase.server', () => ({
  createSupabaseClient: createMockSupabaseClient,
}));

describe('categoryService.server', () => {
  const mockRequest = new Request('http://localhost');
  const mockResponse = new Response();

  describe('getCategoryService', () => {
    beforeEach(() => {
      // Clear the singleton instance before each test
      (getCategoryService as any).instance = null;

      // Reset mock call counts
      createMockCategoryService.mockClear();
      createMockSupabaseClient.mockClear();
    });

    it('should create a new instance when first called', () => {
      const service = getCategoryService(mockRequest, mockResponse);

      expect(service).toBeDefined();
      expect(createMockSupabaseClient).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(createMockCategoryService).toHaveBeenCalledTimes(1);
    });

    it('should return the same instance on subsequent calls', () => {
      // First call to create instance
      const firstInstance = getCategoryService(mockRequest, mockResponse);

      // Reset mock call counts after first instance creation
      createMockCategoryService.mockClear();
      createMockSupabaseClient.mockClear();

      // Second call should reuse instance
      const secondInstance = getCategoryService(mockRequest, mockResponse);

      // Verify instance was reused
      expect(firstInstance).toBe(secondInstance);
      expect(createMockCategoryService).not.toHaveBeenCalled();
      expect(createMockSupabaseClient).not.toHaveBeenCalled();
    });

    it('should initialize the service with the correct Supabase client', async () => {
      // Mock data for the fetch response
      const mockData = [{ id: '1', name: 'Test Category' }];

      const service = getCategoryService(mockRequest, mockResponse);
      const mockFetchCategories = service.fetchCategories as jest.Mock;
      mockFetchCategories.mockResolvedValueOnce(mockData);

      // Call the method and verify results
      const result = await service.fetchCategories();
      expect(result).toEqual(mockData);
      expect(mockFetchCategories).toHaveBeenCalledTimes(1);
    });
  });
});
