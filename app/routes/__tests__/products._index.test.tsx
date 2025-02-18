import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useLoaderData, useSearchParams } from '@remix-run/react';
import Products from '../products._index';
import type { CustomerFilterOptions } from '~/features/products/components/ProductFilter';

// Mock Remix hooks
vi.mock('@remix-run/react', () => ({
  useLoaderData: vi.fn(),
  useSearchParams: vi.fn(),
  useNavigation: () => ({ state: 'idle', formData: null }),
  Form: ({ children }: { children: React.ReactNode }) => <form>{children}</form>,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock media query hook
vi.mock('~/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false,
}));

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

function createMockLoaderData({
  products = mockProducts,
  total = 1,
  nextCursor = null,
  initialLoad = true,
  filters = {},
  categories = mockCategories,
}: {
  products?: typeof mockProducts;
  total?: number;
  nextCursor?: string | null;
  initialLoad?: boolean;
  filters?: CustomerFilterOptions;
  categories?: typeof mockCategories;
} = {}) {
  return {
    products,
    total,
    nextCursor,
    initialLoad,
    filters,
    categories,
  };
}

describe('Products Page', () => {
  let mockSetSearchParams: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetSearchParams = vi.fn();
    (useSearchParams as any).mockImplementation(() => [new URLSearchParams(), mockSetSearchParams]);
    (useLoaderData as any).mockImplementation(() => createMockLoaderData());

    // Mock window.scrollTo
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Filter Reset Functionality', () => {
    it('should clear all filters when reset is clicked', async () => {
      // Setup initial filters
      const searchParams = new URLSearchParams('maxPrice=10&categoryId=cat1&inStockOnly=true');
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

      // Verify initial filters are applied
      expect(screen.getByRole('spinbutton', { name: 'Maximum price' })).toHaveValue(10);

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /reset all filters/i });
      fireEvent.click(resetButton);

      // Verify setSearchParams was called with empty params
      expect(mockSetSearchParams).toHaveBeenCalled();
      const [[newParams]] = mockSetSearchParams.mock.calls;
      expect(Array.from(newParams.entries())).toHaveLength(0);

      // Verify filter inputs are cleared
      await waitFor(() => {
        expect(screen.getByRole('spinbutton', { name: 'Maximum price' })).toHaveValue(null);
      });

      // Verify filter count badge is removed
      const filterBadges = screen.queryAllByTestId('filter-count-badge');
      expect(filterBadges).toHaveLength(0);
    });

    it('should preserve view parameter when resetting filters', async () => {
      // Setup initial state with view parameter and filters
      const searchParams = new URLSearchParams('view=list&maxPrice=10');
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

      // Verify setSearchParams was called with only view parameter
      expect(mockSetSearchParams).toHaveBeenCalled();
      const [[newParams]] = mockSetSearchParams.mock.calls;
      expect(newParams.get('view')).toBe('list');
      expect(newParams.get('maxPrice')).toBeNull();
    });

    it('should clear filters and URL params after page reload', async () => {
      // Setup initial filters
      const searchParams = new URLSearchParams('maxPrice=10');
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

      // Simulate page reload by updating mocks and rerendering
      (useSearchParams as any).mockImplementation(() => [
        new URLSearchParams(),
        mockSetSearchParams,
      ]);
      (useLoaderData as any).mockImplementation(() => createMockLoaderData());

      rerender(<Products />);

      // Verify filters remain cleared after reload
      await waitFor(() => {
        expect(screen.getByRole('spinbutton', { name: 'Maximum price' })).toHaveValue(null);
      });
    });
  });
});
