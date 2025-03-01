// app/features/products/components/__tests__/RelatedProducts.test.tsx
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RelatedProducts } from '~/features/products/components/RelatedProducts';

// Mock the Link component from Remix
vi.mock('@remix-run/react', () => ({
  Link: vi.fn().mockImplementation(({ to, children, className }) => (
    <a href={to} className={className} data-testid="product-link">
      {children}
    </a>
  )),
}));

describe('RelatedProducts Component', () => {
  // Mock product data
  const mockProducts = [
    {
      id: 'prod-1',
      name: 'Related Product 1',
      retail_price: 99.99,
      thumbnail_url: '/thumbnail1.jpg',
    },
    {
      id: 'prod-2',
      name: 'Related Product 2',
      retail_price: 149.99,
      thumbnail_url: '/thumbnail2.jpg',
    },
    {
      id: 'prod-3',
      name: 'Related Product 3',
      retail_price: 79.99,
      thumbnail_url: null,
    },
    {
      id: 'prod-4',
      name: 'Related Product 4',
      retail_price: null,
      thumbnail_url: '/thumbnail4.jpg',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the related products section with title', () => {
    render(<RelatedProducts products={mockProducts} />);

    // Section title should be visible
    expect(screen.getByText('Related Products')).toBeInTheDocument();

    // All product names should be visible
    expect(screen.getByText('Related Product 1')).toBeInTheDocument();
    expect(screen.getByText('Related Product 2')).toBeInTheDocument();
    expect(screen.getByText('Related Product 3')).toBeInTheDocument();
    expect(screen.getByText('Related Product 4')).toBeInTheDocument();
  });

  it('renders product prices correctly', () => {
    render(<RelatedProducts products={mockProducts} />);

    // Products with prices should show them
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toBeInTheDocument();
    expect(screen.getByText('$79.99')).toBeInTheDocument();

    // Product with null price should show $N/A
    expect(screen.getByText('$N/A')).toBeInTheDocument();
  });

  it('renders product images correctly', () => {
    render(<RelatedProducts products={mockProducts} />);

    // Get all product image elements
    const images = screen.getAllByRole('img');

    // Should have 3 images (3 products with thumbnails)
    expect(images).toHaveLength(3);

    // Check image sources
    expect(images[0]).toHaveAttribute('src', '/thumbnail1.jpg');
    expect(images[1]).toHaveAttribute('src', '/thumbnail2.jpg');
    expect(images[2]).toHaveAttribute('src', '/thumbnail4.jpg');
  });

  it('shows placeholder for products without images', () => {
    render(<RelatedProducts products={mockProducts} />);

    // Should have a "No Image" placeholder
    expect(screen.getByText('No Image')).toBeInTheDocument();
  });

  it('creates links to product detail pages', () => {
    render(<RelatedProducts products={mockProducts} />);

    // All products should be links
    const links = screen.getAllByTestId('product-link');
    expect(links).toHaveLength(4);

    // Check link destinations
    expect(links[0]).toHaveAttribute('href', '/products/prod-1');
    expect(links[1]).toHaveAttribute('href', '/products/prod-2');
    expect(links[2]).toHaveAttribute('href', '/products/prod-3');
    expect(links[3]).toHaveAttribute('href', '/products/prod-4');

    // Verify that each link is within a list item
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(4);
  });

  it('accepts and uses a custom title', () => {
    render(<RelatedProducts products={mockProducts} title="You May Also Like" />);

    // Custom title should be used
    expect(screen.getByText('You May Also Like')).toBeInTheDocument();
  });

  it('renders nothing when products array is empty', () => {
    const { container } = render(<RelatedProducts products={[]} />);

    // Component should not render anything
    expect(container).toBeEmptyDOMElement();
  });

  it('uses correct layout grid classes for different screen sizes', () => {
    render(<RelatedProducts products={mockProducts} />);

    // Check the container has the correct grid classes
    // Now we can use getByRole since we've updated the component to use proper list semantics
    const gridContainer = screen.getByRole('list');
    expect(gridContainer).toHaveClass('grid');
    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('sm:grid-cols-2');
    expect(gridContainer).toHaveClass('lg:grid-cols-4');
  });

  it('adds hover effect to product images', () => {
    render(<RelatedProducts products={mockProducts} />);

    // Images should have hover effect class
    const productLinks = screen.getAllByTestId('product-link');

    // Each link should have the group class for hover effects
    productLinks.forEach(link => {
      expect(link).toHaveClass('group');
    });

    // Images should have hover opacity class
    const images = screen.getAllByRole('img');
    images.forEach(img => {
      expect(img).toHaveClass('group-hover:opacity-75');
    });
  });
});
