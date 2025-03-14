import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { getSupabaseClient } from '~/features/supabase/client';
import { FeaturedProducts } from '../FeaturedProducts';
import { NewArrivals } from '../NewArrivals';
import type { TransformedProduct } from '~/features/products/types/product.types';

// Mock React Router
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

// Mock the getSupabaseClient to verify it's no longer used
vi.mock('~/features/supabase/client', () => ({
  getSupabaseClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
  }),
}));

describe('Component Props API Update', () => {
  const mockProducts: TransformedProduct[] = [
    {
      id: '1',
      name: 'Product 1',
      slug: 'product-1',
      description: 'Description 1',
      price: 100,
      image_url: '/image1.jpg',
      sku: 'SKU001',
      stock: 10,
      featured: true,
      created_at: new Date().toISOString(),
      hasVariants: false,
      categories: [{ id: 'cat1', name: 'Category 1' }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('NewArrivals component should accept products as props instead of using Supabase client', () => {
    render(<NewArrivals products={mockProducts} />);

    // Should render the product without using Supabase client
    expect(getSupabaseClient).not.toHaveBeenCalled();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });

  it('FeaturedProducts component should accept products as props instead of using Supabase client', () => {
    render(<FeaturedProducts products={mockProducts} />);

    // Should render the product without using Supabase client
    expect(getSupabaseClient).not.toHaveBeenCalled();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });

  it('should use products passed as props correctly', () => {
    // This test verifies that we're using the props API correctly
    render(
      <>
        <div data-testid="new-arrivals-container">
          <NewArrivals products={mockProducts} title="Test New Arrivals" />
        </div>
        <div data-testid="featured-products-container">
          <FeaturedProducts products={mockProducts} title="Test Featured Products" />
        </div>
      </>
    );

    // Both components should render their titles
    expect(screen.getByText('Test New Arrivals')).toBeInTheDocument();
    expect(screen.getByText('Test Featured Products')).toBeInTheDocument();

    // Both components should render the product
    expect(screen.getAllByText('Product 1')).toHaveLength(2);

    // Supabase client should not be used
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });
});
