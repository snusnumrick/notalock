import { describe, it, expect } from 'vitest';
import { consolidateCartItems, validateCartForCheckout } from '../cartValidation';
import type { CartItem } from '../../types/cart.types';

describe('Cart Validation Utilities', () => {
  describe('consolidateCartItems', () => {
    it('should return empty array for null or empty input', () => {
      expect(consolidateCartItems(null as any)).toEqual([]);
      expect(consolidateCartItems([] as any)).toEqual([]);
      expect(consolidateCartItems(undefined as any)).toEqual([]);
    });

    it('should return the original array if no consolidation is needed', () => {
      // Arrange
      const cartItems: CartItem[] = [
        {
          id: '1',
          cart_id: 'cart1',
          product_id: 'product1',
          variant_id: null,
          quantity: 1,
          price: 10,
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          cart_id: 'cart1',
          product_id: 'product2',
          variant_id: null,
          quantity: 2,
          price: 20,
          created_at: '',
          updated_at: '',
        },
      ];

      // Act
      const result = consolidateCartItems(cartItems);

      // Assert
      expect(result).toEqual(cartItems);
    });

    it('should consolidate items with the same product_id', () => {
      // Arrange
      const cartItems: CartItem[] = [
        {
          id: '1',
          cart_id: 'cart1',
          product_id: 'product1',
          variant_id: null,
          quantity: 1,
          price: 10,
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          cart_id: 'cart1',
          product_id: 'product1', // Same product ID
          variant_id: null,
          quantity: 2,
          price: 10,
          created_at: '',
          updated_at: '',
        },
        {
          id: '3',
          cart_id: 'cart1',
          product_id: 'product2',
          variant_id: null,
          quantity: 3,
          price: 20,
          created_at: '',
          updated_at: '',
        },
      ];

      // Act
      const result = consolidateCartItems(cartItems);

      // Assert
      expect(result.length).toBe(2); // Should have 2 items after consolidation

      // Find the consolidated item
      const consolidatedItem = result.find(item => item.product_id === 'product1');
      expect(consolidatedItem).toBeDefined();
      expect(consolidatedItem?.quantity).toBe(3); // 1 + 2

      // Check the other item remains unchanged
      const unchangedItem = result.find(item => item.product_id === 'product2');
      expect(unchangedItem).toBeDefined();
      expect(unchangedItem?.quantity).toBe(3);
    });

    it('should handle variant_id correctly during consolidation', () => {
      // Arrange
      const cartItems: CartItem[] = [
        {
          id: '1',
          cart_id: 'cart1',
          product_id: 'product1',
          variant_id: 'variant1',
          quantity: 1,
          price: 10,
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          cart_id: 'cart1',
          product_id: 'product1',
          variant_id: 'variant2', // Same product but different variant
          quantity: 2,
          price: 10,
          created_at: '',
          updated_at: '',
        },
        {
          id: '3',
          cart_id: 'cart1',
          product_id: 'product1',
          variant_id: 'variant1', // Should consolidate with first item
          quantity: 3,
          price: 10,
          created_at: '',
          updated_at: '',
        },
      ];

      // Act
      const result = consolidateCartItems(cartItems);

      // Assert
      expect(result.length).toBe(2); // Should have 2 items after consolidation

      // Check variant1 consolidation
      const variant1Item = result.find(
        item => item.product_id === 'product1' && item.variant_id === 'variant1'
      );
      expect(variant1Item).toBeDefined();
      expect(variant1Item?.quantity).toBe(4); // 1 + 3

      // Check variant2 item remains separate
      const variant2Item = result.find(
        item => item.product_id === 'product1' && item.variant_id === 'variant2'
      );
      expect(variant2Item).toBeDefined();
      expect(variant2Item?.quantity).toBe(2);
    });
  });

  describe('validateCartForCheckout', () => {
    it('should filter out invalid items', () => {
      // Arrange
      const cartItems: CartItem[] = [
        {
          id: '1',
          cart_id: 'cart1',
          product_id: 'product1',
          variant_id: null,
          quantity: 1,
          price: 10,
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          cart_id: 'cart1',
          product_id: '', // Invalid product_id
          variant_id: null,
          quantity: 2,
          price: 20,
          created_at: '',
          updated_at: '',
        },
        {
          id: '3',
          cart_id: 'cart1',
          product_id: 'product3',
          variant_id: null,
          quantity: 0, // Invalid quantity
          price: 30,
          created_at: '',
          updated_at: '',
        },
        null as any, // Invalid item
      ];

      // Act
      const result = validateCartForCheckout(cartItems);

      // Assert
      expect(result.length).toBe(1); // Only one valid item
      expect(result[0].id).toBe('1');
      expect(result[0].product_id).toBe('product1');
    });

    it('should both filter and consolidate items', () => {
      // Arrange
      const cartItems: CartItem[] = [
        {
          id: '1',
          cart_id: 'cart1',
          product_id: 'product1',
          variant_id: null,
          quantity: 1,
          price: 10,
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          cart_id: 'cart1',
          product_id: '', // Invalid product_id
          variant_id: null,
          quantity: 2,
          price: 20,
          created_at: '',
          updated_at: '',
        },
        {
          id: '3',
          cart_id: 'cart1',
          product_id: 'product1', // Same as first item
          variant_id: null,
          quantity: 3,
          price: 10,
          created_at: '',
          updated_at: '',
        },
      ];

      // Act
      const result = validateCartForCheckout(cartItems);

      // Assert
      expect(result.length).toBe(1); // One consolidated item after filtering
      expect(result[0].product_id).toBe('product1');
      expect(result[0].quantity).toBe(4); // 1 + 3
    });
  });
});
