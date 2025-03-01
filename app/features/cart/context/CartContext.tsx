import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import { CartResponseData } from '../types';
import type { CartItem, CartSummary } from '../types/cart.types';

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

// Storage key for cart data
const CART_STORAGE_KEY = 'notalock_cart_data';

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

  // Load cart items from localStorage once on mount
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized || typeof window === 'undefined') return;

    try {
      console.log('CartContext - Initializing cart state');
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (savedCart) {
        const parsedItems = JSON.parse(savedCart) as CartItem[];
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          // If we have items in localStorage, use those over initialCartItems
          console.log('CartContext - Loading cart from localStorage');
          setCartItems(parsedItems);

          // Dispatch event to update header
          const totalItems = parsedItems.reduce((total, item) => total + item.quantity, 0);
          const event = new CustomEvent('cart-count-update', {
            detail: { count: totalItems, timestamp: new Date().getTime() },
          });
          window.dispatchEvent(event);
        } else if (initialCartItems.length > 0) {
          // If localStorage empty but we have server items, use those
          console.log('CartContext - Using initialCartItems');
          setCartItems(initialCartItems);
        }
      } else if (initialCartItems.length > 0) {
        // No localStorage but we have server-provided items
        console.log('CartContext - Using provided initialCartItems');
        setCartItems(initialCartItems);
      }

      // Mark as initialized to prevent re-running
      setIsInitialized(true);
    } catch (err) {
      console.error('CartContext - Error initializing cart:', err);
      // Still mark as initialized to prevent retries
      setIsInitialized(true);

      // If localStorage fails, make sure we use initialCartItems
      if (initialCartItems.length > 0) {
        console.log('CartContext - Using initialCartItems after localStorage error');
        setCartItems(initialCartItems);
      }
    }
  }, [initialCartItems, isInitialized]);

  // For debugging
  useEffect(() => {
    console.log('CartContext - cartItems state updated:', cartItems);
  }, [cartItems]);

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
    // Don't save during initial load
    if (!isInitialized || typeof window === 'undefined') return;

    try {
      if (cartItems.length > 0) {
        console.log('CartContext - Saving cart to localStorage');
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));

        // Dispatch events, but use a throttled approach to avoid loops
        const timestamp = new Date().getTime();
        const countEvent = new CustomEvent('cart-count-update', {
          detail: {
            count: cartItems.reduce((total, item) => total + item.quantity, 0),
            timestamp,
          },
        });
        window.dispatchEvent(countEvent);
      } else {
        // Clear localStorage when cart is empty
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (err) {
      console.error('CartContext - Error saving to localStorage:', err);
    }
  }, [cartItems, isInitialized]);

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

          if (existingItemIndex >= 0) {
            // Update existing item
            const updatedItems = [...prevItems];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + quantity,
            };
            return updatedItems;
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
            };
            return [...prevItems, newItem];
          }
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
  const updateCartItem = useCallback(async (itemId: string, quantity: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Future implementation: API call to update quantity
      console.log(`CartContext - Updating item ${itemId} to quantity ${quantity}`);

      // Optimistic update with localStorage persistence
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
  }, []);

  // Remove item from cart
  const removeCartItem = useCallback(async (itemId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Future implementation: API call to remove item
      console.log(`CartContext - Removing item ${itemId}`);

      // Optimistic update
      setCartItems(prevItems => {
        // Filter out the item to remove
        const filteredItems = prevItems.filter(item => item.id !== itemId);
        return filteredItems;
      });

      // Dispatch an event for other components listening
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('cart-state-changed', {
            detail: { type: 'remove', itemId },
          })
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear cart
  const clearCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Future implementation: API call to clear cart

      setCartItems([]);
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
      setIsAddingToCart(false);
    }

    // Handle error from API response
    if (cartFetcher.data?.error) {
      setError(cartFetcher.data.error);
      setCartError(cartFetcher.data.error);
      setCartSuccess(false);
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

  return context;
}
