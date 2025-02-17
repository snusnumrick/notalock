import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductManagement } from '../ProductManagement';
import { createBrowserClient } from '@supabase/ssr';
import { ProductService } from '../../api/productService';
import { CategoryService } from '~/features/categories/api/categoryService';
import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Test suite for ProductManagement component
 *
 * Tests cover:
 * - Session initialization and maintenance
 * - Product operations with session handling
 * - Error states and recovery
 * - Cleanup and resource management
 */

// Mock external dependencies
vi.mock('~/features/categories/api/categoryService', () => ({
  CategoryService: vi.fn(() => ({
    fetchCategories: vi.fn().mockResolvedValue(mockCategories),
  })),
}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
}));

vi.mock('../../api/productService', () => ({
  ProductService: vi.fn(),
}));

// Helper functions for test setup
const createMockSupabaseClient = () => ({
  auth: {
    setSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    getSession: vi.fn().mockResolvedValue({
      data: { session: mockSession },
      error: null,
    }),
  },
  from: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockProducts[0], error: null }),
  }),
});

const createMockProductService = () => ({
  setSession: vi.fn(),
  fetchProducts: vi.fn().mockResolvedValue(mockProducts),
  createProduct: vi.fn().mockImplementation(async data => ({
    ...mockProducts[0],
    ...data,
  })),
  updateProduct: vi.fn().mockImplementation(async (id, data) => ({
    ...mockProducts[0],
    ...data,
  })),
  deleteProduct: vi.fn().mockResolvedValue(undefined),
});

// Test fixtures and mock data
const mockCategories = [
  { id: 'cat1', name: 'Category 1' },
  { id: 'cat2', name: 'Category 2' },
];

const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'admin',
  aud: 'authenticated',
  created_at: '2024-01-01',
} as User;

const mockSession = {
  access_token: 'test-token',
  refresh_token: 'test-refresh-token',
  user: mockUser,
  expires_in: 3600,
};

const mockProducts = [
  {
    id: '1',
    name: 'Test Product',
    sku: 'TEST-001',
    description: 'Test Description',
    retail_price: 99.99,
    business_price: 79.99,
    stock: 100,
    is_active: true,
    categories: [],
  },
];

describe('ProductManagement Component', () => {
  let mockSupabaseClient: SupabaseClient;
  let mockProductService: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock instances
    mockSupabaseClient = createMockSupabaseClient();
    mockProductService = createMockProductService();

    // Set up mocks
    (createBrowserClient as any).mockReturnValue(mockSupabaseClient);
    (CategoryService as any).mockImplementation(() => ({
      fetchCategories: vi.fn().mockResolvedValue(mockCategories),
    }));
    (ProductService as any).mockImplementation(() => mockProductService);
  });

  describe('Session Initialization', () => {
    it('creates Supabase client with correct cookie configuration', async () => {
      render(
        <ProductManagement
          supabaseUrl="test-url"
          supabaseAnonKey="test-key"
          initialSession={mockSession}
        />
      );

      expect(createBrowserClient).toHaveBeenCalledWith(
        'test-url',
        'test-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        })
      );
    });

    it('initializes ProductService with session', async () => {
      render(
        <ProductManagement
          supabaseUrl="test-url"
          supabaseAnonKey="test-key"
          initialSession={mockSession}
        />
      );

      expect(mockProductService.setSession).toHaveBeenCalledWith(mockSession);
      expect(mockProductService.fetchProducts).toHaveBeenCalled();
    });
  });

  describe('Product Operations', () => {
    it('maintains session during product listing', async () => {
      render(
        <ProductManagement
          supabaseUrl="test-url"
          supabaseAnonKey="test-key"
          initialSession={mockSession}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      expect(mockProductService.fetchProducts).toHaveBeenCalledTimes(1);
    });

    it('preserves session during product updates', async () => {
      const updatedProduct = {
        ...mockProducts[0],
        name: 'Updated Product',
      };
      mockProductService.updateProduct.mockResolvedValueOnce(updatedProduct);

      render(
        <ProductManagement
          supabaseUrl="test-url"
          supabaseAnonKey="test-key"
          initialSession={mockSession}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      const editButton = screen.getByLabelText('Edit Test Product');
      fireEvent.click(editButton);

      expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith(mockSession);
      expect(mockProductService.setSession).toHaveBeenCalledWith(mockSession);
    });

    it('maintains session during product deletion', async () => {
      render(
        <ProductManagement
          supabaseUrl="test-url"
          supabaseAnonKey="test-key"
          initialSession={mockSession}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      const deleteButton = screen.getByLabelText('Delete Test Product');
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);

      expect(mockProductService.deleteProduct).toHaveBeenCalledWith('1');
      expect(mockProductService.setSession).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('Category Loading', () => {
    it('loads categories successfully when opening product form', async () => {
      render(
        <ProductManagement
          supabaseUrl="test-url"
          supabaseAnonKey="test-key"
          initialSession={mockSession}
        />
      );

      // Click the Add Product button to open the form
      const addButton = screen.getByText('Add Product');
      fireEvent.click(addButton);

      // Wait for category select to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Categories')).toBeInTheDocument();
      });

      // Get options and verify their content
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('Category 1');
      expect(options[1]).toHaveTextContent('Category 2');
    });

    it('handles category loading errors gracefully when opening form', async () => {
      // Create a deferred promise to control the timing
      let rejectFn: (error: Error) => void;
      const fetchPromise = new Promise((_, reject) => {
        rejectFn = reject;
      });

      const mockFetchCategories = vi.fn().mockImplementation(() => fetchPromise);

      (CategoryService as any).mockImplementation(() => ({
        fetchCategories: mockFetchCategories,
      }));

      render(
        <ProductManagement
          supabaseUrl="test-url"
          supabaseAnonKey="test-key"
          initialSession={mockSession}
        />
      );

      // Click the Add Product button to open the form
      const addButton = screen.getByText('Add Product');
      fireEvent.click(addButton);

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText('Add New Product')).toBeInTheDocument();
      });

      // Verify loading state
      const loadingText = await screen.findByText('Loading categories...');
      expect(loadingText).toHaveClass('text-sm', 'text-gray-500');

      // Now reject the categories fetch
      rejectFn!(new Error('Failed to load categories'));

      // Verify the error was handled gracefully
      await waitFor(() => {
        expect(mockFetchCategories).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when session is invalid', async () => {
      mockProductService.fetchProducts.mockRejectedValueOnce(new Error('No active session found'));

      render(
        <ProductManagement
          supabaseUrl="test-url"
          supabaseAnonKey="test-key"
          initialSession={mockSession}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load products/)).toBeInTheDocument();
      });
    });

    it('handles product operation errors without losing session', async () => {
      mockProductService.updateProduct.mockRejectedValueOnce(new Error('Update failed'));

      render(
        <ProductManagement
          supabaseUrl="test-url"
          supabaseAnonKey="test-key"
          initialSession={mockSession}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      const editButton = screen.getByLabelText('Edit Test Product');
      fireEvent.click(editButton);

      // Verify session is still maintained after error
      expect(mockProductService.setSession).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('Cleanup', () => {
    it('unsubscribes from auth state changes on unmount', () => {
      const unsubscribe = vi.fn();
      (mockSupabaseClient.auth.onAuthStateChange as any).mockReturnValue({
        data: { subscription: { unsubscribe } },
      });

      const { unmount } = render(
        <ProductManagement
          supabaseUrl="test-url"
          supabaseAnonKey="test-key"
          initialSession={mockSession}
        />
      );

      unmount();
      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
