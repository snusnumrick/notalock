import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductCardWithReferrer from '../ProductCardWithReferrer';
import { storeReferringCategory } from '~/features/categories/utils/referringCategoryUtils';

// Mock lucide-react components
vi.mock('lucide-react', () => ({
  ShoppingCart: () => <span data-testid="shopping-cart-icon">Cart Icon</span>,
  Check: () => <span data-testid="check-icon">Check Icon</span>,
  ImageIcon: () => <span data-testid="image-icon">Image Icon</span>,
}));

// Mock ProductCardWithReferrer component's dependencies
vi.mock('~/features/categories/utils/categoryUtils', () => ({
  findCategoryBySlug: vi.fn().mockReturnValue(null),
}));

// Mock the ProductCard component
vi.mock('../ProductCard', () => ({
  ProductCard: ({
    product,
    index,
  }: {
    product: {
      slug: string;
      name: string;
      description: string;
      price: number;
      categories?: Array<{ id: string; name: string }>;
      image_url: string;
    };
    index: number;
  }) => {
    const loading = index < 8 ? 'eager' : 'lazy';
    return (
      <div data-testid="product-card">
        <a href={`/products/${product.slug}`} data-testid="product-link">
          {product.name}
        </a>
        <div>{product.description}</div>
        <div>${product.price.toFixed(2)}</div>
        {product.categories?.map(category => (
          <span key={category.id} data-testid="badge">
            {category.name}
          </span>
        ))}
        <img src={product.image_url} alt={product.name} loading={loading} />
      </div>
    );
  },
}));

// Mock the storeReferringCategory function
vi.mock('~/features/categories/utils/referringCategoryUtils', () => ({
  storeReferringCategory: vi.fn(),
}));

// Mock the Link component from @remix-run/react
vi.mock('@remix-run/react', () => ({
  Link: ({
    to,
    children,
    onClick,
  }: {
    to: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
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

// Mock the UI components
vi.mock('~/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardFooter: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('~/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    className,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      data-testid="add-to-cart-button"
    >
      {children}
    </button>
  ),
  buttonVariants: () => 'button-class',
}));

vi.mock('~/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-variant={variant} data-testid="badge">
      {children}
    </span>
  ),
}));

vi.mock('~/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the utils
vi.mock('~/lib/utils', () => ({
  formattedPrice: (price: number) => `$${price.toFixed(2)}`,
  cn: (...inputs: (string | undefined)[]) => inputs.join(' '),
}));

describe('ProductCardWithReferrer', () => {
  const mockProduct = {
    id: 'prod123',
    name: 'Test Product',
    slug: 'test-product',
    description: 'This is a test product description',
    price: 99.99,
    image_url: '/images/test-product.jpg',
    categories: [
      { id: 'cat1', name: 'Category 1' },
      { id: 'cat2', name: 'Category 2' },
    ],
    sku: 'SKU123',
    stock: 100,
    featured: false,
    created_at: new Date().toISOString(),
    hasVariants: false,
  };

  const mockCategory = {
    id: 'premium',
    name: 'Premium',
    slug: 'premium',
    children: [],
    position: 0,
    isActive: true,
    sortOrder: 0,
    isVisible: true,
    description: '',
    parentId: null,
    path: '',
    status: 'active',
    isHighlighted: false,
    highlightPriority: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the product card correctly', () => {
    render(<ProductCardWithReferrer product={mockProduct} index={0} />);

    // Check if product details are displayed
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('This is a test product description')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getAllByTestId('badge').length).toBe(2);
    expect(screen.getByAltText('Test Product')).toBeInTheDocument();
  });

  it('links to the correct product URL', () => {
    render(<ProductCardWithReferrer product={mockProduct} index={0} />);

    const link = screen.getByTestId('product-link');
    expect(link).toHaveAttribute('href', '/products/test-product');
  });

  it('stores referring category when clicked', () => {
    render(<ProductCardWithReferrer product={mockProduct} index={0} category={mockCategory} />);

    const card = screen.getByTestId('product-card');
    fireEvent.click(card);

    // Verify storeReferringCategory was called with the correct arguments
    expect(storeReferringCategory).toHaveBeenCalledWith({
      id: 'premium',
      name: 'Premium',
      slug: 'premium',
      path: undefined,
    });
  });

  it('does not store category if none is provided', () => {
    render(<ProductCardWithReferrer product={mockProduct} index={0} />);

    const card = screen.getByTestId('product-card');
    fireEvent.click(card);

    // Verify storeReferringCategory was not called
    expect(storeReferringCategory).not.toHaveBeenCalled();
  });

  it('handles nested category paths', () => {
    const nestedCategory = {
      ...mockCategory,
      path: '/products/category/door-handles/premium',
    };

    render(<ProductCardWithReferrer product={mockProduct} index={0} category={nestedCategory} />);

    const card = screen.getByTestId('product-card');
    fireEvent.click(card);

    // Verify storeReferringCategory was called with the path included
    expect(storeReferringCategory).toHaveBeenCalledWith({
      id: 'premium',
      name: 'Premium',
      slug: 'premium',
      path: '/products/category/door-handles/premium',
    });
  });

  it('uses eager loading for images in the first 8 products', () => {
    render(<ProductCardWithReferrer product={mockProduct} index={0} />);
    expect(screen.getByAltText('Test Product')).toHaveAttribute('loading', 'eager');

    render(<ProductCardWithReferrer product={mockProduct} index={10} />);
    expect(screen.getAllByAltText('Test Product')[1]).toHaveAttribute('loading', 'lazy');
  });
});
