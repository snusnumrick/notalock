import { render, screen } from '@testing-library/react';
import { FeaturedProducts } from '../FeaturedProducts';
import { vi, describe, it, expect } from 'vitest';
import type { TransformedProduct } from '~/features/products/types/product.types';

// Mock the ProductCard component
vi.mock('../ProductCard', () => ({
  ProductCard: ({ product }: { product: TransformedProduct }) => (
    <div data-testid="card">
      <div data-testid="card-header">
        <a href={`/products/${product.slug}`} data-testid="remix-link">
          {product.name}
        </a>
      </div>
      <div data-testid="card-content">
        <div>{product.description}</div>
        {product.categories?.map(cat => (
          <div key={cat.id} role="status">
            {cat.name}
          </div>
        ))}
      </div>
      <div data-testid="card-footer">
        <div>
          <span>Price</span>
          <div>${product.price.toFixed(2)}</div>
        </div>
        <button data-testid="button">
          <span data-testid="shopping-cart-icon">ShoppingCart</span>
          Add
        </button>
      </div>
      {!product.image_url && <span data-testid="image-icon">ImageIcon</span>}
    </div>
  ),
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

// Mock Remix components
vi.mock('@remix-run/react', () => ({
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
  useFetcher: () => ({
    submit: vi.fn(),
    state: 'idle',
    data: null,
  }),
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

describe('FeaturedProducts', () => {
  // Sample product data matching TransformedProduct type
  const mockProducts: TransformedProduct[] = [
    {
      id: '1',
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test Description',
      price: 99.99,
      image_url: 'test.jpg',
      sku: 'SKU001',
      stock: 10,
      featured: true,
      hasVariants: false,
      created_at: '2023-01-01T00:00:00Z',
      categories: [{ id: 'cat1', name: 'Category 1' }],
    },
    {
      id: '2',
      name: 'Another Product',
      slug: 'another-product',
      description: 'Another Description',
      price: 149.99,
      image_url: '',
      sku: 'SKU002',
      stock: 5,
      featured: true,
      hasVariants: false,
      created_at: '2023-01-02T00:00:00Z',
      categories: [{ id: 'cat2', name: 'Category 2' }],
    },
  ];

  describe('Rendering', () => {
    it('renders products correctly', () => {
      render(<FeaturedProducts products={mockProducts} />);

      // Verify product details
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Another Product')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Another Description')).toBeInTheDocument();

      // Check prices
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('$149.99')).toBeInTheDocument();

      // Check categories
      expect(screen.getByText('Category 1')).toBeInTheDocument();
      expect(screen.getByText('Category 2')).toBeInTheDocument();
    });

    it('displays empty state when no products', () => {
      render(<FeaturedProducts products={[]} />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No featured products available.')).toBeInTheDocument();
    });

    it('handles products with missing images', () => {
      // Product at index 1 has no image_url
      render(<FeaturedProducts products={mockProducts} />);

      // Should render placeholder image icon
      const imageIcons = screen.getAllByTestId('image-icon');
      expect(imageIcons).toHaveLength(1); // One product has no image
    });

    it('allows custom title and description', () => {
      const customTitle = 'Special Featured Products';
      const customDescription = 'Our hand-picked selection';

      render(
        <FeaturedProducts
          products={mockProducts}
          title={customTitle}
          description={customDescription}
        />
      );

      expect(screen.getByText(customTitle)).toBeInTheDocument();
      expect(screen.getByText(customDescription)).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('has correct links to product pages', () => {
      render(<FeaturedProducts products={mockProducts} />);

      // Get card links
      const productLinks = screen.getAllByTestId('remix-link');

      // Find links by their href attribute
      const testProductLink = productLinks.find(
        link => link.getAttribute('href') === '/products/test-product'
      );
      const anotherProductLink = productLinks.find(
        link => link.getAttribute('href') === '/products/another-product'
      );

      // Check that links exist and point to correct product pages
      expect(testProductLink).toHaveAttribute('href', '/products/test-product');
      expect(anotherProductLink).toHaveAttribute('href', '/products/another-product');
    });

    it('displays proper product card layout', () => {
      render(<FeaturedProducts products={[mockProducts[0]]} />);

      // Check for card structure
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
      expect(screen.getByTestId('card-footer')).toBeInTheDocument();

      // Check for price label
      expect(screen.getByText('Price')).toBeInTheDocument();

      // Check for cart icon and button
      expect(screen.getByTestId('shopping-cart-icon')).toBeInTheDocument();
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });
  });
});
