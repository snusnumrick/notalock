import { useCart as useContextCart } from '../context/CartContext';

/**
 * Hook for managing shopping cart operations
 *
 * This is now a thin wrapper around the CartContext for backward compatibility
 * All cart operations are delegated to the CartContext provider
 */
export function useCart() {
  // Use the context-based cart implementation
  const {
    cartItems,
    isLoading,
    summary,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    error: cartError,
    cartSuccess,
    isAddingToCart,
  } = useContextCart();

  return {
    cartItems,
    isLoading,
    summary,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    cartError,
    cartSuccess,
    isAddingToCart,
  };
}
