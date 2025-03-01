import type { MetaFunction } from '@remix-run/node';
import type { Product, ProductImage } from '../types/product.types';

/**
 * Generates meta tags and structured data for product pages
 * Includes OpenGraph tags, Twitter Cards, and JSON-LD structured data
 *
 * @param product Product data with images
 * @returns Meta function for Remix route
 */
export const generateProductMeta = (
  product: Product & { images: ProductImage[] }
): ReturnType<MetaFunction> => {
  // Find main image (primary or first available)
  const mainImage = product.images.find(img => img.is_primary)?.url || product.images[0]?.url;

  // Generate description from product description or default
  const productDescription =
    product.description || `${product.name} - Premium European door hardware from Notalock`;

  // Format price
  const price = product.retail_price
    ? `${product.retail_price.toFixed(2)} USD`
    : 'Contact for Price';

  // Basic meta tags
  const metaTags = {
    title: `${product.name} | Notalock Door Hardware`,
    description: productDescription,
  };

  // OpenGraph tags for social sharing
  const ogTags = {
    'og:title': metaTags.title,
    'og:description': metaTags.description,
    'og:type': 'product',
    'og:url': `https://notalock.com/products/${product.id}`,
    'og:image': mainImage,
    'og:site_name': 'Notalock',
  };

  // Twitter Card tags
  const twitterTags = {
    'twitter:card': 'product',
    'twitter:title': metaTags.title,
    'twitter:description': metaTags.description,
    'twitter:image': mainImage,
    'twitter:site': '@notalock',
    'twitter:label1': 'Price',
    'twitter:data1': price,
    'twitter:label2': 'SKU',
    'twitter:data2': product.sku,
  };

  // Product-specific structured data (JSON-LD)
  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: productDescription,
    sku: product.sku,
    mpn: product.sku,
    image: mainImage,
    brand: {
      '@type': 'Brand',
      name: product.manufacturer ?? 'Notalock',
    },
    offers: {
      '@type': 'Offer',
      url: `https://notalock.com/products/${product.id}`,
      priceCurrency: 'USD',
      price: product.retail_price,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      availability:
        product.stock && product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  // Combine all meta tags
  return [
    {
      ...metaTags,
      ...ogTags,
      ...twitterTags,
      'script:ld+json': JSON.stringify(structuredData),
    },
  ];
};
