import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ProductInfo } from '../ProductInfo';

describe('ProductInfo', () => {
  const mockProduct = {
    id: 'prod_123',
    name: 'Test Door Handle',
    description: 'A high-quality door handle',
    sku: 'DH-123',
    retail_price: 99.99,
    stock: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product information correctly', () => {
    render(<ProductInfo product={mockProduct} />);

    // Check all product information is displayed
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    expect(screen.getByText(`SKU: ${mockProduct.sku}`)).toBeInTheDocument();
    expect(screen.getByText(mockProduct.description)).toBeInTheDocument();
    expect(screen.getByText(`$${mockProduct.retail_price.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProduct.stock} available`)).toBeInTheDocument();
  });

  it('renders add to cart button', () => {
    render(<ProductInfo product={mockProduct} />);

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addToCartButton).toBeInTheDocument();
    expect(addToCartButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('displays correct information with zero stock', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    render(<ProductInfo product={outOfStockProduct} />);

    expect(screen.getByText('0 available')).toBeInTheDocument();
  });

  it('formats price correctly with different values', () => {
    const testCases = [
      { price: 99.99, expected: '$99.99' },
      { price: 100, expected: '$100.00' },
      { price: 9.9, expected: '$9.90' },
    ];

    testCases.forEach(({ price, expected }) => {
      const product = { ...mockProduct, retail_price: price };
      const { rerender } = render(<ProductInfo product={product} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      rerender(<></>);
    });
  });

  // Add test for button interaction
  it('handles add to cart button click', () => {
    const mockOnAddToCart = vi.fn();
    render(<ProductInfo product={mockProduct} onAddToCart={mockOnAddToCart} />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    button.click();

    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct.id);
  });
});
