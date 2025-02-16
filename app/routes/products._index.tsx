import type { LoaderFunction } from '@remix-run/node';
import { useLoaderData, useSearchParams, useNavigate } from '@remix-run/react';
import { useState, useCallback, useEffect } from 'react';
import { ProductGrid } from '~/features/products/components/ProductGrid';
import { ProductList } from '~/features/products/components/ProductList';
import { ViewToggle } from '~/features/products/components/ViewToggle';
import ProductFilter from '~/features/products/components/ProductFilter';
import type { Product, ProductView } from '~/features/products/types/product.types';
import type { CustomerFilterOptions } from '~/features/products/components/ProductFilter';
import { productsLoader } from '~/features/products/api/loaders';
import { useMediaQuery } from '~/hooks/useMediaQuery';

export const loader: LoaderFunction = async ({ request }) => {
  return productsLoader({ request });
};

export default function Products() {
  const { products, total, currentPage, totalPages, filters, categories } = useLoaderData<{
    products: Product[];
    total: number;
    currentPage: number;
    totalPages: number;
    filters: CustomerFilterOptions;
    categories: Array<{ id: string; name: string }>;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ProductView>('grid');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleFilterChange = useCallback(
    (newFilters: CustomerFilterOptions) => {
      const updatedParams = new URLSearchParams(searchParams);

      // Reset page when filters change
      updatedParams.set('page', '1');

      // Update filter parameters
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === undefined) {
          updatedParams.delete(key);
        } else {
          updatedParams.set(key, value.toString());
        }
      });

      setSearchParams(updatedParams);
    },
    [searchParams, setSearchParams]
  );

  // Handle initial mobile/desktop view
  useEffect(() => {
    if (isMobile && view === 'list') {
      setView('grid');
    }
  }, [isMobile]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-sm text-gray-500">
              Showing {products.length} of {total} products
            </p>
          </div>
          {!isMobile && <ViewToggle view={view} onViewChange={setView} />}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Filters (Desktop) */}
          {!isMobile && (
            <div className="md:w-64 shrink-0">
              <ProductFilter
                onFilterChange={handleFilterChange}
                defaultFilters={filters}
                categories={categories}
              />
            </div>
          )}

          {/* Mobile Filters */}
          {isMobile && (
            <div className="w-full">
              <ProductFilter
                onFilterChange={handleFilterChange}
                defaultFilters={filters}
                categories={categories}
                isMobile={true}
              />
            </div>
          )}

          {/* Product Grid/List */}
          <div className="flex-1">
            {products.length > 0 ? (
              <div className="w-full">
                {view === 'grid' ? (
                  <ProductGrid products={products} />
                ) : (
                  <ProductList products={products} />
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found</p>
                <button
                  onClick={() => handleFilterChange({})}
                  className="mt-4 text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
