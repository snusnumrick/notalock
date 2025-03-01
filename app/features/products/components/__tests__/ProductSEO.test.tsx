// app/features/products/components/__tests__/ProductSEO.test.tsx
import { describe, it, expect } from 'vitest';
import { generateProductMeta } from '~/features/products/components/ProductSEO';
import type { Product, ProductImage } from '~/features/products/types/product.types';

describe('ProductSEO Component', () => {
  // Mock product data with images

  const mockProduct: Product & { images: ProductImage[] } = {
    id: 'product-1',
    name: 'Test Door Handle',
    sku: 'DH-123',
    description: 'Premium designer door handle with modern finish',
    retail_price: 99.99,
    business_price: 89.99,
    stock: 10,
    is_active: true,
    created_at: '2023-01-01',
    manufacturer: 'Notalock Premium',
    image_url: 'https://example.com/image1.jpg',
    images: [
      {
        id: 'img-1',
        product_id: 'product-1',
        url: 'https://example.com/image1.jpg',
        storage_path: '/products/image1.jpg',
        file_name: 'image1.jpg',
        is_primary: true,
        sort_order: 1,
        created_at: '2023-01-01',
      },
      {
        id: 'img-2',
        product_id: 'product-1',
        url: 'https://example.com/image2.jpg',
        storage_path: '/products/image2.jpg',
        file_name: 'image2.jpg',
        is_primary: false,
        sort_order: 2,
        created_at: '2023-01-01',
      },
    ],
  };

  // Mock product without description or price
  const mockIncompleteProduct: Product & { images: ProductImage[] } = {
    id: 'product-2',
    name: 'Another Handle',
    sku: 'DH-456',
    description: null,
    retail_price: null,
    business_price: null,
    stock: 5,
    is_active: true,
    created_at: '2023-01-01',
    image_url: 'https://example.com/image3.jpg',
    images: [
      {
        id: 'img-3',
        product_id: 'product-2',
        url: 'https://example.com/image3.jpg',
        storage_path: '/products/image3.jpg',
        file_name: 'image3.jpg',
        is_primary: false,
        sort_order: 1,
        created_at: '2023-01-01',
      },
    ],
  };

  // Mock product with no images
  const mockNoImagesProduct: Product & { images: ProductImage[] } = {
    id: 'product-3',
    name: 'No Image Handle',
    sku: 'DH-789',
    description: 'Handle without images',
    retail_price: 79.99,
    business_price: 69.99,
    stock: 15,
    is_active: true,
    created_at: '2023-01-01',
    image_url: null,
    images: [],
  };

  it('generates basic meta tags correctly', () => {
    // Generate meta
    const meta = generateProductMeta(mockProduct);

    // First result in the array contains the meta tags
    const metaTags = meta[0] as Record<string, string>;

    // Basic meta should be correct
    expect(metaTags.title).toBe('Test Door Handle | Notalock Door Hardware');
    expect(metaTags.description).toBe('Premium designer door handle with modern finish');
  });

  it('generates OpenGraph tags for sharing', () => {
    // Generate meta
    const meta = generateProductMeta(mockProduct);
    const metaTags = meta[0] as Record<string, string>;

    // Check OpenGraph tags
    expect(metaTags['og:title']).toBe('Test Door Handle | Notalock Door Hardware');
    expect(metaTags['og:description']).toBe('Premium designer door handle with modern finish');
    expect(metaTags['og:type']).toBe('product');
    expect(metaTags['og:url']).toBe('https://notalock.com/products/product-1');
    expect(metaTags['og:image']).toBe('https://example.com/image1.jpg');
    expect(metaTags['og:site_name']).toBe('Notalock');
  });

  it('generates Twitter Card tags', () => {
    // Generate meta
    const meta = generateProductMeta(mockProduct);
    const metaTags = meta[0] as Record<string, string>;

    // Check Twitter tags
    expect(metaTags['twitter:card']).toBe('product');
    expect(metaTags['twitter:title']).toBe('Test Door Handle | Notalock Door Hardware');
    expect(metaTags['twitter:description']).toBe('Premium designer door handle with modern finish');
    expect(metaTags['twitter:image']).toBe('https://example.com/image1.jpg');
    expect(metaTags['twitter:label1']).toBe('Price');
    expect(metaTags['twitter:data1']).toBe('99.99 USD');
    expect(metaTags['twitter:label2']).toBe('SKU');
    expect(metaTags['twitter:data2']).toBe('DH-123');
  });

  it('generates JSON-LD structured data for search engines', () => {
    // Generate meta
    const meta = generateProductMeta(mockProduct);
    const metaTags = meta[0] as Record<string, string>;

    // Check structured data
    const structuredData = JSON.parse(metaTags['script:ld+json']);

    expect(structuredData['@context']).toBe('https://schema.org/');
    expect(structuredData['@type']).toBe('Product');
    expect(structuredData.name).toBe('Test Door Handle');
    expect(structuredData.sku).toBe('DH-123');
    expect(structuredData.image).toBe('https://example.com/image1.jpg');
    expect(structuredData.description).toBe('Premium designer door handle with modern finish');

    // Check offer data
    expect(structuredData.offers['@type']).toBe('Offer');
    expect(structuredData.offers.price).toBe(99.99);
    expect(structuredData.offers.availability).toBe('https://schema.org/InStock');

    // Check manufacturer/brand
    expect(structuredData.brand.name).toBe('Notalock Premium');
  });

  it('handles products without primary images correctly', () => {
    // Generate meta
    const meta = generateProductMeta(mockIncompleteProduct);
    const metaTags = meta[0] as Record<string, string>;

    // Should use the first non-primary image
    expect(metaTags['og:image']).toBe('https://example.com/image3.jpg');
    expect(metaTags['twitter:image']).toBe('https://example.com/image3.jpg');

    const structuredData = JSON.parse(metaTags['script:ld+json']);
    expect(structuredData.image).toBe('https://example.com/image3.jpg');
  });

  it('handles products with missing description correctly', () => {
    // Generate meta
    const meta = generateProductMeta(mockIncompleteProduct);
    const metaTags = meta[0] as Record<string, string>;

    // Should generate a default description
    const expectedDescription = 'Another Handle - Premium European door hardware from Notalock';
    expect(metaTags.description).toBe(expectedDescription);
    expect(metaTags['og:description']).toBe(expectedDescription);
    expect(metaTags['twitter:description']).toBe(expectedDescription);

    const structuredData = JSON.parse(metaTags['script:ld+json']);
    expect(structuredData.description).toBe(expectedDescription);
  });

  it('handles products with missing price correctly', () => {
    // Generate meta
    const meta = generateProductMeta(mockIncompleteProduct);
    const metaTags = meta[0] as Record<string, string>;

    // Should show "Contact for Price"
    expect(metaTags['twitter:data1']).toBe('Contact for Price');

    const structuredData = JSON.parse(metaTags['script:ld+json']);
    expect(structuredData.offers.price).toBeNull();
  });

  it('handles products with no images correctly', () => {
    // Generate meta
    const meta = generateProductMeta(mockNoImagesProduct);
    const metaTags = meta[0] as Record<string, string>;

    // Image tags should be undefined or null
    expect(metaTags['og:image']).toBeUndefined();
    expect(metaTags['twitter:image']).toBeUndefined();

    const structuredData = JSON.parse(metaTags['script:ld+json']);
    expect(structuredData.image).toBeUndefined();
  });

  it('handles out of stock products correctly', () => {
    // Create out of stock product
    const outOfStockProduct: Product & { images: ProductImage[] } = { ...mockProduct, stock: 0 };

    // Generate meta
    const meta = generateProductMeta(outOfStockProduct);
    const metaTags = meta[0] as Record<string, string>;

    // Check availability in structured data
    const structuredData = JSON.parse(metaTags['script:ld+json']);
    expect(structuredData.offers.availability).toBe('https://schema.org/OutOfStock');
  });

  it('handles missing manufacturer correctly', () => {
    // Create product without manufacturer
    const noManufacturerProduct: Product & { images: ProductImage[] } = { ...mockProduct };
    delete noManufacturerProduct.manufacturer;

    // Generate meta
    const meta = generateProductMeta(noManufacturerProduct);
    const metaTags = meta[0] as Record<string, string>;

    // Check brand in structured data
    const structuredData = JSON.parse(metaTags['script:ld+json']);
    expect(structuredData.brand.name).toBe('Notalock');
  });
});
