/**
 * This utility provides a more reliable way to coordinate cart state
 * between components, especially during page transitions and remixing.
 *
 * It uses direct DOM storage to maintain cart count state that survives
 * React re-rendering cycles.
 */
import { CART_COUNT_EVENT_NAME } from '~/features/cart/constants';

// Define type for window extension
interface WindowWithCartState {
  [CART_COUNT_DATA_KEY]: number;
  [key: string]: unknown;
}

// Global state key
const CART_COUNT_DATA_KEY = '__notalock_cart_count';

/**
 * Gets the current cart count from the global state
 */
export function getGlobalCartCount(): number {
  if (typeof window === 'undefined') return 0;

  try {
    // Try to get from the DOM storage first
    const windowWithCart = window as unknown as WindowWithCartState;
    const countData = windowWithCart[CART_COUNT_DATA_KEY];
    if (typeof countData === 'number') {
      return countData;
    }

    // Fall back to checking localStorage in case it exists there
    const storedCount = sessionStorage.getItem(CART_COUNT_DATA_KEY);
    if (storedCount) {
      const count = parseInt(storedCount, 10);
      if (!isNaN(count)) {
        // Update the global state
        windowWithCart[CART_COUNT_DATA_KEY] = count;
        return count;
      }
    }
  } catch (err) {
    console.error('Error getting global cart count:', err);
  }

  return 0;
}

/**
 * Sets the cart count in the global state and dispatches events
 * for components to react to
 */
export function setGlobalCartCount(count: number, dispatchEvent = true): void {
  if (typeof window === 'undefined') return;

  try {
    console.log('Setting global cart count to:', count);

    // Store in both the DOM and sessionStorage for redundancy
    const windowWithCart = window as unknown as WindowWithCartState;
    windowWithCart[CART_COUNT_DATA_KEY] = count;
    sessionStorage.setItem(CART_COUNT_DATA_KEY, count.toString());

    if (dispatchEvent) {
      // Create and dispatch a custom event for components to listen to
      const event = new CustomEvent('cart-count-sync', {
        detail: {
          count,
          source: 'coordinator',
          timestamp: Date.now(),
        },
      });

      window.dispatchEvent(event);

      // Also dispatch the standard cart-count-update event for backward compatibility
      console.log('count event 12', count);

      window.dispatchEvent(
        new CustomEvent(CART_COUNT_EVENT_NAME, {
          detail: {
            count,
            source: 'coordinator',
            timestamp: Date.now(),
          },
        })
      );
    }
  } catch (err) {
    console.error('Error setting global cart count:', err);
  }
}

// Type definitions for custom events
interface CartCountEventDetail {
  count: number;
  source?: string;
  timestamp: number;
}

interface CartCountEvent extends CustomEvent {
  detail: CartCountEventDetail;
}

/**
 * Increments the global cart count by the specified amount
 */
export function incrementGlobalCartCount(amount = 1): void {
  const currentCount = getGlobalCartCount();
  setGlobalCartCount(currentCount + amount);
}

/**
 * Initializes the cart count coordination system and registers
 * listeners for various cart-related events
 */
export function initCartCountCoordination(): () => void {
  if (typeof window === 'undefined') return () => {};

  console.log('Initializing cart count coordination system');

  // Handler for cart-count-update events from other components
  const handleCartCountUpdate = (e: CartCountEvent) => {
    if (!e.detail || typeof e.detail.count !== 'number') return;

    // If this came from the coordinator itself, ignore to avoid loops
    if (e.detail.source === 'coordinator') return;

    console.log('Cart count update received from outside source:', e.detail.count);
    setGlobalCartCount(e.detail.count, false); // Don't dispatch events to avoid loops
  };

  // Add event listeners
  window.addEventListener(CART_COUNT_EVENT_NAME, handleCartCountUpdate as EventListener);

  // Return cleanup function
  return () => {
    window.removeEventListener(CART_COUNT_EVENT_NAME, handleCartCountUpdate as EventListener);
  };
}

// Export all functions
export const cartStateCoordinator = {
  getCount: getGlobalCartCount,
  setCount: setGlobalCartCount,
  increment: incrementGlobalCartCount,
  init: initCartCountCoordination,
};

export default cartStateCoordinator;
