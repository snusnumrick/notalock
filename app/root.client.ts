// This file contains client-side only code that runs on initialization

// Import core libraries
import { v4 as uuidv4 } from 'uuid';
import {
  ANONYMOUS_CART_COOKIE_NAME,
  CART_COUNT_EVENT_NAME,
  CART_DATA_STORAGE_KEY,
  CLEAR_CART_COOKIE_NAME,
} from '~/features/cart/constants';
import { removeCookieBrowser } from '~/utils/cookieUtils';
import { cartStateCoordinator } from '~/features/cart/utils/cartStateCoordinator';

/**
 * Gets a cookie value by name
 */
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }

  return null;
}

/**
 * Initializes the anonymous cart ID if it doesn't exist
 * This is crucial for maintaining consistent cart state between page loads
 */
function ensureAnonymousCartId(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    const existingId = window.localStorage.getItem(ANONYMOUS_CART_COOKIE_NAME);

    // Look for cart ID in the cookie too
    const cookieCartId = getCookieValue(ANONYMOUS_CART_COOKIE_NAME);

    if (cookieCartId && !existingId) {
      // If we have a cookie ID but no localStorage ID, use the cookie ID
      window.localStorage.setItem(ANONYMOUS_CART_COOKIE_NAME, cookieCartId);
      // console.log('root.client: Using anonymous cart ID from cookie:', cookieCartId);
    } else if (!existingId) {
      // If no ID exists in localStorage or cookie, create a new one
      const newId = uuidv4();
      window.localStorage.setItem(ANONYMOUS_CART_COOKIE_NAME, newId);
      // console.log('root.client: Created new anonymous cart ID:', newId);
    } else {
      // console.log('root.client: Using existing anonymous cart ID from localStorage:', existingId);
    }
  }
}

/**
 * Initialize the cart state from localStorage if available
 */
function initializeCartState(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const cartData = window.localStorage.getItem(CART_DATA_STORAGE_KEY);

      if (cartData) {
        const parsedData = JSON.parse(cartData);

        if (Array.isArray(parsedData) && parsedData.length > 0) {
          // Calculate cart item count
          const itemCount = parsedData.reduce((total, item) => total + item.quantity, 0);
          console.log('count event 18', itemCount);

          // Dispatch cart count event
          window.dispatchEvent(
            new CustomEvent(CART_COUNT_EVENT_NAME, {
              detail: {
                count: itemCount,
                timestamp: Date.now(),
              },
            })
          );

          // console.log('root.client: Initialized cart with', itemCount, 'items');
        }
      }
    } catch (err) {
      console.error('root.client: Error initializing cart state:', err);
    }
  }
}

/**
 * Checks for cart-clear cookie and clears the cart if present
 * This is used when an order is placed to ensure the cart is cleared
 */
function checkCartClearCookie(): void {
  if (typeof window !== 'undefined') {
    // Debug current cookies to help diagnose issues
    const allCookies = document.cookie;
    if (allCookies) {
      console.log('root.client: Current cookies detected:', allCookies);
    }

    const cartClearCookie = getCookieValue(CLEAR_CART_COOKIE_NAME);
    console.log('root.client: Cart clear cookie value:', cartClearCookie);

    // If we're on a product page, ensure cookie is cleared to prevent clearing the cart
    // when navigating from product to product
    const isProductPage = window.location.pathname.includes('/products/');
    if (isProductPage && cartClearCookie === 'true') {
      console.log('root.client: On product page - removing cart clear cookie to prevent issues');
      removeCookieBrowser(CLEAR_CART_COOKIE_NAME, { path: '/' });
      return;
    }

    // Only clear if we have the cookie AND
    // we're either on the confirmation page OR explicitly set the cookie
    if (cartClearCookie === 'true') {
      // Additional check: Only clear if we're on the confirmation page or just placed an order
      const isConfirmationPage = window.location.pathname.includes('/checkout/confirmation');
      const justPlacedOrder = sessionStorage.getItem('just_placed_order') === 'true';

      if (isConfirmationPage || justPlacedOrder) {
        console.log('root.client: Clearing cart based on cookie after order placement');

        // Clear cart data from localStorage
        window.localStorage.removeItem(CART_DATA_STORAGE_KEY);

        // Dispatch cart-count-update event with count 0
        console.log('count event 19', 0);

        window.dispatchEvent(
          new CustomEvent(CART_COUNT_EVENT_NAME, {
            detail: {
              count: 0,
              timestamp: Date.now(),
            },
          })
        );

        // Also dispatch a cart-cleared event that other components can listen for
        window.dispatchEvent(new CustomEvent('cart-cleared'));

        // Remove the cookie and the session flag
        sessionStorage.removeItem('just_placed_order');
        removeCookieBrowser(CLEAR_CART_COOKIE_NAME, { path: '/' });
        sessionStorage.removeItem('just_placed_order');
      } else {
        console.log('root.client: Ignoring cart clear cookie on non-confirmation page');
        // Remove the cookie anyway to prevent future issues
        removeCookieBrowser(CLEAR_CART_COOKIE_NAME, { path: '/' });
      }
    }
  }
}

// Run initialization functions
ensureAnonymousCartId();
initializeCartState();
checkCartClearCookie();

// Initialize the cart state coordinator
// This must be after the other initialization steps
if (typeof window !== 'undefined') {
  try {
    // Initialize the cart coordinator
    cartStateCoordinator.init();

    // Set the initial cart count from localStorage if available
    const cartData = localStorage.getItem(CART_DATA_STORAGE_KEY);
    if (cartData) {
      try {
        const parsedData = JSON.parse(cartData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          const itemCount = parsedData.reduce((total, item) => total + item.quantity, 0);
          console.log('root.client: Setting global cart count from localStorage:', itemCount);
          cartStateCoordinator.setCount(itemCount);
        }
      } catch (e) {
        console.error('Error parsing cart data from localStorage:', e);
      }
    }
  } catch (e) {
    console.error('Error initializing cart state coordinator:', e);
  }
}

// Export nothing - this file is for side effects only
export {};
