import { useState, useCallback, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import { CartResponseData } from '../types';
import type { CartItem, CartSummary } from '../types/cart.types';

interface CartItemParams {
  productId: string;
  quantity: number;
  price: number;
  variantId?: string;
}

interface UseCartReturn {
  cartItems: CartItem[];
  isLoading: boolean;
  summary: CartSummary;
  addToCart: (params: CartItemParams) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartError: string | null;
  cartSuccess: boolean;
  isAddingToCart: boolean;
}

const defaultSummary: CartSummary = {
  totalItems: 0,
  subtotal: 0,
  total: 0,
};

// Storage key for cart data
const CART_STORAGE_KEY = 'notalock_cart_data';

/**
 * Hook for managing shopping cart operations
 *
 * Provides functions for adding, updating, and removing items from the cart,
 * as well as state for loading, errors, and cart summary.
 */
export function useCart(): UseCartReturn {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cartFetcher = useFetcher<CartResponseData>();

  // Read cart state from localStorage on initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            setCartItems(parsedCart);
            // console.log('useCart - Loaded cart from localStorage', parsedCart);

            // Dispatch an immediate cart count update to ensure header is updated
            const totalItems = parsedCart.reduce((total, item) => total + item.quantity, 0);
            const event = new CustomEvent('cart-count-update', {
              detail: { count: totalItems, timestamp: new Date().getTime() },
            });
            window.dispatchEvent(event);
          }
        }
      } catch (err) {
        console.error('Error loading cart from localStorage:', err);
      }
    }
  }, []);

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

  // Make sure to notify the rest of the application when cart state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && cartItems.length > 0) {
      try {
        // Create a consolidated cart update event that contains all necessary data
        const event = new CustomEvent('cart-updated', {
          detail: {
            items: cartItems,
            summary: summary,
            timestamp: new Date().getTime(),
          },
        });

        // Also dispatch the count update event that Header specifically listens for
        const countEvent = new CustomEvent('cart-count-update', {
          detail: {
            count: summary.totalItems,
            timestamp: new Date().getTime(),
          },
        });

        // Dispatch both events
        window.dispatchEvent(event);
        window.dispatchEvent(countEvent);

        /*        console.log('useCart - Dispatched cart update events with', {
          itemCount: cartItems.length,
          totalItems: summary.totalItems,
        });*/

        // Save to localStorage
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        // console.log('useCart - Saved cart to localStorage', cartItems);
      } catch (err) {
        console.error('Error in cart update effect:', err);
      }
    } else if (typeof window !== 'undefined' && cartItems.length === 0) {
      // Clear localStorage if cart is empty
      localStorage.removeItem(CART_STORAGE_KEY);
      // console.log('useCart - Cleared cart from localStorage');

      // Notify that cart is empty
      window.dispatchEvent(
        new CustomEvent('cart-count-update', {
          detail: { count: 0, timestamp: new Date().getTime() },
        })
      );
    }
  }, [cartItems, summary]);

  // Add item to cart
  const addToCart = useCallback(
    async (params: CartItemParams) => {
      setIsLoading(true);
      setError(null);

      try {
        cartFetcher.submit(
          {
            action: 'add',
            productId: params.productId,
            quantity: params.quantity.toString(),
            price: params.price.toString(),
            variantId: params.variantId || '',
          },
          { method: 'post', action: '/api/cart' }
        );

        // Optimistic update (would be replaced by actual data when loader refreshes)
        setCartItems(prevItems => {
          const existingItemIndex = prevItems.findIndex(
            item =>
              item.product_id === params.productId &&
              (item.variant_id || null) === (params.variantId || null)
          );

          if (existingItemIndex >= 0) {
            // Update existing item
            const updatedItems = [...prevItems];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + params.quantity,
            };
            return updatedItems;
          } else {
            // Add new item
            const newItem: CartItem = {
              id: `temp-${Date.now()}`,
              cart_id: 'temp',
              product_id: params.productId,
              variant_id: params.variantId || null,
              quantity: params.quantity,
              price: params.price,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            return [...prevItems, newItem];
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add to cart');
      }
    },
    [cartFetcher]
  );

  // Update cart item quantity
  const updateCartItem = useCallback(
    async (itemId: string, quantity: number) => {
      setIsLoading(true);
      setError(null);

      try {
        // Future implementation: API call to update quantity
        console.log(`useCart - Updating item ${itemId} to quantity ${quantity}`);

        // Find the item in cartItems or fall back to looking in localStorage
        const findAndUpdateItem = (items: CartItem[]): CartItem[] => {
          const existingItemIndex = items.findIndex(item => item.id === itemId);

          if (existingItemIndex >= 0) {
            // Item exists in the current array, update it
            const updatedItems = [...items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity,
              updated_at: new Date().toISOString(),
            };
            console.log(
              `useCart - Found and updated item at index ${existingItemIndex}`,
              updatedItems
            );
            return updatedItems;
          } else {
            // Item not found in current array
            console.log(
              `useCart - Item ${itemId} not found in current state, checking localStorage`
            );

            // Try to load from localStorage as a fallback
            if (typeof window !== 'undefined') {
              try {
                const savedCart = localStorage.getItem(CART_STORAGE_KEY);
                if (savedCart) {
                  const parsedItems = JSON.parse(savedCart) as CartItem[];
                  if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                    const localItemIndex = parsedItems.findIndex(item => item.id === itemId);

                    if (localItemIndex >= 0) {
                      // Item found in localStorage, update it
                      const updatedItems = [...parsedItems];
                      updatedItems[localItemIndex] = {
                        ...updatedItems[localItemIndex],
                        quantity,
                        updated_at: new Date().toISOString(),
                      };
                      console.log(
                        `useCart - Found item in localStorage and updated it`,
                        updatedItems
                      );
                      return updatedItems;
                    }
                  }
                }
              } catch (err) {
                console.error('Error reading from localStorage:', err);
              }
            }

            // Fall back to the current items if nothing found in localStorage
            console.warn(`useCart - Item ${itemId} not found in localStorage either`);
            return items;
          }
        };

        // Perform the update
        const updatedItems = findAndUpdateItem(cartItems);
        setCartItems(updatedItems);

        // Save to localStorage immediately
        if (typeof window !== 'undefined') {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));
          console.log(
            'useCart - Immediately saved cart to localStorage after update',
            updatedItems
          );
        }

        // Dispatch a cart update event for other components
        if (typeof window !== 'undefined') {
          const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

          // Send cart update event
          window.dispatchEvent(
            new CustomEvent('cart-state-changed', {
              detail: { type: 'update', itemId, quantity, items: updatedItems },
            })
          );

          // Send count update for header
          window.dispatchEvent(
            new CustomEvent('cart-count-update', {
              detail: { count: totalItems, timestamp: new Date().getTime() },
            })
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update item');
      } finally {
        setIsLoading(false);
      }
    },
    [cartItems]
  );

  // Remove item from cart
  const removeCartItem = useCallback(
    async (itemId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Future implementation: API call to remove item
        console.log(`useCart - Removing item ${itemId}`);

        // Find and remove the item from cartItems or fall back to localStorage
        const findAndRemoveItem = (items: CartItem[]): CartItem[] => {
          const existingItemIndex = items.findIndex(item => item.id === itemId);

          if (existingItemIndex >= 0) {
            // Item exists in the current array, remove it
            const filteredItems = items.filter(item => item.id !== itemId);
            console.log(`useCart - Found and removed item at index ${existingItemIndex}`);
            return filteredItems;
          } else {
            // Item not found in current array
            console.log(
              `useCart - Item ${itemId} not found in current state, checking localStorage`
            );

            // Try to load from localStorage as a fallback
            if (typeof window !== 'undefined') {
              try {
                const savedCart = localStorage.getItem(CART_STORAGE_KEY);
                if (savedCart) {
                  const parsedItems = JSON.parse(savedCart) as CartItem[];
                  if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                    const localItemIndex = parsedItems.findIndex(item => item.id === itemId);

                    if (localItemIndex >= 0) {
                      // Item found in localStorage, remove it
                      const filteredItems = parsedItems.filter(item => item.id !== itemId);
                      console.log(`useCart - Found item in localStorage and removed it`);
                      return filteredItems;
                    }
                  }
                }
              } catch (err) {
                console.error('Error reading from localStorage:', err);
              }
            }

            // Fall back to the current items if nothing found in localStorage
            console.warn(`useCart - Item ${itemId} not found in localStorage either`);
            return items;
          }
        };

        // Perform the removal
        const filteredItems = findAndRemoveItem(cartItems);
        setCartItems(filteredItems);

        // Save to localStorage immediately
        if (typeof window !== 'undefined') {
          if (filteredItems.length > 0) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filteredItems));
          } else {
            localStorage.removeItem(CART_STORAGE_KEY);
          }
          console.log('useCart - Immediately saved cart to localStorage after remove');
        }

        // Dispatch a cart update event for other components
        if (typeof window !== 'undefined') {
          const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);

          // Send cart update event
          window.dispatchEvent(
            new CustomEvent('cart-state-changed', {
              detail: { type: 'remove', itemId, items: filteredItems },
            })
          );

          // Send count update for header
          window.dispatchEvent(
            new CustomEvent('cart-count-update', {
              detail: { count: totalItems, timestamp: new Date().getTime() },
            })
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove item');
      } finally {
        setIsLoading(false);
      }
    },
    [cartItems]
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Future implementation: API call to clear cart
      setCartItems([]);

      // Dispatch a cart update event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('cart-state-changed', {
            detail: { type: 'clear' },
          })
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset loading state when fetcher completes
  useEffect(() => {
    if (cartFetcher.state === 'idle' && isLoading) {
      setIsLoading(false);
    }
  }, [cartFetcher.state, isLoading]);

  return {
    cartItems,
    isLoading,
    summary,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    cartError: cartFetcher.data?.error || error,
    cartSuccess: !!cartFetcher.data?.success,
    isAddingToCart: cartFetcher.state === 'submitting',
  };
}
