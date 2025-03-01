import type { Cart } from './cart.types';

export interface CartResponseData {
  error?: string;
  success?: boolean;
  cart?: Cart;
}

// Add isAddingToCart to UseCartReturn interface
export interface UseCartReturn {
  addToCart: (productId: string, quantity: number) => void;
  removeFromCart?: (itemId: string) => void;
  updateCartItem?: (itemId: string, quantity: number) => void;
  isAddingToCart: boolean;
  cartError: string | null;
  cartSuccess: boolean;
}
