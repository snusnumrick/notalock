import type { LoaderFunction } from '@remix-run/node';
import { useLoaderData, useNavigation, useSearchParams, Link } from '@remix-run/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { ProductGrid } from '~/features/products/components/ProductGrid';
import { ProductList } from '~/features/products/components/ProductList';
import { ViewToggle } from '~/features/products/components/ViewToggle';
import ProductFilter from '~/features/products/components/ProductFilter';
import { ProductView, TransformedProduct } from '~/features/products/types/product.types';
import type { CustomerFilterOptions } from '~/features/products/components/ProductFilter';
import { productsLoader } from '~/features/products/api/loaders';
import { useMediaQuery } from '~/hooks/useMediaQuery';
import { ChevronRight } from 'lucide-react';

export const loader: LoaderFunction = async ({ request, params, context }) => {
  return productsLoader({ request, params, context });
};

export default function Products() {
  const { products, total, nextCursor, initialLoad, filters, categories } = useLoaderData<{
    products: TransformedProduct[];
    total: number;
    nextCursor: string | null;
    initialLoad: boolean;
    filters: CustomerFilterOptions;
    categories: Array<{ id: string; name: string; slug: string }>;
  }>();

  // console.log('Products page loaded with categories:', categories);

  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const lastSearchParams = useRef<URLSearchParams>(new URLSearchParams());
  const [view, setView] = useState<ProductView>('grid');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [allProducts, setAllProducts] = useState<TransformedProduct[]>(products);
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
    const prevSortOrder = lastSearchParams.current?.get('sortOrder');
    const currentSortOrder = searchParams.get('sortOrder');
    const isSortChange = prevSortOrder !== currentSortOrder;

    // Update last search params reference
    lastSearchParams.current = new URLSearchParams(searchParams);

    if (isNavigatingBack) {
      // Handle back navigation - restore scroll position
      window.scrollTo({
        top: lastScrollPosition.current,
        behavior: 'instant',
      });
      return; // Exit early to avoid other scroll operations
    }

    if (!hasCursor || initialLoad || isSortChange) {
      // Reset products list when sort changes or on initial load
      setAllProducts(products);
      window.scrollTo({ top: 0, behavior: 'instant' });
      isInitialLoadRef.current = false;
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

  // Save scroll position before navigation
  useEffect(() => {
    // Capture scroll position immediately for back navigation
    lastScrollPosition.current = window.scrollY;

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-2 relative">
        <div className="flex flex-col gap-6">
          <div className="sticky top-28 z-30 bg-white py-4 w-full shadow-sm border-b">
            {isMobile ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-baseline flex-wrap gap-2">
                  <Link
                    to="/"
                    className="text-gray-500 text-sm hover:text-blue-600 transition-colors duration-200"
                  >
                    Home
                  </Link>
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                  <h1 className="text-2xl font-bold">Products</h1>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Showing {allProducts.length} of {productTotal.current} products
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ProductFilter
                    onFilterChange={handleFilterChange}
                    defaultFilters={filters}
                    categories={categories}
                    isMobile={true}
                  />
                  <ViewToggle
                    view={view}
                    onViewChange={setView}
                    className="fixed top-40 right-4 z-[100]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline flex-wrap gap-2">
                  <Link
                    to="/"
                    className="text-gray-500 text-sm hover:text-blue-600 transition-colors duration-200"
                  >
                    Home
                  </Link>
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                  <h1 className="text-2xl font-bold">Products</h1>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Showing {allProducts.length} of {productTotal.current} products
                  </p>
                  <ViewToggle view={view} onViewChange={setView} />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            {!isMobile && (
              <aside className="md:w-64 shrink-0 md:sticky md:top-40 md:h-[calc(100vh-10rem)] md:overflow-y-auto">
                <ProductFilter
                  onFilterChange={handleFilterChange}
                  defaultFilters={filters}
                  categories={categories}
                />
              </aside>
            )}

            <main className="flex-1 relative" style={{ zIndex: 1 }} data-testid="product-grid">
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
