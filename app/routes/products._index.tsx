import type { LoaderFunction } from '@remix-run/node';
import { useLoaderData, useNavigation, useSearchParams } from '@remix-run/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { ProductGrid } from '~/features/products/components/ProductGrid';
import { ProductList } from '~/features/products/components/ProductList';
import { ViewToggle } from '~/features/products/components/ViewToggle';
import ProductFilter from '~/features/products/components/ProductFilter';
import SimpleSearch from '~/features/products/components/SimpleSearch';
import { ProductView, TransformedProduct } from '~/features/products/types/product.types';
import type { CustomerFilterOptions } from '~/features/products/components/ProductFilter';
import { productsLoader } from '~/features/products/api/loaders';
import { useMediaQuery } from '~/hooks/useMediaQuery';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '~/components/ui/button';

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
  const hasHydrated = useRef(false);
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

        // Preserve search term if it exists
        const searchTerm = searchParams.get('searchTerm');
        if (searchTerm) {
          updatedParams.set('searchTerm', searchTerm);
        }

        setSearchParams(updatedParams);
      }, 50); // Small delay to ensure we don't conflict with filter component's debounce
    },
    [searchParams, setSearchParams]
  );

  // Handle search functionality
  const handleSearch = useCallback(
    (term: string) => {
      // Save search field focus state and cursor position to session storage
      if (document.activeElement?.classList.contains('pl-10')) {
        const input = document.activeElement as HTMLInputElement;
        sessionStorage.setItem('productSearchFocus', 'true');
        // Store cursor position to restore it after page load
        sessionStorage.setItem('searchCursorPosition', input.selectionStart?.toString() || 'end');
      }

      // Get the current URL parameters we want to keep
      const currentParams = new URLSearchParams();

      // Only preserve specific parameters (except searchTerm)
      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      const inStockOnly = searchParams.get('inStockOnly');
      const sortOrder = searchParams.get('sortOrder');
      const view = searchParams.get('view');

      if (term) currentParams.set('searchTerm', term);
      if (minPrice) currentParams.set('minPrice', minPrice);
      if (maxPrice) currentParams.set('maxPrice', maxPrice);
      if (inStockOnly) currentParams.set('inStockOnly', inStockOnly);
      if (sortOrder) currentParams.set('sortOrder', sortOrder);
      if (view) currentParams.set('view', view);

      // Create the new URL and perform hard navigation
      const baseUrl = window.location.origin;
      const queryString = currentParams.toString();
      const newUrl = `${baseUrl}/products${queryString ? `?${queryString}` : ''}`;
      window.location.href = newUrl;
    },
    [searchParams]
  );

  // Reset hydration state for consistent rendering
  useEffect(() => {
    // Set hydrated state
    hasHydrated.current = true;

    // Force layout recalculation if needed
    requestAnimationFrame(() => {
      // Let browser redraw
    });
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (updateParamsTimeout.current) {
        clearTimeout(updateParamsTimeout.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="container mx-auto px-4 relative pb-20">
        <div className="flex flex-col md:flex-row gap-8 relative z-10 mt-3">
          {/* Sidebar spacer */}
          {!isMobile && <div className="hidden md:block w-64 shrink-0"></div>}
          {/* Mobile view components */}
          {isMobile && (
            <div className="fixed z-30 bg-product-card bottom-4 left-0 right-0 m-0 p-0 pl-2 pr-2 border border-border shadow">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden w-full`}>
                    <SimpleSearch
                      initialValue={searchParams.get('searchTerm') || ''}
                      onSearch={term => {
                        handleSearch(term);
                      }}
                    />
                  </div>
                  <div className={`flex items-center gap-2 ml-2'}`}>
                    <ProductFilter
                      onFilterChange={handleFilterChange}
                      defaultFilters={filters}
                      categories={categories}
                      isMobile={true}
                      searchProps={{
                        initialValue: searchParams.get('searchTerm') || '',
                        onSearch: handleSearch,
                      }}
                    />
                    <ViewToggle view={view} onViewChange={setView} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop sidebar - fixed position */}
          {!isMobile && (
            <div className="fixed top-16 bottom-0 overflow-auto hidden md:block w-64 bg-product-card border-r border-border">
              <div className="pt-3 px-2">
                {/* Products title */}
                <h1 className="text-2xl font-bold mb-4 text-text-primary">Products</h1>

                {/* View toggle row */}
                <div className="flex justify-between items-center mb-4 border rounded-md p-2 bg-product-hover border-border">
                  <span className="text-sm font-medium">View:</span>
                  <div className="flex gap-2">
                    <Button
                      variant={view === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setView('grid')}
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={view === 'list' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setView('list')}
                      aria-label="List view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mb-4">
                  <SimpleSearch
                    initialValue={searchParams.get('searchTerm') || ''}
                    onSearch={handleSearch}
                  />
                </div>
                <div>
                  <ProductFilter
                    onFilterChange={handleFilterChange}
                    defaultFilters={filters}
                    categories={categories}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
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
  );
}
