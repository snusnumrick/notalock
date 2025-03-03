import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import * as React from 'react';
import { useNavigation } from '@remix-run/react';
import { useRetry } from '~/hooks/useRetry';
import { ProductGrid } from '../ProductGrid';
import { renderWithRouter } from '~/test/test-utils';

// Mock the ProductCardWithReferrer component
vi.mock('../ProductCardWithReferrer', () => ({
  __esModule: true,
  default: ({ product, index }: any) => (
    <a href={`/products/${product.slug}`} key={index} data-testid="product-card">
      <div>{product.name}</div>
      <div>{product.description}</div>
      <div>${product.price.toFixed(2)}</div>
      {product.categories?.map((cat: any) => (
        <span key={cat.id} className="badge">
          {cat.name}
        </span>
      ))}
    </a>
  ),
}));

// Mock the categories utils
vi.mock('~/features/categories/utils/categoryUtils', () => ({
  findCategoryBySlug: vi.fn().mockReturnValue(null),
}));

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('@remix-run/react', () => ({
  useNavigation: vi.fn(() => ({
    state: 'idle',
    formData: null,
  })),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/products',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  }),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock useRetry hook
const mockExecute = vi.fn();
const mockReset = vi.fn();
const mockCancelRetries = vi.fn();

vi.mock('~/hooks/useRetry', () => ({
  useRetry: vi.fn(() => ({
    execute: mockExecute,
    state: { attempt: 0, error: null, isRetrying: false },
    reset: mockReset,
    cancelRetries: mockCancelRetries,
  })),
}));

describe('ProductGrid', () => {
  const mockProducts = [
    {
      id: '1',
      name: 'Product 1',
      description: 'Description 1',
      price: 100,
      image_url: '/image1.jpg',
      sku: 'SKU1',
      stock: 5,
      featured: true,
      created_at: '2024-02-18T00:00:00.000Z',
      hasVariants: false,
      categories: [{ id: 'cat1', name: 'Category 1' }],
    },
    {
      id: '2',
      name: 'Product 2',
      description: 'Description 2',
      price: 200,
      image_url: '/image2.jpg',
      sku: 'SKU2',
      stock: 5,
      featured: false,
      created_at: '2024-02-18T00:00:00.000Z',
      hasVariants: false,
      categories: [{ id: 'cat2', name: 'Category 2' }],
    },
  ];

  const defaultProps = {
    products: mockProducts,
    nextCursor: 'next',
    isInitialLoad: false,
    total: 10, // Ensure total > products.length to make hasMore true
    searchParams: new URLSearchParams(),
    setSearchParams: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockExecute.mockReset();
    mockReset.mockReset();
    mockCancelRetries.mockReset();

    // Reset hooks to default state
    vi.mocked(useNavigation).mockImplementation(() => ({
      state: 'idle',
      formData: null,
    }));

    mockExecute.mockResolvedValue(undefined);

    // Mock IntersectionObserver
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.mockImplementation(_callback => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
    window.IntersectionObserver = mockIntersectionObserver;
  });

  it('renders products correctly', () => {
    renderWithRouter(<ProductGrid {...defaultProps} />);

    expect(screen.getAllByTestId('product-card')).toHaveLength(2);
  });

  it('shows loading state when navigation is loading', () => {
    // Set the navigation state to 'loading'
    vi.mocked(useNavigation).mockImplementation(() => ({
      state: 'loading',
      formData: null,
    }));

    renderWithRouter(<ProductGrid {...defaultProps} />);

    // Check for skeleton components
    const skeletons = screen.getAllByTestId(/product-skeleton/i);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows retry UI when load fails', async () => {
    const error = new Error('Failed to load');
    mockExecute.mockRejectedValueOnce(error);

    vi.mocked(useRetry).mockImplementation(() => ({
      execute: mockExecute,
      state: { attempt: 1, error, isRetrying: false },
      reset: mockReset,
      cancelRetries: mockCancelRetries,
    }));

    renderWithRouter(<ProductGrid {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load more products. Please try again.')
      ).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    expect(mockReset).toHaveBeenCalled();
  });

  // This test simulates scrolling to the bottom by triggering the IntersectionObserver callback
  it('loads more products when scrolling near bottom', async () => {
    // Render the component
    renderWithRouter(<ProductGrid {...defaultProps} />);

    // Get the callback that was provided to IntersectionObserver
    const observerCallback = window.IntersectionObserver.mock.calls[0][0];

    // Manually call the callback to simulate the sentinel element becoming visible
    observerCallback([{ isIntersecting: true }]);

    // Verify that executeLoadMore was called
    await waitFor(
      () => {
        expect(mockExecute).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  // We no longer preserve scroll position on back navigation because we want to start from
  // the beginning of the list when sorting changes

  it('shows empty state when no products and initial load', () => {
    renderWithRouter(<ProductGrid {...defaultProps} products={[]} isInitialLoad={true} />);

    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(screen.getByText('Clear all filters')).toBeInTheDocument();
  });
});
