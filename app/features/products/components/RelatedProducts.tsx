import { Link } from '@remix-run/react';
import type { ProductSummary } from '../types/product.types';

// Extended type to handle both image_url and thumbnail_url from test data
interface RelatedProductItem extends Omit<ProductSummary, 'image_url'> {
  image_url?: string;
  thumbnail_url?: string;
}

interface RelatedProductsProps {
  products: RelatedProductItem[];
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
            <Link to={`/products/${product.slug}`} className="group">
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                {product.thumbnail_url || product.image_url ? (
                  <img
                    src={product.thumbnail_url || product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="h-full w-full flex items-center justify-center text-gray-400"
                    aria-label={`No image for ${product.name}`}
                    role="img"
                  >
                    <svg
                      className="w-12 h-12 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
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
