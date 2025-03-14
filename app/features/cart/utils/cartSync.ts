import type { CartItem } from '../types/cart.types';
import { CART_DATA_STORAGE_KEY } from '~/features/cart/constants';

/**
 * Synchronizes cart data between two sources (header and checkout)
 * to ensure consistent display across the application
 */
export function syncCartData(cartItems: CartItem[]): CartItem[] {
  if (!cartItems || !Array.isArray(cartItems)) {
    return [];
  }

  // Log the incoming cart data
  // console.log('CART SYNC: Processing cart data with', cartItems.length, 'items');

  // Find the correct quantity from localStorage if possible
  if (typeof window !== 'undefined') {
    try {
      const storedCartData = localStorage.getItem(CART_DATA_STORAGE_KEY);

      if (storedCartData) {
        const storedCart = JSON.parse(storedCartData) as CartItem[];
        // console.log('CART SYNC: Found', storedCart.length, 'items in localStorage');

        // If localStorage has items, prefer those quantities
        if (storedCart.length > 0) {
          // Create a map of stored items by product ID
          const storedItemMap = new Map();
          storedCart.forEach(item => {
            storedItemMap.set(item.product_id, item);
          });

          // Update quantities in our cart items
          const updatedItems = cartItems.map(item => {
            const storedItem = storedItemMap.get(item.product_id);
            if (storedItem) {
              console.log(
                `CART SYNC: Updating ${item.product_id} quantity from ${item.quantity} to ${storedItem.quantity}`
              );
              return {
                ...item,
                quantity: storedItem.quantity,
              };
            }
            return item;
          });

          return updatedItems;
        }
      }
    } catch (err) {
      console.error('Error syncing cart data:', err);
    }
  }

  return cartItems;
}
