import React, { useEffect, useRef, useCallback } from 'react';
import { useRetry } from '~/hooks/useRetry';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';
import { AuthApiError } from '@supabase/supabase-js';
import { Link, useNavigation, useNavigate } from '@remix-run/react';
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { formattedPrice } from '~/lib/utils';
import type { TransformedProduct } from '../types/product.types';
import { ProductGridSkeleton } from './ProductCardSkeleton';
import type { SetURLSearchParams } from 'react-router-dom';

interface ProductGridProps {
  products: TransformedProduct[];
  nextCursor?: string | null;
  isInitialLoad?: boolean;
  total: number;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  nextCursor,
  isInitialLoad = true,
  total,
  searchParams,
  setSearchParams,
}) => {
  const navigation = useNavigation();
  const sentinel = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const unmountedRef = useRef(false);

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
    if (remaining < 12) {
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

    /*
    console.log('loadMore called:', {
      nextCursor,
      loading: loadingRef.current,
      hasMore,
      unmounted: unmountedRef.current,
      shouldSkip,
    });
*/

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

        /*        console.log('IntersectionObserver update:', {
          isIntersecting: entry?.isIntersecting,
          loading: loadingRef.current,
          hasMore,
          unmounted: unmountedRef.current,
          shouldLoad,
        });*/

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
        <p className="text-gray-500">No products found</p>
        <button
          onClick={() => setSearchParams(new URLSearchParams())}
          className="mt-4 text-blue-600 hover:text-blue-800"
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
          <Link
            key={`${product.id}-${index}`}
            to={`/products/${product.id}`}
            prefetch="intent"
            className="block"
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="aspect-square w-full relative overflow-hidden rounded-t-lg">
                  <img
                    src={product.image_url || '/placeholder-product.png'}
                    alt={product.name}
                    className="object-cover w-full h-full"
                    loading={index < 8 ? 'eager' : 'lazy'}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                {product.categories && product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.categories.map(category => (
                      <Badge key={category.id} variant="secondary">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <p className="font-bold text-lg">{formattedPrice(product.price)}</p>
              </CardFooter>
            </Card>
          </Link>
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
      <div className="text-center text-gray-500 text-sm py-4">
        {products.length === total
          ? `Showing all ${products.length} products`
          : `Showing ${products.length} of ${total} products`}
      </div>
    </div>
  );
};
