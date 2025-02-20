import React, { useEffect, useRef, useCallback } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { useNavigation, Link } from '@remix-run/react';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { formattedPrice } from '~/lib/utils';
import type { Product } from '../types/product.types';

interface ProductListProps {
  products: Product[];
  nextCursor?: string | null;
  isInitialLoad?: boolean;
  total: number;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
}

export const ProductList: React.FC<ProductListProps> = ({
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
      <div className="space-y-4">
        {products.map(product => (
          <Link key={product.id} to={`/products/${product.id}`}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-40 h-40 flex-shrink-0">
                    <div className="aspect-square w-full relative overflow-hidden rounded-lg">
                      <img
                        src={product.image_url || '/images/placeholder-product.png'}
                        alt={product.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                          {product.description}
                        </p>
                        {product.categories && product.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {product.categories.map(category => (
                              <Badge key={category.id} variant="secondary">
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-lg">{formattedPrice(product.retail_price)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
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
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="w-full h-40 animate-pulse bg-gray-100">
                    <CardContent className="p-4">
                      <div className="flex gap-4 h-full">
                        <div className="w-40 h-32 bg-gray-200 rounded-lg" />
                        <div className="flex-grow space-y-4">
                          <div className="h-6 w-1/3 bg-gray-200 rounded" />
                          <div className="h-4 w-2/3 bg-gray-200 rounded" />
                          <div className="h-4 w-1/2 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
