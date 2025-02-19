import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import Products from '../products._index';
import type { CustomerFilterOptions } from '~/features/products/components/ProductFilter';

const mockSubmit = vi.fn();

// Mock Remix hooks with proper chain management
vi.mock('@remix-run/react', () => ({
  useLoaderData: vi.fn(),
  useSearchParams: vi.fn(),
  useNavigation: () => ({ state: 'idle', formData: null }),
  useSubmit: () => mockSubmit,
  Form: ({ children, onSubmit }: { children: React.ReactNode; onSubmit?: () => void }) => (
    <form onSubmit={onSubmit}>{children}</form>
  ),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock media query hook
vi.mock('~/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false,
}));

// Top-level mock data
const mockCategories = [
  { id: 'cat1', name: 'Category 1' },
  { id: 'cat2', name: 'Category 2' },
];

const mockProducts = [
  {
    id: 'prod1',
    name: 'Product 1',
    description: 'Description 1',
    price: 10,
    image_url: 'image1.jpg',
    sku: 'SKU1',
    stock: 5,
    featured: true,
    created_at: '2024-02-18T00:00:00.000Z',
    hasVariants: false,
    categories: [mockCategories[0]],
  },
];

// Reusable mock builder
const createMockLoaderData = (overrides = {}) => ({
  products: mockProducts,
  total: 1,
  nextCursor: null,
  initialLoad: true,
  filters: {},
  categories: mockCategories,
  ...overrides,
});

// Helper for creating form data with parameters
const createFormData = (params: Record<string, string>) => {
  const formData = new FormData();
  Object.entries(params).forEach(([key, value]) => {
    formData.set(key, value);
  });
  return formData;
};

describe('Products Page', () => {
  let mockSetSearchParams: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetSearchParams = vi.fn().mockReturnThis();
    mockSubmit.mockClear();
    (useSearchParams as any).mockImplementation(() => [new URLSearchParams(), mockSetSearchParams]);
    (useLoaderData as any).mockImplementation(() => createMockLoaderData());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Filter Reset Functionality', () => {
    it('should clear all filters when reset is clicked', async () => {
      // Setup initial filters
      const searchParams = new URLSearchParams();
      searchParams.set('maxPrice', '10');
      searchParams.set('categoryId', 'cat1');
      searchParams.set('inStockOnly', 'true');

      (useSearchParams as any).mockImplementation(() => [searchParams, mockSetSearchParams]);
      (useLoaderData as any).mockImplementation(() =>
        createMockLoaderData({
          filters: {
            maxPrice: 10,
            categoryId: 'cat1',
            inStockOnly: true,
          },
        })
      );

      render(<Products />);

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /reset all filters/i });
      fireEvent.click(resetButton);

      // Wait for and verify form submission
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.any(FormData),
          expect.objectContaining({
            method: 'get',
            preventScrollReset: true,
            replace: true,
          })
        );
      });

      // Verify URL params are cleared
      const [[submittedFormData]] = mockSubmit.mock.calls;
      expect(submittedFormData.get('maxPrice')).toBeNull();
      expect(submittedFormData.get('categoryId')).toBeNull();
      expect(submittedFormData.get('inStockOnly')).toBeNull();
    });

    it('should preserve view parameter when resetting filters', async () => {
      // Setup initial state with view parameter
      const searchParams = new URLSearchParams();
      searchParams.set('view', 'list');
      searchParams.set('maxPrice', '10');
      searchParams.set('sortOrder', 'featured');

      (useSearchParams as any).mockImplementation(() => [searchParams, mockSetSearchParams]);
      (useLoaderData as any).mockImplementation(() =>
        createMockLoaderData({
          filters: {
            maxPrice: 10,
          },
        })
      );

      render(<Products />);

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /reset all filters/i });
      fireEvent.click(resetButton);

      // Wait for form submission
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.any(FormData),
          expect.objectContaining({
            method: 'get',
            preventScrollReset: true,
            replace: true,
          })
        );
      });

      // Verify preserved parameters
      const [[submittedFormData]] = mockSubmit.mock.calls;
      expect(submittedFormData.get('view')).toBe('list');
      expect(submittedFormData.get('maxPrice')).toBeNull();
      expect(submittedFormData.get('sortOrder')).toBe('featured');
    });

    it('should clear filters and URL params after page reload', async () => {
      // Setup initial filters
      const searchParams = new URLSearchParams();
      searchParams.set('maxPrice', '10');
      searchParams.set('sortOrder', 'featured');

      (useSearchParams as any).mockImplementation(() => [searchParams, mockSetSearchParams]);
      (useLoaderData as any).mockImplementation(() =>
        createMockLoaderData({
          filters: { maxPrice: 10 },
        })
      );

      const { rerender } = render(<Products />);

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /reset all filters/i });
      fireEvent.click(resetButton);

      // Wait for form submission
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
      });

      // Simulate page reload
      (useSearchParams as any).mockImplementation(() => [
        new URLSearchParams(),
        mockSetSearchParams,
      ]);
      (useLoaderData as any).mockImplementation(() => createMockLoaderData());
      rerender(<Products />);

      // Verify filters cleared
      const maxPriceInput = screen.getByRole('spinbutton', { name: /maximum price/i });
      expect(maxPriceInput).toHaveValue(null);

      // Verify filter badge removed
      const filterBadge = screen.queryByTestId('filter-count-badge');
      expect(filterBadge).not.toBeInTheDocument();
    });
  });
});
