import React from 'react';
import { vi } from 'vitest';

// Mock cart context for testing
export const CartContext = React.createContext({
  cartItems: [],
  isLoading: false,
  summary: { totalItems: 0, subtotal: 0, total: 0 },
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
  cartError: null,
  cartSuccess: false,
  isAddingToCart: false,
});

// Mock the useCart hook
export function useCart() {
  return {
    cartItems: [],
    isLoading: false,
    summary: { totalItems: 0, subtotal: 0, total: 0 },
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    clearCart: vi.fn(),
    cartError: null,
    cartSuccess: false,
    isAddingToCart: false,
  };
}

// Mock CartProvider component
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
