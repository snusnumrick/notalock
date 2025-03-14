import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import { CartResponseData } from '../types';
import type { CartItem, CartSummary } from '../types/cart.types';
import {
  loadCartFromStorage,
  removeItemFromStorage,
  isLocalStorageAvailable,
} from '../utils/cartStorage';
import { CART_COUNT_EVENT_NAME, CART_DATA_STORAGE_KEY } from '~/features/cart/constants';

interface CartContextValue {
  cartItems: CartItem[];
  isLoading: boolean;
  summary: CartSummary;
  addToCart: (params: {
    productId: string;
    quantity: number;
    price: number;
    variantId?: string;
  }) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  error: string | null;
  isAddingToCart: boolean;
  cartError: string | null;
  cartSuccess: boolean;
}

const defaultSummary: CartSummary = {
  totalItems: 0,
  subtotal: 0,
  total: 0,
};

// Create context with undefined default value
const CartContext = createContext<CartContextValue | undefined>(undefined);

/**
 * Provider component for cart functionality
 * Makes cart state and operations available throughout the application
 */
export function CartProvider({
  children,
  initialCartItems = [],
}: {
  children: ReactNode;
  initialCartItems?: CartItem[];
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartSuccess, setCartSuccess] = useState(false);
  const cartFetcher = useFetcher<CartResponseData>();

  // Load cart items from server or localStorage on mount
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized || typeof window === 'undefined') return;

    try {
      console.log('CartContext - Initializing cart state');

      // First try to get items from localStorage if it's available
      let storedItems: CartItem[] = [];
      try {
        const storedCartData = localStorage.getItem(CART_DATA_STORAGE_KEY);
        if (storedCartData) {
          storedItems = JSON.parse(storedCartData);
          if (!Array.isArray(storedItems)) {
            console.error('CartContext - Invalid cart data in localStorage');
            storedItems = [];
          }
        }
      } catch (localStorageErr) {
        console.error('CartContext - Error accessing localStorage:', localStorageErr);
        storedItems = [];
      }

      // Prefer localStorage items over initialCartItems when both exist
      if (storedItems.length > 0) {
        console.log(`CartContext - Using items from localStorage: ${storedItems.length} items`);
        setCartItems(storedItems);

        // Calculate total items for event
        const totalItems = storedItems.reduce((total, item) => total + item.quantity, 0);

        // Use a timeout to ensure this happens after initialization
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent(CART_COUNT_EVENT_NAME, {
              detail: { count: totalItems, timestamp: Date.now() },
            })
          );
        }, 0);
      }
      // Use server items if no localStorage items
      else if (initialCartItems && initialCartItems.length > 0) {
        console.log(`CartContext - Using server items: ${initialCartItems.length} items`);
        setCartItems(initialCartItems);

        // Save server items to localStorage
        try {
          localStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(initialCartItems));
        } catch (saveErr) {
          console.error('CartContext - Failed to save server items to localStorage:', saveErr);
        }

        // Calculate total items for event
        const totalItems = initialCartItems.reduce((total, item) => total + item.quantity, 0);

        // Use a timeout to ensure this happens after initialization
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent(CART_COUNT_EVENT_NAME, {
              detail: { count: totalItems, timestamp: Date.now() },
            })
          );
        }, 0);
      } else {
        console.log('CartContext - No items found in localStorage or server');
      }

      // Mark as initialized
      setIsInitialized(true);
    } catch (err) {
      console.error('CartContext - Error initializing cart:', err);
      setIsInitialized(true); // Prevent retries

      // Fallback to initialCartItems if available after error
      if (initialCartItems && initialCartItems.length > 0) {
        console.log('CartContext - Fallback to server items after error');
        setCartItems(initialCartItems);

        // Save server items to localStorage
        try {
          localStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(initialCartItems));
        } catch (saveErr) {
          console.error('Failed to save fallback items to storage:', saveErr);
        }
      }
    }
  }, [initialCartItems, isInitialized]);

  // For debugging
  /*
  useEffect(() => {
    console.log('CartContext - cartItems state updated:', cartItems);
  }, [cartItems]);
*/

  // Calculate cart summary
  const summary: CartSummary = cartItems.reduce(
    (acc, item) => {
      acc.totalItems += item.quantity;
      acc.subtotal += item.price * item.quantity;
      acc.total = acc.subtotal + (acc.shipping || 0) + (acc.tax || 0);
      return acc;
    },
    { ...defaultSummary }
  );

  // Save to localStorage when cartItems change, but only after initialization
  useEffect(() => {
    // Don't save during initial load or if localStorage isn't available
    if (!isInitialized || typeof window === 'undefined') return;

    try {
      // Check if localStorage is available
      if (!isLocalStorageAvailable()) {
        console.error('CartContext - localStorage is not available for saving cart');
        return;
      }

      // Save directly to localStorage with less event triggering
      if (cartItems.length > 0) {
        localStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(cartItems));
      } else {
        localStorage.removeItem(CART_DATA_STORAGE_KEY);

        // Only dispatch empty cart event if we actually cleared the cart
        // and not during initialization
        if (isInitialized) {
          window.dispatchEvent(
            new CustomEvent(CART_COUNT_EVENT_NAME, {
              detail: { count: 0, timestamp: Date.now() },
            })
          );
        }
      }
    } catch (err) {
      console.error('CartContext - Error saving cart to localStorage:', err);
    }
  }, [cartItems, isInitialized]);

  // Listen for storage events to sync localStorage changes across tabs/components
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized) return;

    // Track the last event timestamp to prevent loops
    let lastEventTimestamp = 0;
    const debounceTime = 100; // ms

    const handleStorageEvent = () => {
      try {
        // Avoid reading storage too frequently
        const now = Date.now();
        if (now - lastEventTimestamp < debounceTime) return;
        lastEventTimestamp = now;

        console.log('CartContext - Storage event detected, resyncing cart');
        const storedItems = loadCartFromStorage();

        // Only update if there's a meaningful difference
        const storedItemCount = storedItems.length;
        const currentItemCount = cartItems.length;

        if (storedItemCount !== currentItemCount) {
          console.log(`CartContext - Cart changed: ${currentItemCount} → ${storedItemCount} items`);
          setCartItems(storedItems);
        }
      } catch (err) {
        console.error('Error handling storage event:', err);
      }
    };

    // Handle cart-cleared event (triggered after order placement)
    const handleCartCleared = () => {
      console.log('CartContext - Received cart-cleared event, clearing cart state');
      setCartItems([]);
      localStorage.removeItem(CART_DATA_STORAGE_KEY);
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('cart-cleared', handleCartCleared);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('cart-cleared', handleCartCleared);
    };
  }, [cartItems.length, isInitialized]);

  // Add item to cart
  const addToCart = useCallback(
    async ({
      productId,
      quantity,
      price,
      variantId,
    }: {
      productId: string;
      quantity: number;
      price: number;
      variantId?: string;
    }) => {
      setIsLoading(true);
      setIsAddingToCart(true);
      setError(null);
      setCartError(null);
      setCartSuccess(false);

      // console.log('CartContext - Adding item to cart:', productId, quantity, price, variantId);

      try {
        cartFetcher.submit(
          {
            action: 'add',
            productId,
            quantity: quantity.toString(),
            price: price.toString(),
            variantId: variantId || '',
          },
          { method: 'post', action: '/api/cart' }
        );

        // Optimistic update (would be replaced by actual data when loader refreshes)
        setCartItems(prevItems => {
          const existingItemIndex = prevItems.findIndex(
            item =>
              item.product_id === productId && (item.variant_id || null) === (variantId || null)
          );

          let updatedItems;
          if (existingItemIndex >= 0) {
            // Update existing item
            updatedItems = [...prevItems];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + quantity,
            };
          } else {
            // Add new item
            const newItem: CartItem = {
              id: `temp-${Date.now()}`,
              cart_id: 'temp',
              product_id: productId,
              variant_id: variantId || null,
              quantity,
              price,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              // Note: We don't have product details yet for optimistic updates
              // They will be filled when the server responds or page reloads
            };
            updatedItems = [...prevItems, newItem];
          }

          // Calculate the new total items count
          const totalItems = updatedItems.reduce((total, item) => total + item.quantity, 0);

          // Dispatch event to update header with correct count
          if (typeof window !== 'undefined') {
            console.log('count event 9', totalItems);

            window.dispatchEvent(
              new CustomEvent(CART_COUNT_EVENT_NAME, {
                detail: { count: totalItems, timestamp: Date.now() },
              })
            );
          }

          return updatedItems;
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add to cart';
        setError(errorMessage);
        setCartError(errorMessage);
      } finally {
        // We'll set isAddingToCart to false in the useEffect that monitors fetcher state
        // But let's set success to true here for optimistic updates
        setCartSuccess(true);
      }
    },
    [cartFetcher]
  );

  // Add update cart item function
  const updateCartItem = useCallback(
    async (itemId: string, quantity: number) => {
      setIsLoading(true);
      setError(null);

      // console.log('CartContext - Updating item:', itemId, quantity);

      try {
        // Server API call to update quantity
        cartFetcher.submit(
          {
            action: 'update',
            itemId,
            quantity: quantity.toString(),
          },
          { method: 'post', action: '/api/cart' }
        );

        // Optimistic update
        setCartItems(prevItems => {
          // Find and update the item
          const updatedItems = prevItems.map(item =>
            item.id === itemId ? { ...item, quantity, updated_at: new Date().toISOString() } : item
          );
          return updatedItems;
        });

        // Dispatch an event for other components listening
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('cart-state-changed', {
              detail: { type: 'update', itemId, quantity },
            })
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update cart');
      } finally {
        setIsLoading(false);
      }
    },
    [cartFetcher]
  );

  // Remove item from cart
  const removeCartItem = useCallback(
    async (itemId: string) => {
      setIsLoading(true);
      setError(null);

      // console.log('CartContext - Removing item:', itemId);

      try {
        // console.log('CartContext - Removing item:', itemId);

        // Create a promise that resolves when the fetcher completes
        const fetcherPromise = new Promise((resolve, reject) => {
          const checkFetcherState = () => {
            if (cartFetcher.state === 'submitting') {
              setTimeout(checkFetcherState, 100); // Check again in 100ms
            } else if (cartFetcher.state === 'idle') {
              if (cartFetcher.data?.error) {
                console.error('Cart removal API error:', cartFetcher.data.error);
                reject(new Error(cartFetcher.data.error));
              } else {
                console.log('Cart removal API success');
                resolve(cartFetcher.data);
              }
            }
          };

          // Start checking the state
          checkFetcherState();
        });

        // Get a snapshot of the current items before removal
        const currentItems = [...cartItems];
        const remainingItems = currentItems.filter(item => item.id !== itemId);
        const currentCount = remainingItems.reduce((sum, item) => sum + item.quantity, 0);

        // console.log('CartContext - Current items:', currentItems.length);
        // console.log('CartContext - Remaining items after filter:', remainingItems.length);
        // console.log('CartContext - Remaining item count:', currentCount);

        // Server API call to remove item
        cartFetcher.submit(
          {
            action: 'remove',
            itemId,
          },
          { method: 'post', action: '/api/cart' }
        );

        // Optimistic update for UI
        setCartItems(remainingItems);

        // Directly use our utility function to update localStorage
        if (typeof window !== 'undefined') {
          removeItemFromStorage(itemId);

          // Dispatch events with the correct remaining count
          window.dispatchEvent(
            new CustomEvent('cart-state-changed', {
              detail: {
                type: 'remove',
                itemId,
                items: remainingItems,
                count: currentCount,
              },
            })
          );

          // Force UI update with accurate count
          console.log('count event 10', currentCount);

          window.dispatchEvent(
            new CustomEvent(CART_COUNT_EVENT_NAME, {
              detail: {
                count: currentCount,
                timestamp: Date.now(),
              },
            })
          );

          // Double-check localStorage after a short delay
          setTimeout(() => {
            try {
              const storedCart = localStorage.getItem(CART_DATA_STORAGE_KEY);
              if (storedCart) {
                const storedItems = JSON.parse(storedCart);
                // If counts don't match, force an update
                if (storedItems.length !== remainingItems.length) {
                  // console.log('CartContext - Fixing inconsistent state after removal');
                  setCartItems(storedItems);

                  // Update count again
                  const updatedCount = storedItems.reduce(
                    (sum: number, item: CartItem) => sum + item.quantity,
                    0
                  );
                  console.log('count event 11', updatedCount);

                  window.dispatchEvent(
                    new CustomEvent(CART_COUNT_EVENT_NAME, {
                      detail: {
                        count: updatedCount,
                        timestamp: Date.now(),
                      },
                    })
                  );
                }
              }
            } catch (e) {
              console.error('Error checking localStorage consistency:', e);
            }
          }, 300);
        }

        // Wait for the API call to complete
        await fetcherPromise;

        // After server confirms removal, verify our local state
        if (cartItems.some(item => item.id === itemId)) {
          console.log('Item still in context after removal, forcing update');
          setCartItems(prev => prev.filter(item => item.id !== itemId));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to remove item';
        console.error('Error removing item:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [cartFetcher, cartItems]
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // console.log('CartContext - Clearing cart');

    try {
      // Server API call to clear cart
      cartFetcher.submit(
        {
          action: 'clear',
        },
        { method: 'post', action: '/api/cart' }
      );

      // Clear local state
      setCartItems([]);

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CART_DATA_STORAGE_KEY);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
    } finally {
      setIsLoading(false);
    }
  }, [cartFetcher]);

  // Reset loading state when fetcher completes
  useEffect(() => {
    if (cartFetcher.state === 'idle' && isLoading) {
      setIsLoading(false);
      setIsAddingToCart(false);
    }

    // Handle error from API response
    if (cartFetcher.data?.error) {
      setError(cartFetcher.data.error);
      setCartError(cartFetcher.data.error);
      setCartSuccess(false);
    }

    // Update cart items if the API returns updated cart data
    if (cartFetcher.data?.cart) {
      // Fix: Convert the cart data to match CartItem[] type expectations
      const updatedCart = cartFetcher.data.cart as unknown as CartItem[];
      setCartItems(updatedCart);

      // Calculate and dispatch the updated cart count after server response
      if (typeof window !== 'undefined') {
        const totalItems = updatedCart.reduce((total, item) => total + item.quantity, 0);
        console.log(
          'CartContext - Server returned updated cart. Dispatching count update:',
          totalItems
        );
        window.dispatchEvent(
          new CustomEvent(CART_COUNT_EVENT_NAME, {
            detail: { count: totalItems, timestamp: Date.now() },
          })
        );
      }
    }
  }, [cartFetcher.state, cartFetcher.data, isLoading]);

  // Context value
  const value: CartContextValue = {
    cartItems,
    isLoading,
    summary,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    error,
    isAddingToCart,
    cartError,
    cartSuccess,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Hook to access cart functionality
 * Must be used within a CartProvider
 */
export function useCart() {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }

  // console.log('useCart - returning context:', context);
  return context;
}
