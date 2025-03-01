import { render, screen, waitFor } from '@testing-library/react';
import { NewArrivals } from '../NewArrivals';
import { createClient } from '@supabase/supabase-js';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the Supabase client and its methods
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

// Properly mock the Link component and other @remix-run/react exports
vi.mock('@remix-run/react', async () => {
  return {
    Link: ({
      to,
      children,
      className,
    }: {
      to: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <a href={to} className={className} data-testid="remix-link">
        {children}
      </a>
    ),
    useNavigate: () => vi.fn(),
    // Add any other Remix exports used in the component
    Form: ({
      children,
      ...props
    }: { children: React.ReactNode } & React.FormHTMLAttributes<HTMLFormElement>) => (
      <form {...props}>{children}</form>
    ),
  };
});

describe('NewArrivals Component', () => {
  const mockSelectFn = vi.fn();
  const mockEqFn = vi.fn();
  const mockOrderFn = vi.fn();
  const mockLimitFn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Supabase mock
    mockSelectFn.mockReturnValue({ eq: mockEqFn });
    mockEqFn.mockReturnValue({ order: mockOrderFn });
    mockOrderFn.mockReturnValue({ limit: mockLimitFn });

    // Mock createClient to return our mock implementation
    (createClient as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: mockSelectFn,
      }),
    });
  });

  it('renders loading state initially', () => {
    mockLimitFn.mockResolvedValue({ data: [], error: null });

    render(
      <MemoryRouter>
        <NewArrivals supabaseUrl="https://example.com" supabaseAnonKey="anon-key" />
      </MemoryRouter>
    );

    // Check if loading skeleton is displayed (the component uses skeleton loaders, not text)
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders products when data is loaded', async () => {
    // Mock product data with proper structure
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product 1',
        description: 'Test Description 1',
        retail_price: 99.99,
        created_at: '2023-01-01T00:00:00Z',
        featured: false,
        images: [{ id: '1', url: '/test1.jpg', is_primary: true }],
        categories: [{ category: { id: 'cat1', name: 'Category 1' } }],
      },
      {
        id: '2',
        name: 'Test Product 2',
        description: 'Test Description 2',
        retail_price: 149.99,
        created_at: '2023-01-02T00:00:00Z',
        featured: false,
        images: [{ id: '2', url: '/test2.jpg', is_primary: true }],
        categories: [{ category: { id: 'cat2', name: 'Category 2' } }],
      },
    ];

    // Mock the Supabase response with the product data
    mockLimitFn.mockResolvedValue({
      data: mockProducts,
      error: null,
    });

    // Render the component
    render(
      <MemoryRouter>
        <NewArrivals supabaseUrl="https://example.com" supabaseAnonKey="anon-key" />
      </MemoryRouter>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Debug the rendered HTML (uncomment if needed)
    // screen.debug();

    // Look for product title in CardTitle component
    const cardTitles = screen.getAllByText(/Test Product \d/i);
    expect(cardTitles.length).toBeGreaterThan(0);

    // Verify section title
    expect(screen.getByText('New Arrivals')).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    // Mock error response
    mockLimitFn.mockResolvedValue({ data: null, error: new Error('Failed to fetch') });

    render(
      <MemoryRouter>
        <NewArrivals supabaseUrl="https://example.com" supabaseAnonKey="anon-key" />
      </MemoryRouter>
    );

    // Wait for error message to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to load new arrivals/i)).toBeInTheDocument();
    });

    // Use a more specific selector for the button
    const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
    expect(tryAgainButton).toBeInTheDocument();
  });

  it('renders empty state when no products returned', async () => {
    // Mock empty response
    mockLimitFn.mockResolvedValue({ data: [], error: null });

    render(
      <MemoryRouter>
        <NewArrivals supabaseUrl="https://example.com" supabaseAnonKey="anon-key" />
      </MemoryRouter>
    );

    // Initial loading state should show skeleton
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();

    // After loading, should show empty state message
    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Check for empty state message
    expect(screen.getByText(/No new products available/i)).toBeInTheDocument();

    // Check that title in empty state is correct
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('New Arrivals');
  });

  it('correctly calls Supabase with expected parameters', async () => {
    mockLimitFn.mockResolvedValue({ data: [], error: null });

    render(
      <MemoryRouter>
        <NewArrivals supabaseUrl="https://example.com" supabaseAnonKey="anon-key" />
      </MemoryRouter>
    );

    // Verify the correct Supabase calls were made
    expect(createClient).toHaveBeenCalledWith('https://example.com', 'anon-key');
    expect(mockSelectFn).toHaveBeenCalled();
    expect(mockEqFn).toHaveBeenCalledWith('is_active', true);
    expect(mockOrderFn).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mockLimitFn).toHaveBeenCalledWith(4); // Default limit
  });

  it('uses custom limit when provided', async () => {
    mockLimitFn.mockResolvedValue({ data: [], error: null });

    render(
      <MemoryRouter>
        <NewArrivals supabaseUrl="https://example.com" supabaseAnonKey="anon-key" limit={6} />
      </MemoryRouter>
    );

    expect(mockLimitFn).toHaveBeenCalledWith(6);
  });

  it('hides view all button when showViewAllButton is false', async () => {
    // Mock product data with proper structure
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product 1',
        description: 'Test Description 1',
        retail_price: 99.99,
        created_at: '2023-01-01T00:00:00Z',
        featured: false,
        images: [{ id: '1', url: '/test1.jpg', is_primary: true }],
        categories: [{ category: { id: 'cat1', name: 'Category 1' } }],
      },
    ];

    mockLimitFn.mockResolvedValue({ data: mockProducts, error: null });

    render(
      <MemoryRouter>
        <NewArrivals
          supabaseUrl="https://example.com"
          supabaseAnonKey="anon-key"
          showViewAllButton={false}
        />
      </MemoryRouter>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Check that product titles appear
    const cardTitles = screen.getAllByText(/Test Product \d/i);
    expect(cardTitles.length).toBeGreaterThan(0);

    // Verify view all button is not present
    expect(screen.queryByText('View All New Arrivals')).not.toBeInTheDocument();
  });

  it('displays custom title and description when provided', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Test Product 1',
        description: 'Test Description 1',
        retail_price: 99.99,
        created_at: '2023-01-01T00:00:00Z',
        featured: false,
        images: [{ id: '1', url: '/test1.jpg', is_primary: true }],
        categories: [{ category: { id: 'cat1', name: 'Category 1' } }],
      },
    ];

    mockLimitFn.mockResolvedValue({ data: mockProducts, error: null });

    render(
      <MemoryRouter>
        <NewArrivals
          supabaseUrl="https://example.com"
          supabaseAnonKey="anon-key"
          title="Latest Products"
          description="Our newest additions"
        />
      </MemoryRouter>
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Check that custom title and description appear
    expect(screen.getByText('Latest Products')).toBeInTheDocument();
    expect(screen.getByText('Our newest additions')).toBeInTheDocument();
  });
});
