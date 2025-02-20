import type { LoaderFunction } from '@remix-run/node';
import { useLoaderData, useNavigation, useSearchParams } from '@remix-run/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { ProductGrid } from '~/features/products/components/ProductGrid';
import { ProductList } from '~/features/products/components/ProductList';
import { ViewToggle } from '~/features/products/components/ViewToggle';
import ProductFilter from '~/features/products/components/ProductFilter';
import type { Product, ProductView } from '~/features/products/types/product.types';
import type { CustomerFilterOptions } from '~/features/products/components/ProductFilter';
import { productsLoader } from '~/features/products/api/loaders';
import { useMediaQuery } from '~/hooks/useMediaQuery';

export const loader: LoaderFunction = async ({ request, params, context }) => {
  return productsLoader({ request, params, context });
};

export default function Products() {
  const { products, total, nextCursor, initialLoad, filters, categories } = useLoaderData<{
    products: Product[];
    total: number;
    nextCursor: string | null;
    initialLoad: boolean;
    filters: CustomerFilterOptions;
    categories: Array<{ id: string; name: string }>;
  }>();

  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ProductView>('grid');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const lastScrollPosition = useRef<number>(0);
  const isInitialLoadRef = useRef(true);
  const productTotal = useRef(total);
  const updateParamsTimeout = useRef<NodeJS.Timeout>();

  // Update total when it changes (due to filters)
  useEffect(() => {
    if (initialLoad || !searchParams.has('cursor')) {
      productTotal.current = total;
    }
  }, [total, initialLoad, searchParams]);

  useEffect(() => {
    const hasCursor = searchParams.has('cursor');
    const isNavigatingBack = navigation.formData?.get('_action') === 'back';
    const isFilterChange = searchParams.has('inStockOnly') && !hasCursor;

    if (isNavigatingBack) {
      window.scrollTo({
        top: lastScrollPosition.current,
        behavior: 'instant',
      });
    } else if (!hasCursor || initialLoad || isFilterChange) {
      // Reset products list when filter changes or on initial load
      setAllProducts(products);
      if (isInitialLoadRef.current || isFilterChange) {
        window.scrollTo(0, 0);
        isInitialLoadRef.current = false;
      }
    } else if (products.length > 0) {
      // Append products for pagination
      setAllProducts(prev => {
        const uniqueProducts = products.filter(
          newProduct => !prev.some(existingProduct => existingProduct.id === newProduct.id)
        );
        return uniqueProducts.length > 0 ? [...prev, ...uniqueProducts] : prev;
      });
    }
  }, [products, initialLoad, searchParams, navigation.formData]);

  useEffect(() => {
    if (navigation.state === 'loading') {
      lastScrollPosition.current = window.scrollY;
    }
  }, [navigation.state]);

  const handleFilterChange = useCallback(
    (newFilters: CustomerFilterOptions) => {
      // Clear any pending updates
      if (updateParamsTimeout.current) {
        clearTimeout(updateParamsTimeout.current);
      }

      // Debounce the URL updates
      updateParamsTimeout.current = setTimeout(() => {
        const updatedParams = new URLSearchParams();
        isInitialLoadRef.current = true;

        // Only add non-empty filters to URL
        Object.entries(newFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            updatedParams.set(key, value.toString());
          }
        });

        // Preserve view parameter if it exists
        const currentView = searchParams.get('view');
        if (currentView) {
          updatedParams.set('view', currentView);
        }

        setSearchParams(updatedParams);
      }, 50); // Small delay to ensure we don't conflict with filter component's debounce
    },
    [searchParams, setSearchParams]
  );

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (updateParamsTimeout.current) {
        clearTimeout(updateParamsTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isMobile && view === 'list') {
      setView('grid');
    }
  }, [isMobile, view]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Products</h1>
              <p className="text-sm text-gray-500">
                Showing {allProducts.length} of {productTotal.current} products
              </p>
            </div>
            {!isMobile && <ViewToggle view={view} onViewChange={setView} />}
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {!isMobile && (
              <aside className="md:w-64 shrink-0">
                <ProductFilter
                  onFilterChange={handleFilterChange}
                  defaultFilters={filters}
                  categories={categories}
                />
              </aside>
            )}

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

            <main className="flex-1">
              {view === 'grid' ? (
                <ProductGrid
                  products={allProducts}
                  nextCursor={nextCursor}
                  isInitialLoad={initialLoad}
                  total={productTotal.current}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                />
              ) : (
                <ProductList
                  products={allProducts}
                  nextCursor={nextCursor}
                  isInitialLoad={initialLoad}
                  total={productTotal.current}
                  searchParams={searchParams}
                  setSearchParams={setSearchParams}
                />
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
