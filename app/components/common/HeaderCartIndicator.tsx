import React, { useEffect, useState } from 'react';
import { useLocation, useMatches, Link } from '@remix-run/react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import type { CartItem } from '~/features/cart/types/cart.types';
import { CART_COUNT_EVENT_NAME } from '~/features/cart/constants';

// Define types for loader data
interface RootLoaderData {
  cartItems: CartItem[];
  [key: string]: unknown;
}

interface RouteMatch {
  id: string;
  pathname: string;
  params: Record<string, string>;
  data: RootLoaderData | Record<string, unknown>;
  handle: unknown;
}

/**
 * A dedicated cart indicator component that directly reads from Remix loader data
 * to ensure consistent display of cart count
 */
export const HeaderCartIndicator: React.FC<{ testId?: string }> = ({ testId }) => {
  const [count, setCount] = useState(0);
  const matches = useMatches() as RouteMatch[];
  const location = useLocation();

  // Get cart items directly from root loader data
  useEffect(() => {
    // Find the root route match which contains our cart data
    const rootMatch = matches.find(match => match.id === 'root');

    if (rootMatch?.data && 'cartItems' in rootMatch.data) {
      const cartItems = (rootMatch.data as RootLoaderData).cartItems;
      const itemCount = cartItems.reduce(
        (total: number, item: CartItem) => total + item.quantity,
        0
      );

      console.log(
        'HeaderCartIndicator - Found',
        cartItems.length,
        'items in loader data with total count:',
        itemCount
      );
      setCount(itemCount);
    }
  }, [matches, location.key]); // Re-run when routes change or location changes

  // Also listen for optimistic updates via cart events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track last update timestamp to prevent rapid fire updates
    let lastUpdateTimestamp = 0;
    const debounceTime = 50; // ms

    const handleCartUpdate = (e: CustomEvent<{ count: number; timestamp?: number }>) => {
      if (typeof e.detail?.count === 'number') {
        // Debounce the updates
        const now = Date.now();
        const eventTimestamp = e.detail.timestamp || now;

        // Skip if we've processed a more recent event already
        if (eventTimestamp < lastUpdateTimestamp) {
          return;
        }

        // Skip if we're getting too many events too quickly
        if (now - lastUpdateTimestamp < debounceTime) {
          return;
        }

        lastUpdateTimestamp = now;

        console.log('HeaderCartIndicator - Received cart update:', e.detail.count);
        // Update count
        setCount(e.detail.count);
      }
    };

    // Listen for cart update events
    window.addEventListener(CART_COUNT_EVENT_NAME, handleCartUpdate as EventListener);

    return () => {
      window.removeEventListener(CART_COUNT_EVENT_NAME, handleCartUpdate as EventListener);
    };
  }, []);

  return (
    <Link
      to="/cart"
      data-testid={testId || 'cart-link'}
      className="text-gray-700 hover:text-blue-600 transition-colors duration-200 px-3 py-2 text-sm font-medium flex items-center relative"
    >
      <ShoppingCartIcon className="w-4 h-4 mr-1" />
      <span>Cart</span>
      {count > 0 ? (
        <span
          data-testid="cart-badge"
          className="cart-badge absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
        >
          <span data-testid="cart-count" className="cart-count">
            {count}
          </span>
        </span>
      ) : null}
    </Link>
  );
};
