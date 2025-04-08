import React, { useEffect, useRef, useCallback } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';
import { useNavigation, useLocation } from '@remix-run/react';
import { Card, CardContent } from '~/components/ui/card';
import { TransformedProduct } from '../types/product.types';
import { storeReferringCategory } from '~/features/categories/utils/referringCategoryUtils';
import { findCategoryBySlug } from '~/features/categories/utils/categoryUtils';
import type { Category } from '~/features/categories/types/category.types';
import { ProductListItem } from './ProductListItem';
import { DEFAULT_PAGE_LIMIT } from '~/config/pagination';

interface ProductListProps {
  products: TransformedProduct[];
  nextCursor?: string | null;
  isInitialLoad?: boolean;
  total: number;
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  currentCategory?: Category;
}

export const ProductList: React.FC<ProductListProps> = ({
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
  const isLoading = navigation.state !== 'idle';
  const hasMore = products.length < total && nextCursor !== null;
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
    if (remaining < DEFAULT_PAGE_LIMIT) {
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

  // Handle storing referring category
  const handleStoreCategory = React.useCallback(() => {
    if (derivedCategory) {
      storeReferringCategory({
        id: derivedCategory.id,
        name: derivedCategory.name,
        slug: derivedCategory.slug,
        path: derivedCategory.path || undefined,
      });
    }
  }, [derivedCategory]);

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
      <div className="space-y-4">
        {products.map(product => (
          <ProductListItem
            key={product.id}
            product={product}
            onCategoryClick={handleStoreCategory}
          />
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
                  <Card key={i} className="w-full h-40 animate-pulse bg-product-hover">
                    <CardContent className="p-4">
                      <div className="flex gap-4 h-full">
                        <div className="w-40 h-32 bg-product-hover/70 rounded-lg" />
                        <div className="flex-grow space-y-4">
                          <div className="h-6 w-1/3 bg-product-hover/70 rounded" />
                          <div className="h-4 w-2/3 bg-product-hover/70 rounded" />
                          <div className="h-4 w-1/2 bg-product-hover/70 rounded" />
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
      <div className="text-center text-text-secondary text-sm py-4">
        {products.length === total
          ? `Showing all ${products.length} products`
          : `Showing ${products.length} of ${total} products`}
      </div>
    </div>
  );
};
