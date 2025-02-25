import { useCallback, useEffect, useRef } from 'react';
import type { SetURLSearchParams } from 'react-router-dom';

interface UseInfiniteLoadingOptions {
  nextCursor: string | null | undefined;
  hasMore: boolean;
  navigation: { state: 'idle' | 'loading' | 'submitting' };
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  onError?: (error: Error) => Promise<void>;
}

export function useInfiniteLoading({
  nextCursor,
  hasMore,
  navigation,
  searchParams,
  setSearchParams,
  onError,
}: UseInfiniteLoadingOptions) {
  const loadingRef = useRef(false);

  // Reset loading state on navigation changes
  useEffect(() => {
    if (navigation.state === 'idle') {
      loadingRef.current = false;
    }
  }, [navigation.state]);

  const loadNextPage = useCallback(async () => {
    if (!nextCursor || loadingRef.current || !hasMore || navigation.state !== 'idle') {
      console.log('Skip load:', {
        noNextCursor: !nextCursor,
        isLoading: loadingRef.current,
        noMore: !hasMore,
        navigationBusy: navigation.state !== 'idle',
      });
      return;
    }

    try {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('cursor', nextCursor);

      // Ensure sortOrder is set for consistent behavior
      if (!newParams.has('sortOrder')) {
        newParams.set('sortOrder', 'featured');
      }

      console.log('Loading next page', {
        cursor: nextCursor,
        params: Object.fromEntries(newParams.entries()),
      });

      loadingRef.current = true;

      setSearchParams(newParams, {
        preventScrollReset: true,
        replace: true,
      });
    } catch (error) {
      loadingRef.current = false;
      if (error instanceof Error && onError) {
        await onError(error);
      }
    }
  }, [nextCursor, hasMore, navigation.state, searchParams, setSearchParams, onError]);

  return {
    loadNextPage,
    isLoading: loadingRef.current,
  };
}
