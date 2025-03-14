import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProductCard } from '../ProductCard';
import type { TransformedProduct } from '../../types/product.types';
import { CART_INDICATOR_EVENT_NAME } from '../../../cart/constants';

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

// Create mock implementation of useCart with tracking
const mockAddToCart = vi.fn();
interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
}

const mockCartItems: CartItem[] = [];

// Mock useCart hook with additional testing capabilities
vi.mock('~/features/cart/hooks/useCart', () => ({
  useCart: () => ({
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
  }),
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

// Mock the isProductNew utility
vi.mock('~/features/products/utils/product-utils', () => ({
  isProductNew: vi.fn().mockImplementation(date => {
    // For testing, we'll say any product with "new" in the name is new
    return date.includes('new');
  }),
}));

describe('ProductCard', () => {
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

  // Clear mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockCartItems
    mockCartItems.length = 0;
  });

  it('renders the product card with Add to Cart button', () => {
    render(<ProductCard product={mockProduct} index={0} />);

    // Verify product details are displayed
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('This is a test product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();

    // Verify Add to Cart button is present
    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeInTheDocument();
  });

  it('calls addToCart with correct parameters when clicked', () => {
    render(<ProductCard product={mockProduct} index={0} />);

    // Click the Add to Cart button
    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    // Verify addToCart was called with correct parameters
    expect(mockAddToCart).toHaveBeenCalledWith({
      productId: 'prod123',
      quantity: 1,
      price: 99.99,
    });
  });

  it('dispatches cart-indicator-update event when adding to cart', () => {
    // Create a spy for window.dispatchEvent
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    render(<ProductCard product={mockProduct} index={0} />);

    // Click the Add to Cart button
    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    // Verify addToCart was called
    expect(mockAddToCart).toHaveBeenCalled();

    // Verify the cart-indicator-update event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: CART_INDICATOR_EVENT_NAME,
        detail: expect.objectContaining({ count: 1 }),
      })
    );

    // Clean up spy
    dispatchEventSpy.mockRestore();
  });

  it('shows New badge for new products', () => {
    // Create a new product with "new" in the created_at field to trigger isProductNew
    const newProduct = {
      ...mockProduct,
      created_at: 'new-2023-01-01T00:00:00Z',
    };

    render(<ProductCard product={newProduct} index={0} />);

    // Check for New badge
    const newBadge = screen.getByText('New');
    expect(newBadge).toBeInTheDocument();
  });

  it('disables Add to Cart button for out-of-stock products', () => {
    // Create an out-of-stock product
    const outOfStockProduct = {
      ...mockProduct,
      stock: 0,
    };

    render(<ProductCard product={outOfStockProduct} index={0} />);

    // Check that button is disabled
    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeDisabled();
  });

  it('displays correct cart quantity for products already in cart', () => {
    // Add the product to the mock cart
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

    // Check that the button shows the current quantity
    const cartButton = screen.getByRole('button', { name: /cart \(3\)/i });
    expect(cartButton).toBeInTheDocument();
  });

  it('renders in featured variant when specified', () => {
    render(<ProductCard product={mockProduct} index={0} variant="featured" />);

    // Check for featured-specific elements
    const priceLabel = screen.getByText('Price');
    expect(priceLabel).toBeInTheDocument();
  });

  it('shows added date when showAddedDate is true', () => {
    render(<ProductCard product={mockProduct} index={0} showAddedDate={true} />);

    // Check for the added date text with a more flexible approach
    const dateElement = screen.getByText(content => {
      return content.startsWith('Added ') && content.length > 6;
    });
    expect(dateElement).toBeInTheDocument();
  });
});
