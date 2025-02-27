import { render, screen, waitFor } from '@testing-library/react';
import { FeaturedProducts } from '../FeaturedProducts';
import { createClient } from '@supabase/supabase-js';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock Remix components
vi.mock('@remix-run/react', async () => {
  const actual = await vi.importActual('@remix-run/react');
  return {
    ...actual,
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
    useNavigate: () => mockNavigate,
  };
});

// Mock shadcn components
vi.mock('~/components/ui/card', () => ({
  Card: ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div role="article" className={className} data-testid="card">
      {children}
    </div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-footer">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-title">{children}</div>
  ),
}));

vi.mock('~/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <div role="status">{children}</div>,
}));

vi.mock('~/components/ui/button', () => ({
  Button: ({
    onClick,
    children,
  }: {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    children: React.ReactNode;
  }) => (
    <button onClick={onClick} type="button">
      {children}
    </button>
  ),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ShoppingCart: ({ className }: { className?: string }) => (
    <span className={className} data-testid="shopping-cart-icon">
      ShoppingCart
    </span>
  ),
  ImageIcon: ({ className }: { className?: string }) => (
    <span className={className} data-testid="image-icon">
      ImageIcon
    </span>
  ),
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

// Mock navigate function
const mockNavigate = vi.fn();

describe('FeaturedProducts', () => {
  const mockSupabaseUrl = 'http://localhost:54321';
  const mockSupabaseKey = 'test-key';

  // Mock data for successful response
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'Test Description',
    retail_price: 99.99,
    featured: true,
    images: [{ id: 'img1', url: 'test.jpg', is_primary: true }],
    categories: [{ category: [{ id: 'cat1', name: 'Category 1' }] }],
  };

  // Supabase query builder mock
  const createQueryBuilder = (result: { data: any; error: any }) => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Loading', () => {
    it('shows loading state initially', () => {
      const mockClient = createQueryBuilder({ data: [], error: null });
      vi.mocked(createClient).mockReturnValue(mockClient as any);

      render(<FeaturedProducts supabaseUrl={mockSupabaseUrl} supabaseAnonKey={mockSupabaseKey} />);

      // Check for loading skeleton cards
      const loadingCards = screen.getAllByRole('article');
      expect(loadingCards).toHaveLength(4);
      expect(loadingCards[0]).toHaveClass('animate-pulse');
    });

    it('displays products after successful load', async () => {
      const mockClient = createQueryBuilder({
        data: [mockProduct],
        error: null,
      });
      vi.mocked(createClient).mockReturnValue(mockClient as any);

      render(<FeaturedProducts supabaseUrl={mockSupabaseUrl} supabaseAnonKey={mockSupabaseKey} />);

      // Wait for product card to appear
      const productTitle = await screen.findByTestId('card-title');
      expect(productTitle).toHaveTextContent('Test Product');

      // Verify product details
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Category 1');
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message and retry button on load failure', async () => {
      const mockClient = createQueryBuilder({
        data: null,
        error: new Error('Failed to fetch'),
      });
      vi.mocked(createClient).mockReturnValue(mockClient as any);

      render(<FeaturedProducts supabaseUrl={mockSupabaseUrl} supabaseAnonKey={mockSupabaseKey} />);

      // Error message should appear
      const errorMessage = await screen.findByText(/Failed to load featured products/);
      expect(errorMessage).toBeInTheDocument();

      // Test retry functionality
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      // Setup mock for retry
      const successMock = createQueryBuilder({ data: [mockProduct], error: null });
      vi.mocked(createClient).mockReturnValue(successMock as any);

      // Click retry
      await userEvent.click(retryButton);

      // Verify product appears after retry
      const productTitle = await screen.findByTestId('card-title');
      expect(productTitle).toHaveTextContent('Test Product');
    });

    it('redirects to login on JWT error', async () => {
      const mockClient = createQueryBuilder({
        data: null,
        error: new Error('JWT expired'),
      });
      vi.mocked(createClient).mockReturnValue(mockClient as any);

      render(<FeaturedProducts supabaseUrl={mockSupabaseUrl} supabaseAnonKey={mockSupabaseKey} />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
      });
    });
  });

  describe('Data Validation', () => {
    it('handles products with missing category data', async () => {
      const productWithMissingCategories = {
        ...mockProduct,
        categories: [
          { category: [] }, // Empty category array
          { category: null }, // Null category
          { category: [{ id: '1', name: 'Valid Category' }] }, // Valid category
        ],
      };

      const mockClient = createQueryBuilder({
        data: [productWithMissingCategories],
        error: null,
      });
      vi.mocked(createClient).mockReturnValue(mockClient as any);

      render(<FeaturedProducts supabaseUrl={mockSupabaseUrl} supabaseAnonKey={mockSupabaseKey} />);

      // Should only show valid category
      const category = await screen.findByRole('status');
      expect(category).toHaveTextContent('Valid Category');
      expect(screen.queryAllByRole('status')).toHaveLength(1);
    });

    it('handles products with missing images', async () => {
      const productWithoutImages = {
        ...mockProduct,
        images: [], // Empty images array
      };

      const mockClient = createQueryBuilder({
        data: [productWithoutImages],
        error: null,
      });
      vi.mocked(createClient).mockReturnValue(mockClient as any);

      render(<FeaturedProducts supabaseUrl={mockSupabaseUrl} supabaseAnonKey={mockSupabaseKey} />);

      // Look for the ImageIcon instead of the text "No image"
      const imageIcon = await screen.findByTestId('image-icon');
      expect(imageIcon).toBeInTheDocument();
    });
  });
});
