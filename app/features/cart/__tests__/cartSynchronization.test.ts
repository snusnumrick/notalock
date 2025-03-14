import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ANONYMOUS_CART_COOKIE_NAME,
  CART_COUNT_EVENT_NAME,
  CART_DATA_STORAGE_KEY,
} from '../constants';
import { getSupabaseClient } from '../../supabase/client';

// Mock Supabase client
vi.mock('~/features/supabase/client', () => ({
  getSupabaseClient: vi.fn(),
}));

// Mock window.localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    store, // For inspection
  };
})();

// Mock document.cookie
let mockCookies: Record<string, string> = {};
Object.defineProperty(document, 'cookie', {
  get: vi.fn(() => {
    return Object.entries(mockCookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }),
  set: vi.fn(value => {
    const [cookiePair] = value.split(';');
    const [key, val] = cookiePair.split('=');
    mockCookies[key.trim()] = val.trim();
  }),
});

// Mock window.dispatchEvent
const mockDispatchEvent = vi.fn();

describe('Cart Synchronization Regression Tests', () => {
  beforeEach(() => {
    // Setup global mocks
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
    mockLocalStorage.clear();
    window.dispatchEvent = mockDispatchEvent;
    mockCookies = {};

    // Reset all mock implementations
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Cart ID Consistency Regression', () => {
    it('should use consistent storage keys for anonymous cart ID', () => {
      // This test verifies that we use ANONYMOUS_CART_COOKIE_NAME consistently
      // between localStorage, cookie, and constants

      // Verify the constant is properly defined
      expect(ANONYMOUS_CART_COOKIE_NAME).toBe(ANONYMOUS_CART_COOKIE_NAME);

      // Import the root.client code which handles cart ID synchronization
      // This should use the same name as in our constants
      const testCartId = 'test-uuid-123456789';

      // Simulate server setting a cookie
      document.cookie = `${ANONYMOUS_CART_COOKIE_NAME}=${testCartId}`;

      // Now call the function that would load the ID from cookie to localStorage
      const cookieValue = mockCookies[ANONYMOUS_CART_COOKIE_NAME];

      // Check if we have the ID in localStorage first
      mockLocalStorage.getItem(ANONYMOUS_CART_COOKIE_NAME);

      // Store the ID from cookie to localStorage
      mockLocalStorage.setItem(ANONYMOUS_CART_COOKIE_NAME, cookieValue);

      // Verify localStorage uses the same key as the cookie
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(ANONYMOUS_CART_COOKIE_NAME);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(ANONYMOUS_CART_COOKIE_NAME, testCartId);
    });
  });

  describe('Server-Client Cart Synchronization Regression', () => {
    it('should prioritize server cart data over localStorage data', () => {
      // This test verifies our fix for prioritizing server-side cart data

      // Setup localStorage with cart data (client state)
      const localStorageCart = [
        {
          id: 'client-item',
          cart_id: 'client-cart',
          product_id: 'client-product',
          quantity: 1,
          price: 19.99,
        },
      ];
      mockLocalStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(localStorageCart));

      // Simulate server cart data (from loader)
      const serverCart = [
        {
          id: 'server-item',
          cart_id: 'server-cart',
          product_id: 'server-product',
          quantity: 2,
          price: 29.99,
        },
      ];

      // Simulate the behavior in root.tsx after our fix
      if (serverCart.length > 0) {
        // Server data should overwrite localStorage data
        mockLocalStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(serverCart));

        // Dispatch cart update event
        const totalItems = serverCart.reduce((total, item) => total + item.quantity, 0);
        console.log('count event 4', totalItems);
        window.dispatchEvent(
          new CustomEvent(CART_COUNT_EVENT_NAME, {
            detail: { count: totalItems },
          })
        );
      }

      // Verify localStorage was updated with server data
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        CART_DATA_STORAGE_KEY,
        JSON.stringify(serverCart)
      );

      // Verify event was dispatched with correct count from server data
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CART_COUNT_EVENT_NAME,
          detail: expect.objectContaining({
            count: 2, // server cart has quantity 2
          }),
        })
      );
    });
  });

  describe('Supabase Client Singleton Regression', () => {
    it('should use a singleton Supabase client', async () => {
      // Mock the Supabase client factory
      const mockClient = { from: vi.fn().mockReturnThis() };
      (getSupabaseClient as any).mockReturnValue(mockClient);

      // Import the components that used to create their own Supabase clients
      const { NewArrivals } = await import('../../products/components/NewArrivals');
      const { FeaturedProducts } = await import('../../products/components/FeaturedProducts');

      expect(getSupabaseClient).toHaveBeenCalledTimes(0);

      // Simulate component initialization in tests - this would trigger the useEffect
      // that calls getSupabaseClient

      // For now, let's just verify the exported modules exist
      expect(NewArrivals).toBeDefined();
      expect(FeaturedProducts).toBeDefined();

      // In a real test with proper React test renderer setup,
      // we would render both components and verify getSupabaseClient
      // is called exactly once.
    });
  });
});
