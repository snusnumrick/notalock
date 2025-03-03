import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductCardWithReferrer from '../ProductCardWithReferrer';
import { storeReferringCategory } from '~/features/categories/utils/referringCategoryUtils';

// Mock ProductCardWithReferrer component's dependencies
vi.mock('~/features/categories/utils/categoryUtils', () => ({
  findCategoryBySlug: vi.fn().mockReturnValue(null),
}));

// Mock the storeReferringCategory function
vi.mock('~/features/categories/utils/referringCategoryUtils', () => ({
  storeReferringCategory: vi.fn(),
}));

// Mock the Link component from @remix-run/react
vi.mock('@remix-run/react', () => ({
  Link: ({ to, children, onClick }) => (
    <a href={to} onClick={onClick} data-testid="product-link">
      {children}
    </a>
  ),
}));

// Mock the UI components
vi.mock('~/components/ui/card', () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }) => <div className={className}>{children}</div>,
  CardFooter: ({ children, className }) => <div className={className}>{children}</div>,
}));

vi.mock('~/components/ui/badge', () => ({
  Badge: ({ children, variant }) => (
    <span data-variant={variant} data-testid="badge">
      {children}
    </span>
  ),
}));

// Mock the formattedPrice utility
vi.mock('~/lib/utils', () => ({
  formattedPrice: price => `$${price.toFixed(2)}`,
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
  };

  const mockCategory = {
    id: 'premium',
    name: 'Premium',
    slug: 'premium',
    children: [],
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

    const link = screen.getByTestId('product-link');
    fireEvent.click(link);

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

    const link = screen.getByTestId('product-link');
    fireEvent.click(link);

    // Verify storeReferringCategory was not called
    expect(storeReferringCategory).not.toHaveBeenCalled();
  });

  it('handles nested category paths', () => {
    const nestedCategory = {
      ...mockCategory,
      path: '/products/category/door-handles/premium',
    };

    render(<ProductCardWithReferrer product={mockProduct} index={0} category={nestedCategory} />);

    const link = screen.getByTestId('product-link');
    fireEvent.click(link);

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
