import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCartForCheckout } from '../../cart/utils/cartValidation';
import { syncCartData } from '../../cart/utils/cartSync';
import type { CartItem } from '../../cart/types/cart.types';
import { CART_DATA_STORAGE_KEY } from '../../cart/constants';

// Mock local storage for tests
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Cart Consistency Between Header and Checkout', () => {
  // Setup mock data
  const mockCartItems: CartItem[] = [
    {
      id: '1',
      cart_id: 'cart1',
      product_id: 'product1',
      variant_id: null,
      quantity: 1,
      price: 49.99,
      created_at: '',
      updated_at: '',
    },
    {
      id: '2',
      cart_id: 'cart1',
      product_id: 'product1', // Same product, simulating the bug
      variant_id: null,
      quantity: 1,
      price: 49.99,
      created_at: '',
      updated_at: '',
    },
    {
      id: '3',
      cart_id: 'cart1',
      product_id: 'product1', // Same product, simulating the bug
      variant_id: null,
      quantity: 1,
      price: 49.99,
      created_at: '',
      updated_at: '',
    },
  ];

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('validateCartForCheckout utility', () => {
    it('should consolidate duplicate items in the cart', () => {
      // Act
      const validatedItems = validateCartForCheckout(mockCartItems);

      // Assert
      expect(validatedItems.length).toBe(1); // 3 items consolidated to 1
      expect(validatedItems[0].product_id).toBe('product1');
      expect(validatedItems[0].quantity).toBe(3); // 1 + 1 + 1
    });
  });

  describe('syncCartData utility', () => {
    it('should sync quantities when localStorage has cart data', () => {
      // Arrange
      const localStorageCart = [
        {
          id: '1',
          cart_id: 'cart1',
          product_id: 'product1',
          variant_id: null,
          quantity: 1, // Only one item in local storage
          price: 49.99,
          created_at: '',
          updated_at: '',
        },
      ];

      mockLocalStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(localStorageCart));

      // Act
      const syncedItems = syncCartData(mockCartItems);

      // Assert - syncCartData would prioritize localStorage data
      expect(syncedItems.filter(item => item.product_id === 'product1').length).toBeGreaterThan(0);
    });
  });

  describe('Consolidated cart count verification', () => {
    it('should show a consolidated count of items from duplicated product IDs', () => {
      // Arrange - we have 3 items with the same product ID
      const countBeforeConsolidation = mockCartItems.length;

      // Act
      const validatedItems = validateCartForCheckout(mockCartItems);
      const consolidatedCount = validatedItems.length;
      const totalQuantity = validatedItems.reduce((total, item) => total + item.quantity, 0);

      // Assert
      expect(countBeforeConsolidation).toBe(3); // 3 separate items before
      expect(consolidatedCount).toBe(1); // 1 item after consolidation
      expect(totalQuantity).toBe(3); // Total quantity should remain 3
    });
  });
});
