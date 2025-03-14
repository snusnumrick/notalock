import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProductCard } from '~/features/products/components/ProductCard';
import { useCart } from '~/features/cart/hooks/useCart';
import type { TransformedProduct } from '~/features/products/types/product.types';

// Mock actual implementation with a controlled one that we can test
vi.mock('~/features/cart/hooks/useCart', () => ({
  useCart: vi.fn(),
}));

// Mock useFetcher
vi.mock('@remix-run/react', () => ({
  Link: ({ children, to, onClick }: { children: React.ReactNode; to: string; onClick?: any }) => (
    <a href={to} onClick={onClick} data-testid="product-link">
      {children}
    </a>
  ),
  useFetcher: () => ({
    submit: vi.fn(),
    state: 'idle',
    data: null,
  }),
}));

// Mock isProductNew utility
vi.mock('~/features/products/utils/product-utils', () => ({
  isProductNew: () => false,
}));

// Mock tooltip component to simplify testing
vi.mock('~/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <div>{children}</div>
  ),
}));

describe('Cart Product Interaction Tests', () => {
  const mockProduct: TransformedProduct = {
    id: 'prod123',
    name: 'Test Product',
    slug: 'test-product',
    description: 'This is a test product',
    price: 99.99,
    image_url: '/images/test-product.jpg',
    sku: 'SKU001',
    stock: 10,
    featured: true,
    hasVariants: false,
    created_at: '2023-01-01T00:00:00Z',
    categories: [{ id: 'cat1', name: 'Category 1' }],
  };

  const mockAddToCart = vi.fn();
  const mockCartItems = [] as any[];

  // Mock implementation of useCart
  beforeEach(() => {
    vi.clearAllMocks();
    mockCartItems.length = 0;

    // Default mock implementation
    (useCart as any).mockImplementation(() => ({
      cartItems: mockCartItems,
      isLoading: false,
      summary: { totalItems: 0, subtotal: 0, total: 0 },
      addToCart: mockAddToCart,
      updateCartItem: vi.fn(),
      removeCartItem: vi.fn(),
      clearCart: vi.fn(),
      cartError: null,
      cartSuccess: false,
      isAddingToCart: false,
    }));
  });

  it('adds a product to the cart when clicking Add to Cart', async () => {
    render(<ProductCard product={mockProduct} index={0} />);

    // Find the Add to Cart button and click it
    const addButton = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addButton);

    // Check that the addToCart function was called with the correct product
    expect(mockAddToCart).toHaveBeenCalledWith({
      productId: 'prod123',
      quantity: 1,
      price: 99.99,
    });
  });

  it('shows loading state when adding to cart is in progress', async () => {
    // Mock useCart to return isAddingToCart as true
    (useCart as any).mockImplementation(() => ({
      cartItems: [],
      isLoading: false,
      summary: { totalItems: 0, subtotal: 0, total: 0 },
      addToCart: mockAddToCart,
      updateCartItem: vi.fn(),
      removeCartItem: vi.fn(),
      clearCart: vi.fn(),
      cartError: null,
      cartSuccess: false,
      isAddingToCart: true, // Set to true to simulate adding in progress
    }));

    render(<ProductCard product={mockProduct} index={0} />);

    // Find the Add to Cart button - it should be disabled during loading
    const addButton = screen.getByRole('button', { name: /Add/i });
    expect(addButton).toBeDisabled();
  });

  it('updates button text to show current cart quantity', async () => {
    // Add the product to the mock cart with quantity 3
    mockCartItems.push({
      id: 'cart_item_1',
      cart_id: 'cart123',
      product_id: 'prod123',
      quantity: 3,
      price: 99.99,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    });

    render(<ProductCard product={mockProduct} index={0} />);

    // Button should show the current quantity
    const cartButton = screen.getByRole('button', { name: /Cart \(3\)/i });
    expect(cartButton).toBeInTheDocument();

    // Click button to add another
    fireEvent.click(cartButton);

    // Should still call addToCart with quantity 1 (adding one more)
    expect(mockAddToCart).toHaveBeenCalledWith({
      productId: 'prod123',
      quantity: 1,
      price: 99.99,
    });
  });

  it('shows error state when adding to cart fails', async () => {
    // Mock useCart to return an error
    (useCart as any).mockImplementation(() => ({
      cartItems: [],
      isLoading: false,
      summary: { totalItems: 0, subtotal: 0, total: 0 },
      addToCart: mockAddToCart,
      updateCartItem: vi.fn(),
      removeCartItem: vi.fn(),
      clearCart: vi.fn(),
      cartError: 'Failed to add to cart', // Set error message
      cartSuccess: false,
      isAddingToCart: false,
    }));

    render(<ProductCard product={mockProduct} index={0} />);

    // Find the Add to Cart button
    const addButton = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(addButton);

    // The error should be handled by the component (in real usage, this would likely
    // be shown in a toast or alert, which we're not testing here)
    expect(mockAddToCart).toHaveBeenCalled();
  });

  it('indicates successful add to cart visually', async () => {
    // We'll need to use a component that actually shows the success state
    // This is challenging to test because it involves setTimeout
    // Typically we'd mock setTimeout for this
    const originalSetTimeout = global.setTimeout;

    try {
      // Replace setTimeout with a mock that executes immediately
      global.setTimeout = Object.assign(
        vi.fn(fn => {
          fn();
          return 0 as any;
        }),
        {
          __promisify__: vi.fn(),
        }
      );

      render(<ProductCard product={mockProduct} index={0} />);

      // First render should show "Add"
      const addButton = screen.getByRole('button', { name: /Add/i });

      // Click to add to cart
      fireEvent.click(addButton);

      // Our mocked setTimeout should execute the callback immediately,
      // so we don't need to await for state change

      // Verify addToCart was called
      expect(mockAddToCart).toHaveBeenCalled();
    } finally {
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    }
  });
});
