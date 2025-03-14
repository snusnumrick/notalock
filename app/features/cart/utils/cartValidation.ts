import type { CartItem } from '../types/cart.types';

/**
 * Consolidates duplicate items in the cart with the same product ID
 * This is essential to prevent issues where the same product appears multiple times
 *
 * @param cartItems Array of cart items to consolidate
 * @returns Consolidated array of cart items
 */
export function consolidateCartItems(cartItems: CartItem[]): CartItem[] {
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return [];
  }

  console.log('CART VALIDATION: Consolidating cart items', cartItems.length);

  // Map to hold unique products by their ID
  const productMap = new Map();
  let needsConsolidation = false;

  // First pass - check if we need consolidation
  cartItems.forEach(item => {
    const key = `${item.product_id}:${item.variant_id || 'null'}`;
    if (productMap.has(key)) {
      needsConsolidation = true;
      console.log(`CART VALIDATION: Found duplicate product ${key}, will combine quantities`);
    }
    productMap.set(key, item);
  });

  // If no consolidation needed, return original array
  if (!needsConsolidation) {
    console.log('CART VALIDATION: No consolidation needed');
    return cartItems;
  }

  // Second pass - actually consolidate items
  productMap.clear(); // Reset the map
  const result: CartItem[] = [];

  cartItems.forEach(item => {
    const key = `${item.product_id}:${item.variant_id || 'null'}`;
    if (productMap.has(key)) {
      // Update existing item's quantity
      const existingItemIndex = productMap.get(key);
      const existingItem = result[existingItemIndex];
      existingItem.quantity += item.quantity;
      console.log(
        `CART VALIDATION: Combined ${item.product_id} quantities: ${existingItem.quantity - item.quantity} + ${item.quantity} = ${existingItem.quantity}`
      );
    } else {
      // Add new item to result and store its index
      productMap.set(key, result.length);
      result.push({ ...item }); // Clone to avoid modifying original
    }
  });

  console.log(
    `CART VALIDATION: Consolidated ${cartItems.length} items into ${result.length} items`
  );
  return result;
}

/**
 * Validates cart items for checkout
 * - Ensures all items have valid product_id and quantity
 * - Consolidates duplicate items
 *
 * @param cartItems Array of cart items to validate
 * @returns Validated and consolidated cart items
 */
export function validateCartForCheckout(cartItems: CartItem[]): CartItem[] {
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return [];
  }

  console.log('CART VALIDATION: Validating cart for checkout', cartItems.length);

  // Filter out invalid items
  const validItems = cartItems.filter(
    item => item && item.product_id && item.quantity && item.quantity > 0
  );

  if (validItems.length !== cartItems.length) {
    console.log(`CART VALIDATION: Removed ${cartItems.length - validItems.length} invalid items`);
  }

  // Consolidate items
  return consolidateCartItems(validItems);
}
