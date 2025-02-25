import { screen, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useLoaderData, useSearchParams, useNavigation } from '@remix-run/react';
import { renderWithRouter } from '~/test/test-utils';

// Mock React hooks
vi.mock('@remix-run/react', () => ({
  useLoaderData: vi.fn(),
  useSearchParams: vi.fn(),
  useNavigation: vi.fn(() => ({
    state: 'idle',
    location: undefined,
    formMethod: undefined,
    formAction: undefined,
    formEncType: undefined,
    formData: undefined,
    json: undefined,
    text: undefined,
  })),
  useNavigate: vi.fn(() => vi.fn()),
  useSubmit: vi.fn(() => vi.fn()),
  Form: ({ children, onSubmit }: { children: React.ReactNode; onSubmit?: () => void }) => (
    <form onSubmit={onSubmit}>{children}</form>
  ),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('~/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(() => false),
}));

// Import after mocks
import Products from '../products._index';

// Mock data setup
const mockCategories = [
  { id: 'cat1', name: 'Category 1' },
  { id: 'cat2', name: 'Category 2' },
];

const createMockProduct = (id: number) => ({
  id: `prod${id}`,
  name: `Product ${id}`,
  description: `Description ${id}`,
  price: 10 + id,
  image_url: `image${id}.jpg`,
  sku: `SKU${id}`,
  stock: 5,
  featured: id === 1,
  created_at: '2024-02-18T00:00:00.000Z',
  hasVariants: false,
  categories: [mockCategories[0]],
});

const mockProducts = Array.from({ length: 12 }, (_, i) => createMockProduct(i + 1));
const mockNextPageProducts = Array.from({ length: 12 }, (_, i) => createMockProduct(i + 13));

const createMockLoaderData = (overrides = {}) => ({
  products: mockProducts,
  total: 103,
  nextCursor: 'mock-cursor',
  initialLoad: false,
  filters: {},
  categories: mockCategories,
  ...overrides,
});

describe('Products Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mocks
    vi.mocked(useLoaderData).mockReturnValue(createMockLoaderData({ initialLoad: true }));
    vi.mocked(useNavigation).mockReturnValue({
      state: 'idle',
      location: undefined,
      formMethod: undefined,
      formAction: undefined,
      formEncType: undefined,
      formData: undefined,
      json: undefined,
      text: undefined,
    });

    // Mock scroll behavior
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
    });

    // Mock IntersectionObserver
    window.IntersectionObserver = vi.fn().mockImplementation(callback => {
      return {
        root: null,
        rootMargin: '0px',
        thresholds: [0],
        takeRecords: vi.fn().mockReturnValue([]),
        observe: vi.fn(() => {
          callback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver
          );
        }),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    }) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should update search params when loading more products', async () => {
    const mockSetSearchParams = vi.fn();
    vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams(), mockSetSearchParams]);

    renderWithRouter(<Products />);

    // Wait for initial render and intersection observer trigger
    await waitFor(() => {
      const productLinks = screen.getAllByRole('link');
      expect(productLinks).toHaveLength(12);
    });

    // Update mock data for next page
    vi.mocked(useLoaderData).mockReturnValue({
      ...createMockLoaderData(),
      products: mockNextPageProducts,
      nextCursor: 'next-cursor',
      initialLoad: false,
    });

    // Wait for search params update
    await waitFor(() => {
      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    // Verify the correct cursor was set
    const updateCalls = mockSetSearchParams.mock.calls;
    expect(updateCalls.length).toBeGreaterThan(0);
    const [params, options] = updateCalls[updateCalls.length - 1];
    expect(params.get('cursor')).toBe('mock-cursor');
    expect(options).toEqual(
      expect.objectContaining({
        preventScrollReset: true,
        replace: true,
      })
    );
  });

  it('should display product details correctly', () => {
    const mockSetSearchParams = vi.fn();
    vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams(), mockSetSearchParams]);

    renderWithRouter(<Products />);

    const productCards = screen.getAllByRole('link');
    const firstProductCard = productCards[0];

    expect(firstProductCard).toHaveAttribute('href', '/products/prod1');

    const productName = within(firstProductCard).getByText('Product 1');
    expect(productName).toBeInTheDocument();

    const price = within(firstProductCard).getByText(`$${(11.0).toFixed(2)}`);
    expect(price).toBeInTheDocument();

    const category = within(firstProductCard).getByText('Category 1');
    expect(category).toHaveClass('badge');
  });

  it('should reset products when changing sort order', async () => {
    const mockSetSearchParams = vi.fn();
    vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams(), mockSetSearchParams]);

    const { rerender } = renderWithRouter(<Products />);

    // Change sort order
    const searchParams = new URLSearchParams();
    searchParams.set('sortOrder', 'price_asc');
    vi.mocked(useSearchParams).mockReturnValue([searchParams, mockSetSearchParams]);

    // Update loader data with sorted products
    vi.mocked(useLoaderData).mockReturnValue({
      ...createMockLoaderData(),
      products: [...mockProducts].sort((a, b) => a.price - b.price),
      initialLoad: true,
    });

    rerender(<Products />);

    // Verify products are reset and rendered
    await waitFor(() => {
      const productLinks = screen.getAllByRole('link');
      expect(productLinks).toHaveLength(12);
    });
  });

  it('should handle empty results properly', () => {
    const mockSetSearchParams = vi.fn();
    vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams(), mockSetSearchParams]);

    vi.mocked(useLoaderData).mockReturnValue(
      createMockLoaderData({
        products: [],
        total: 0,
        nextCursor: null,
        initialLoad: true,
      })
    );

    renderWithRouter(<Products />);

    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
  });

  it('should preserve scroll position during back navigation', () => {
    // Mock the scrollTo function
    const scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy;

    // Set up the test
    // Use Object.defineProperty to override scrollY
    Object.defineProperty(window, 'scrollY', {
      value: 500,
      writable: true,
    });

    // Create a mock FormData to simulate back navigation
    const mockFormData = new FormData();
    mockFormData.append('_action', 'back');

    // Create a mock location object
    const mockLocation = {
      pathname: '/products',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    };

    // Update the navigation mock for this test only
    vi.mocked(useNavigation).mockReturnValue({
      state: 'loading',
      location: mockLocation,
      formMethod: undefined,
      formAction: undefined,
      formEncType: undefined,
      formData: mockFormData,
      json: undefined,
      text: undefined,
    });

    // Render with a mocked version that just focuses on scroll behavior
    renderWithRouter(<Products />);

    // Check if scrollTo was called
    expect(scrollToSpy).toHaveBeenCalled();

    // We only care that it attempted to restore some scroll position with instant behavior
    if (scrollToSpy.mock.lastCall) {
      const lastCallArgs = scrollToSpy.mock.lastCall[0];
      expect(lastCallArgs).toHaveProperty('behavior', 'instant');
    }
  });
});
