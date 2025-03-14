import { Link } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import type { TransformedProduct } from '~/features/products/types/product.types';
import { ProductCard } from './ProductCard';

interface NewArrivalsProps {
  products: TransformedProduct[];
  limit?: number;
  showViewAllButton?: boolean;
  title?: string;
  description?: string;
}

export function NewArrivals({
  products,
  limit = 4,
  showViewAllButton = true,
  title = 'New Arrivals',
  description = 'Check out our latest additions to the collection',
}: NewArrivalsProps) {
  if (products.length === 0) {
    return (
      <section className="py-12 px-4 md:px-6 lg:px-8" data-testid="empty-state">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 mb-4" role="status">
            No new arrivals available.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 relative inline-block">
            <span className="relative z-10">{title}</span>
            <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 z-0"></span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, limit).map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              variant="featured"
              showAddedDate={true}
              showAddToCartButton={true}
            />
          ))}
        </div>
        {showViewAllButton ? (
          <div className="mt-8 text-center" data-testid="view-all-button-container">
            <Link to="/products?sortOrder=newest">
              <Button
                variant="outline"
                size="lg"
                className="border-blue-600 text-blue-700 hover:bg-blue-50"
                data-testid="view-all-button"
              >
                View All New Arrivals
              </Button>
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
