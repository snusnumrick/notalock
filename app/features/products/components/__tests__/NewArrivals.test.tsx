import { render, screen } from '@testing-library/react';
import { NewArrivals } from '../NewArrivals';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { TransformedProduct } from '../../types/product.types';

// Mock the Link component from @remix-run/react
vi.mock('@remix-run/react', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useFetcher: () => ({
    submit: vi.fn(),
    state: 'idle',
    data: null,
  }),
}));

// Mock useCart hook
vi.mock('~/features/cart/hooks/useCart', () => ({
  useCart: () => ({
    cartItems: [],
    isLoading: false,
    summary: { totalItems: 0, subtotal: 0, total: 0 },
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    clearCart: vi.fn(),
    cartError: null,
    cartSuccess: false,
    isAddingToCart: false,
  }),
}));

// Mock isProductNew utility
vi.mock('~/features/products/utils/product-utils', () => ({
  isProductNew: () => false,
}));

describe('NewArrivals Component', () => {
  // Sample product data matching TransformedProduct type
  const mockProducts: TransformedProduct[] = [
    {
      id: '1',
      name: 'Test Product 1',
      slug: 'test-product-1',
      description: 'Description 1',
      price: 99.99,
      image_url: '/test1.jpg',
      sku: 'SKU001',
      stock: 10,
      featured: true,
      hasVariants: false,
      created_at: '2023-01-01T00:00:00Z',
      categories: [{ id: 'cat1', name: 'Category 1' }],
    },
    {
      id: '2',
      name: 'Test Product 2',
      slug: 'test-product-2',
      description: 'Description 2',
      price: 199.99,
      image_url: '/test2.jpg',
      sku: 'SKU002',
      stock: 5,
      featured: false,
      hasVariants: false,
      created_at: '2023-01-02T00:00:00Z',
      categories: [{ id: 'cat2', name: 'Category 2' }],
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders products correctly', () => {
    render(<NewArrivals products={mockProducts} />);

    // Check if product names are displayed
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();

    // Check if prices are displayed correctly
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$199.99')).toBeInTheDocument();

    // Check if categories are displayed
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
  });

  it('displays empty state when no products', () => {
    render(<NewArrivals products={[]} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No new arrivals available.')).toBeInTheDocument();
  });

  it('respects the limit prop', () => {
    render(<NewArrivals products={mockProducts} limit={1} />);

    // Should only show the first product
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
  });

  it('shows view all button when showViewAllButton is true', () => {
    render(<NewArrivals products={mockProducts} showViewAllButton={true} />);

    // First check the button itself
    const viewAllButton = screen.getByTestId('view-all-button');
    expect(viewAllButton).toBeInTheDocument();
    expect(viewAllButton.textContent).toContain('View All New Arrivals');

    // Then check the link URL
    const linkElement = screen.getByRole('link', { name: /View All New Arrivals/i });
    expect(linkElement).toHaveAttribute('href', '/products?sortOrder=newest');
  });

  it('hides view all button when showViewAllButton is false', () => {
    render(<NewArrivals products={mockProducts} showViewAllButton={false} />);
    expect(screen.queryByTestId('view-all-button-container')).not.toBeInTheDocument();
  });

  it('allows custom title and description', () => {
    const customTitle = 'Custom Title';
    const customDescription = 'Custom Description';

    render(
      <NewArrivals products={mockProducts} title={customTitle} description={customDescription} />
    );

    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customDescription)).toBeInTheDocument();
  });
});
