import { Link } from '@remix-run/react';
import type { ProductSummary } from '../types/product.types';

interface RelatedProductsProps {
  products: ProductSummary[];
  title?: string;
}

/**
 * Component to display related products in a grid
 * Shows products with image, name, and price
 */
export function RelatedProducts({ products, title = 'Related Products' }: RelatedProductsProps) {
  // Don't render anything if no related products
  if (!products.length) return null;

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <li key={product.id}>
            <Link to={`/products/${product.id}`} className="group">
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                {product.thumbnail_url ? (
                  <img
                    src={product.thumbnail_url}
                    alt={product.name}
                    className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <h3 className="mt-4 text-sm text-gray-700">{product.name}</h3>
              <p className="mt-1 text-lg font-medium text-gray-900">
                ${product.retail_price?.toFixed(2) ?? 'N/A'}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
