// app/features/products/components/__tests__/ProductVariantSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProductVariantSelector } from '~/features/products/components/ProductVariantSelector';

describe('ProductVariantSelector Component', () => {
  // Mock variant data
  const mockVariants = [
    {
      id: 'var-1',
      product_id: 'prod-1',
      name: 'Small',
      type: 'Size',
      price_adjustment: 0,
      is_active: true,
    },
    {
      id: 'var-2',
      product_id: 'prod-1',
      name: 'Medium',
      type: 'Size',
      price_adjustment: 5,
      is_active: true,
    },
    {
      id: 'var-3',
      product_id: 'prod-1',
      name: 'Black',
      type: 'Color',
      price_adjustment: 0,
      is_active: true,
    },
    {
      id: 'var-4',
      product_id: 'prod-1',
      name: 'White',
      type: 'Color',
      price_adjustment: 2.5,
      is_active: true,
    },
  ];

  // Mock callback function
  const mockOnVariantChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders variant selector with groups by type', () => {
    render(
      <ProductVariantSelector variants={mockVariants} onVariantChange={mockOnVariantChange} />
    );

    // Title should be shown
    expect(screen.getByText('Variants')).toBeInTheDocument();

    // Should group by types
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();

    // All variant options should be shown
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Black')).toBeInTheDocument();
    expect(screen.getByText('White')).toBeInTheDocument();

    // Price adjustments should be shown for variants with non-zero adjustments
    expect(screen.getByText('(+$5.00)')).toBeInTheDocument();
    expect(screen.getByText('(+$2.50)')).toBeInTheDocument();
  });

  it('selects first variant by default', () => {
    render(
      <ProductVariantSelector variants={mockVariants} onVariantChange={mockOnVariantChange} />
    );

    // First variant should be selected by default
    const smallButton = screen.getByTestId('variant-button-var-1');
    expect(smallButton).toHaveClass('border-blue-500');

    // Other variants should not be selected
    const mediumButton = screen.getByTestId('variant-button-var-2');
    expect(mediumButton).not.toHaveClass('border-blue-500');
  });

  it('calls onVariantChange when a variant is selected', () => {
    render(
      <ProductVariantSelector variants={mockVariants} onVariantChange={mockOnVariantChange} />
    );

    // Click the Medium variant
    const mediumButton = screen.getByTestId('variant-button-var-2');
    fireEvent.click(mediumButton);

    // onVariantChange should be called with the variant ID
    expect(mockOnVariantChange).toHaveBeenCalledWith('var-2');

    // Medium should now have the selected class
    expect(mediumButton).toHaveClass('border-blue-500');

    // Small should no longer be selected
    const smallButton = screen.getByTestId('variant-button-var-1');
    expect(smallButton).not.toHaveClass('border-blue-500');
  });

  it('handles multiple variant selections', () => {
    render(
      <ProductVariantSelector variants={mockVariants} onVariantChange={mockOnVariantChange} />
    );

    // First select Medium
    const mediumButton = screen.getByTestId('variant-button-var-2');
    fireEvent.click(mediumButton);
    expect(mockOnVariantChange).toHaveBeenCalledWith('var-2');

    // Then select White
    const whiteButton = screen.getByTestId('variant-button-var-4');
    fireEvent.click(whiteButton);
    expect(mockOnVariantChange).toHaveBeenCalledWith('var-4');
  });

  it('renders nothing when no variants are provided', () => {
    const { container } = render(
      <ProductVariantSelector variants={[]} onVariantChange={mockOnVariantChange} />
    );

    // Component should not render anything
    expect(container).toBeEmptyDOMElement();
  });

  it('handles variants without a type specified', () => {
    // Mock variants without type
    const variantsWithoutType = [
      {
        id: 'var-1',
        product_id: 'prod-1',
        name: 'Option A',
        price_adjustment: 0,
        is_active: true,
      },
      {
        id: 'var-2',
        product_id: 'prod-1',
        name: 'Option B',
        price_adjustment: 5,
        is_active: true,
      },
    ];

    render(
      <ProductVariantSelector
        variants={variantsWithoutType}
        onVariantChange={mockOnVariantChange}
      />
    );

    // Should group under "Options" by default
    expect(screen.getByText('Options')).toBeInTheDocument();

    // Variants should be shown
    expect(screen.getByTestId('variant-name-var-1')).toHaveTextContent('Option A');
    expect(screen.getByTestId('variant-name-var-2')).toHaveTextContent('Option B');
  });

  it('handles a mix of typed and untyped variants', () => {
    // Mix of variants with and without types
    const mixedVariants = [
      {
        id: 'var-1',
        product_id: 'prod-1',
        name: 'Option A',
        price_adjustment: 0,
        is_active: true,
      },
      {
        id: 'var-2',
        product_id: 'prod-1',
        name: 'Small',
        type: 'Size',
        price_adjustment: 5,
        is_active: true,
      },
    ];

    render(
      <ProductVariantSelector variants={mixedVariants} onVariantChange={mockOnVariantChange} />
    );

    // Should have both type groups
    expect(screen.getByText('Options')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();

    // Both variants should be shown
    expect(screen.getByTestId('variant-name-var-1')).toHaveTextContent('Option A');
    expect(screen.getByTestId('variant-name-var-2')).toHaveTextContent('Small');
  });
});
