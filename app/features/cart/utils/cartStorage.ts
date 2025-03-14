import type { CartItem } from '../types/cart.types';

// Import the storage key for cart data
import { CART_DATA_STORAGE_KEY } from '../constants';

/**
 * Check if localStorage is available and accessible
 * This helps prevent errors in environments where localStorage might be restricted
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;

  try {
    // Try a test write/read to localStorage
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    const testResult = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return testResult === 'test';
  } catch (e) {
    return false;
  }
}

/**
 * Save cart items to localStorage without dispatching events
 * This is a lower-level function that just handles storage
 */
export function saveCartToStorage(cartItems: CartItem[]): void {
  if (!isLocalStorageAvailable()) return;

  try {
    if (cartItems.length > 0) {
      console.log('saveCartToStorage - Saving cart items:', cartItems.length);
      localStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(cartItems));
    } else {
      console.log('saveCartToStorage - Clearing cart from localStorage');
      localStorage.removeItem(CART_DATA_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Error saving cart to localStorage:', err);
  }
}

/**
 * Load cart items from localStorage
 */
export function loadCartFromStorage(): CartItem[] {
  if (!isLocalStorageAvailable()) return [];

  try {
    const savedCart = localStorage.getItem(CART_DATA_STORAGE_KEY);
    if (!savedCart) return [];

    const parsedItems = JSON.parse(savedCart) as CartItem[];
    if (Array.isArray(parsedItems)) {
      // console.log('loadCartFromStorage - Loaded cart items:', parsedItems.length);
      return parsedItems;
    }
  } catch (err) {
    console.error('Error loading cart from localStorage:', err);
  }

  return [];
}

/**
 * Clear cart from localStorage without dispatching events
 * This is a lower-level function that just handles storage
 */
export function clearCartStorage(): void {
  if (!isLocalStorageAvailable()) return;

  try {
    console.log('clearCartStorage - Removing cart from localStorage');
    localStorage.removeItem(CART_DATA_STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing cart storage:', err);
  }
}

/**
 * Remove a specific item from the cart in localStorage without dispatching events
 * This is a lower-level function that just handles storage
 */
export function removeItemFromStorage(itemId: string): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const cartItems = loadCartFromStorage();
    if (cartItems.length === 0) return;

    const updatedItems = cartItems.filter(item => item.id !== itemId);
    console.log(
      `removeItemFromStorage - Removing item ${itemId}, ${cartItems.length} -> ${updatedItems.length} items`
    );

    if (updatedItems.length > 0) {
      localStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(updatedItems));
    } else {
      localStorage.removeItem(CART_DATA_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Error removing item from cart storage:', err);
  }
}

/**
 * Check if localStorage cart exists and has items
 */
export function hasCartInStorage(): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    const savedCart = localStorage.getItem(CART_DATA_STORAGE_KEY);
    if (!savedCart) return false;

    const parsedItems = JSON.parse(savedCart) as CartItem[];
    return Array.isArray(parsedItems) && parsedItems.length > 0;
  } catch (err) {
    console.error('Error checking cart in localStorage:', err);
    return false;
  }
}
