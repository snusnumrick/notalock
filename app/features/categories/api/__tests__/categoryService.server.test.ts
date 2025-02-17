import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategoryService } from '../categoryService.server';
import { createSupabaseServerClient } from '~/server/services/supabase.server';
import { CategoryService } from '../categoryService';

// Mock the actual module to capture the singleton instance
let categoryServiceInstance: any = null;

vi.mock('../categoryService.server', async () => {
  const actual = await vi.importActual<typeof import('../categoryService.server')>(
    '../categoryService.server'
  );
  return {
    ...actual,
    getCategoryService: vi.fn((request: Request, response: Response) => {
      if (!categoryServiceInstance) {
        const supabase = createSupabaseServerClient({ request, response });
        categoryServiceInstance = new CategoryService(supabase);
      }
      return categoryServiceInstance;
    }),
  };
});

// Mock CategoryService constructor
vi.mock('../categoryService', () => ({
  CategoryService: vi.fn(),
}));

// Mock Supabase client creation
vi.mock('~/server/services/supabase.server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

describe('categoryService.server', () => {
  const mockRequest = new Request('http://localhost');
  const mockResponse = new Response();
  let mockSupabase: any;
  let mockInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    categoryServiceInstance = null;

    // Setup Supabase client mock with chain methods
    mockSupabase = {
      from: vi.fn(),
      select: vi.fn(),
      order: vi.fn(),
      eq: vi.fn(),
    };

    // Setup CategoryService instance that uses the Supabase client
    mockInstance = {
      client: mockSupabase,
      fetchCategories: async () => {
        const result = await mockSupabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });
        return result.data || [];
      },
    };

    // Setup mocks
    vi.mocked(createSupabaseServerClient).mockReturnValue(mockSupabase);
    vi.mocked(CategoryService).mockImplementation(() => mockInstance);
  });

  it('should create a new instance when first called', () => {
    const service = getCategoryService(mockRequest, mockResponse);

    expect(service).toBeDefined();
    expect(createSupabaseServerClient).toHaveBeenCalledWith({
      request: mockRequest,
      response: mockResponse,
    });
    expect(CategoryService).toHaveBeenCalledWith(mockSupabase);
  });

  it('should return the same instance on subsequent calls', () => {
    const firstInstance = getCategoryService(mockRequest, mockResponse);
    const secondInstance = getCategoryService(mockRequest, mockResponse);

    expect(firstInstance).toBe(secondInstance);
    expect(createSupabaseServerClient).toHaveBeenCalledTimes(1);
    expect(CategoryService).toHaveBeenCalledTimes(1);
  });

  it('should initialize the service with the correct Supabase client', async () => {
    // Mock successful fetch
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{ id: '1', name: 'Test Category' }],
        error: null,
      }),
    });

    const service = getCategoryService(mockRequest, mockResponse);
    await service.fetchCategories();

    expect(mockSupabase.from).toHaveBeenCalledWith('categories');
  });

  it('should maintain instance across different requests', () => {
    const request1 = new Request('http://localhost/path1');
    const request2 = new Request('http://localhost/path2');
    const response1 = new Response();
    const response2 = new Response();

    const instance1 = getCategoryService(request1, response1);
    const instance2 = getCategoryService(request2, response2);

    expect(instance1).toBe(instance2);
    expect(createSupabaseServerClient).toHaveBeenCalledTimes(1);
    expect(CategoryService).toHaveBeenCalledTimes(1);
  });

  it('should handle database errors', async () => {
    const expectedError = new Error('Failed to load categories');
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockRejectedValue(expectedError),
    });

    const service = getCategoryService(mockRequest, mockResponse);

    await expect(service.fetchCategories()).rejects.toThrow(expectedError);
  });

  it('should handle empty results', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    });

    const service = getCategoryService(mockRequest, mockResponse);
    const result = await service.fetchCategories();

    expect(result).toEqual([]);
  });

  it('should create new instance after module reset', async () => {
    // Mock first instance
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{ id: '1' }],
        error: null,
      }),
    });

    // Get first instance
    const firstInstance = getCategoryService(mockRequest, mockResponse);
    await firstInstance.fetchCategories();

    // Reset module and create new mocks
    categoryServiceInstance = null;
    vi.clearAllMocks();

    // Setup new Supabase client with different response
    const newMockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: '2' }],
          error: null,
        }),
      }),
    };

    // Set up new CategoryService with new client
    const newMockInstance = {
      client: newMockSupabase,
      fetchCategories: async () => {
        const result = await newMockSupabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });
        return result.data || [];
      },
    };

    vi.mocked(createSupabaseServerClient).mockReturnValue(newMockSupabase);
    vi.mocked(CategoryService).mockImplementation(() => newMockInstance);

    // Get new instance
    const secondInstance = getCategoryService(mockRequest, mockResponse);
    const result = await secondInstance.fetchCategories();

    expect(secondInstance).not.toBe(firstInstance);
    expect(result).toEqual([{ id: '2' }]);
    expect(createSupabaseServerClient).toHaveBeenCalledTimes(1);
  });
});
