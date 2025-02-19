import React, { useEffect, useRef, useCallback } from 'react';
import { Link, useNavigation } from '@remix-run/react';
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { formattedPrice } from '~/lib/utils';
import type { Product } from '../types/product.types';
import { ProductGridSkeleton } from './ProductCardSkeleton';
import type { SetURLSearchParams } from 'react-router-dom';

interface ProductGridProps {
  products: Product[];
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
  const isLoading = navigation.state !== 'idle';
  const hasMore = products.length < total && nextCursor !== null;

  // Reset loading state when navigation completes
  useEffect(() => {
    if (navigation.state === 'idle') {
      loadingRef.current = false;
    }
  }, [navigation.state]);

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingRef.current || !hasMore) {
      return;
    }

    // Prevent multiple simultaneous load requests
    loadingRef.current = true;

    const newParams = new URLSearchParams(searchParams);
    newParams.set('cursor', nextCursor);

    // Calculate remaining items and adjust the limit if needed
    const remaining = total - products.length;
    if (remaining < 12) {
      newParams.set('limit', remaining.toString());
    }

    setSearchParams(newParams, {
      preventScrollReset: true,
      replace: true,
    });
  }, [nextCursor, hasMore, searchParams, setSearchParams, products.length, total]);

  useEffect(() => {
    if (!hasMore) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (sentinel.current && !loadingRef.current && hasMore) {
            const rect = sentinel.current.getBoundingClientRect();
            const buffer = window.innerHeight + 100;
            if (rect.top <= buffer) {
              loadMore();
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check for small content
    if (
      sentinel.current &&
      sentinel.current.getBoundingClientRect().top <= window.innerHeight + 100
    ) {
      loadMore();
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasMore]);

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
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                {product.categories?.length > 0 && (
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
        <div
          ref={sentinel}
          className="py-8 text-center"
          style={{ visibility: isLoading ? 'visible' : 'hidden' }}
        >
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
