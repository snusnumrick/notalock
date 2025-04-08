import React, { useEffect, useRef, useCallback } from 'react';
import { useRetry } from '~/hooks/useRetry';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';
import { AuthApiError } from '@supabase/supabase-js';
import { useNavigation, useNavigate, useLocation } from '@remix-run/react';
import type { TransformedProduct } from '../types/product.types';
import { ProductGridSkeleton } from './ProductCardSkeleton';
import type { SetURLSearchParams } from 'react-router-dom';
import ProductCardWithReferrer from './ProductCardWithReferrer';
import { findCategoryBySlug } from '~/features/categories/utils/categoryUtils';
import type { Category } from '~/features/categories/types/category.types';
import { DEFAULT_PAGE_LIMIT } from '~/config/pagination';

interface ProductGridProps {
  products: TransformedProduct[];
  nextCursor?: string | null;
  isInitialLoad?: boolean;
  total: number;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  currentCategory?: Category;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  nextCursor,
  isInitialLoad = true,
  total,
  searchParams,
  setSearchParams,
  currentCategory,
}) => {
  const navigation = useNavigation();
  const sentinel = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const unmountedRef = useRef(false);
  const location = useLocation();

  // Try to determine current category from path if not provided directly
  const derivedCategory = React.useMemo(() => {
    if (currentCategory) return currentCategory;

    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (
      pathSegments.length >= 3 &&
      pathSegments[0] === 'products' &&
      pathSegments[1] === 'category'
    ) {
      const categorySlug = pathSegments[pathSegments.length - 1];
      return findCategoryBySlug(categorySlug);
    }
    return null;
  }, [currentCategory, location.pathname]);

  // Track unmounted state for cleanup
  useEffect(() => {
    // console.log('ProductGrid mounted');
    unmountedRef.current = false;
    return () => {
      // console.log('ProductGrid unmounting');
      unmountedRef.current = true;
    };
  }, []);

  const isLoading = navigation.state !== 'idle';
  const hasMore = products.length < total && nextCursor !== null;

  // Reset loading state when navigation completes
  useEffect(() => {
    if (navigation.state === 'idle') {
      loadingRef.current = false;
    }
  }, [navigation.state]);

  // Function to update search params
  const updateSearchParams = useCallback(async () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('cursor', nextCursor!);

    // Calculate remaining items and adjust the limit if needed
    const remaining = total - products.length;
    if (remaining < DEFAULT_PAGE_LIMIT) {
      newParams.set('limit', remaining.toString());
    }
    // console.log('remaining', remaining);

    return setSearchParams(newParams, {
      preventScrollReset: true,
      replace: true,
    });
  }, [nextCursor, searchParams, setSearchParams, products.length, total]);

  // Set up retry mechanism
  const {
    execute: executeLoadMore,
    state: retryState,
    reset: resetRetry,
  } = useRetry(updateSearchParams, {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffFactor: 2,
    maxDelay: 5000,
  });

  const navigate = useNavigate();
  const handleLoadError = useCallback(
    (error: Error) => {
      // Handle auth errors by redirecting to login
      if (error instanceof AuthApiError && error.status === 400) {
        navigate('/auth/login');
        return;
      }

      // Log other errors
      if (error.message !== 'Operation cancelled') {
        console.error('Failed to load more products:', error);
      }
    },
    [navigate]
  );

  const loadMore = useCallback(async () => {
    const shouldSkip = !nextCursor || loadingRef.current || !hasMore || unmountedRef.current;

    if (shouldSkip) {
      return;
    }

    // Prevent multiple simultaneous load requests
    loadingRef.current = true;

    try {
      await executeLoadMore();
    } catch (error) {
      if (error instanceof Error) {
        handleLoadError(error);
      }
    }
  }, [nextCursor, hasMore, executeLoadMore, handleLoadError]);

  // Reset retry state when navigation is successful
  useEffect(() => {
    if (navigation.state === 'idle' && retryState.attempt > 0) {
      resetRetry();
    }
  }, [navigation.state, retryState.attempt, resetRetry]);

  // Set up intersection observer
  useEffect(() => {
    if (!hasMore || !sentinel.current) return;

    const currentSentinel = sentinel.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldLoad =
          entry?.isIntersecting && !loadingRef.current && hasMore && !unmountedRef.current;

        if (shouldLoad) {
          void loadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    observer.observe(currentSentinel);

    return () => {
      observer.unobserve(currentSentinel);
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  if (isInitialLoad && products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No products found</p>
        <button
          onClick={() => setSearchParams(new URLSearchParams())}
          className="mt-4 text-btn-primary hover:text-btn-primary-hover"
        >
          Clear all filters
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 z-0">
        {products.map((product, index) => (
          <ProductCardWithReferrer
            key={`${product.id}-${index}`}
            product={product}
            index={index}
            category={derivedCategory || undefined}
          />
        ))}
      </div>

      {/* Loading indicator and sentinel */}
      {hasMore && (
        <div ref={sentinel} className="h-4 my-8" data-testid="load-more-sentinel">
          {retryState.isRetrying && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
              <Alert variant="destructive" className="max-w-lg mx-auto">
                <AlertDescription className="flex items-center gap-2">
                  <ReloadIcon className="animate-spin h-4 w-4" />
                  Retrying... Attempt {retryState.attempt} of 3
                </AlertDescription>
              </Alert>
            </div>
          )}
          {retryState.error && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
              <Alert variant="destructive" className="max-w-lg mx-auto">
                <AlertDescription>Failed to load more products. Please try again.</AlertDescription>
              </Alert>
              <Button
                variant="outline"
                onClick={() => {
                  resetRetry();
                  loadMore();
                }}
                className="flex items-center gap-2"
              >
                <ReloadIcon className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}
          {isLoading && (
            <div className="w-full animate-in fade-in duration-300">
              <ProductGridSkeleton count={4} />
            </div>
          )}
        </div>
      )}

      {/* Status message */}
      <div className="text-center text-text-secondary text-sm py-4">
        {products.length === total
          ? `Showing all ${products.length} products`
          : `Showing ${products.length} of ${total} products`}
      </div>
    </div>
  );
};
