import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { CartItem } from '../../features/cart/types/cart.types';

// Mock necessary modules
vi.mock('@remix-run/react', () => ({
  useFetcher: () => ({
    submit: vi.fn(),
    state: 'idle',
    data: null,
  }),
  useLoaderData: () => ({ initialCartItems: [] }),
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
}));

// Create mock navigate function
const mockNavigate = vi.fn();

// Mock localStorage
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
  };
})();

// Mock fetch API for direct API calls
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true }),
});

// Setup global mocks
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
window.dispatchEvent = vi.fn();
global.fetch = mockFetch;

// Import the actual components being tested
import { CartProvider, useCart } from '../../features/cart/context/CartContext';
import {
  ANONYMOUS_CART_COOKIE_NAME,
  CART_COUNT_EVENT_NAME,
  CART_DATA_STORAGE_KEY,
} from '../../features/cart/constants';

// Test component to simulate the cart page
const CartRemovalTest = () => {
  const { cartItems, removeCartItem } = useCart();
  const [clientItems, setClientItems] = React.useState<CartItem[]>([]);
  const [hasInitialized, setHasInitialized] = React.useState(false);

  // Initialize client items from cart context
  React.useEffect(() => {
    if (!hasInitialized && cartItems.length > 0) {
      setClientItems(cartItems);
      setHasInitialized(true);
    }
  }, [cartItems, hasInitialized]);

  // Function to handle item removal (simulating our implementation)
  const handleRemoveItem = async (itemId: string) => {
    console.log('Removing item:', itemId);

    // Get the anonymous cart ID and preferred cart ID
    const anonymousCartId = localStorage.getItem(ANONYMOUS_CART_COOKIE_NAME) || '';
    const preferredCartId = anonymousCartId
      ? localStorage.getItem(`preferred_cart_${anonymousCartId}`) || ''
      : '';

    // 1. Update client-side state immediately
    setClientItems(prev => prev.filter(item => item.id !== itemId));

    // 2. Update localStorage directly
    try {
      const cartData = localStorage.getItem(CART_DATA_STORAGE_KEY);
      if (cartData) {
        const items = JSON.parse(cartData);
        const updatedStorageItems = items.filter((item: any) => item.id !== itemId);
        localStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(updatedStorageItems));

        // Dispatch cart update event
        console.log('count event 22', updatedStorageItems.length);

        window.dispatchEvent(
          new CustomEvent(CART_COUNT_EVENT_NAME, {
            detail: { count: updatedStorageItems.length, timestamp: Date.now() },
          })
        );
      }
    } catch (e) {
      console.error('Error updating localStorage:', e);
    }

    // 3. Attempt context-based removal
    try {
      await removeCartItem(itemId);
    } catch (e) {
      console.error('Error in removeCartItem:', e);
    }

    // 4. Make direct API call as backup
    try {
      await fetch('/api/direct-cart-remove', {
        method: 'POST',
        body: new URLSearchParams({
          itemId,
          anonymousCartId,
          preferredCartId,
        }),
      });
    } catch (e) {
      console.error('Error in direct API call:', e);
    }

    // 5. Make emergency cart clear call if needed
    try {
      // Check if item still exists after all attempts
      const cartData = localStorage.getItem(CART_DATA_STORAGE_KEY);
      if (cartData) {
        const items = JSON.parse(cartData);
        const itemStillExists = items.some((item: CartItem) => item.id === itemId);

        if (itemStillExists) {
          console.log('Item still exists, using emergency clear for specific item');
          const formData = new FormData();
          formData.append('itemId', itemId);
          await fetch('/api/emergency-cart-clear', {
            method: 'POST',
            body: formData,
          });
        }
      }
    } catch (e) {
      console.error('Error in emergency cart clear:', e);
    }
  };

  return (
    <div>
      <h1>Cart Page</h1>
      <div>
        <h2>Items</h2>
        {clientItems.length === 0 ? (
          <p data-testid="empty-cart">Your cart is empty</p>
        ) : (
          <ul>
            {clientItems.map(item => (
              <li key={item.id} data-testid={`item-${item.id}`}>
                {item.product_id} - Qty: {item.quantity}
                <button data-testid={`remove-${item.id}`} onClick={() => handleRemoveItem(item.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

describe('Cart Item Removal', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockNavigate.mockReset();
    mockFetch.mockClear();
  });

  it('immediately removes item from UI when trash button is clicked', async () => {
    // Setup test cart with two items
    const testCartItems: CartItem[] = [
      {
        id: 'item-1',
        cart_id: 'cart-1',
        product_id: 'prod-1',
        quantity: 1,
        price: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
      {
        id: 'item-2',
        cart_id: 'cart-1',
        product_id: 'prod-2',
        quantity: 2,
        price: 20,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    // Ensure we mock localStorage with the correct initial test data
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return JSON.stringify(testCartItems);
      }
      if (key === '__storage_test__') {
        return 'test';
      }
      if (key.startsWith('preferred_cart_') || key === ANONYMOUS_CART_COOKIE_NAME) {
        return null;
      }
      return null;
    });

    // Clear any previous setItem calls
    mockLocalStorage.setItem.mockClear();

    render(
      <MemoryRouter>
        <CartProvider>
          <CartRemovalTest />
        </CartProvider>
      </MemoryRouter>
    );

    // Verify both items are initially displayed
    await waitFor(() => {
      expect(screen.getByTestId('item-item-1')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId('item-item-2')).toBeInTheDocument();
    });

    // Click the remove button for the first item
    fireEvent.click(screen.getByTestId('remove-item-1'));

    // Verify first item is removed from UI
    await waitFor(() => {
      expect(screen.queryByTestId('item-item-1')).not.toBeInTheDocument();
    });

    // Verify second item remains in UI
    await waitFor(() => {
      expect(screen.getByTestId('item-item-2')).toBeInTheDocument();
    });

    // Verify localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalled();

    // Verify cart update event was dispatched
    expect(window.dispatchEvent).toHaveBeenCalled();

    // Verify direct API was called as backup
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/direct-cart-remove',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(URLSearchParams),
      })
    );
  });

  it('shows empty cart message when all items are removed', async () => {
    // Setup test cart with one item
    const testCartItems: CartItem[] = [
      {
        id: 'item-1',
        cart_id: 'cart-1',
        product_id: 'prod-1',
        quantity: 1,
        price: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    // Ensure we mock localStorage with the correct initial test data
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return JSON.stringify(testCartItems);
      }
      if (key === '__storage_test__') {
        return 'test';
      }
      if (key.startsWith('preferred_cart_') || key === ANONYMOUS_CART_COOKIE_NAME) {
        return null;
      }
      return null;
    });

    // Clear any previous setItem calls
    mockLocalStorage.setItem.mockClear();

    render(
      <MemoryRouter>
        <CartProvider>
          <CartRemovalTest />
        </CartProvider>
      </MemoryRouter>
    );

    // Verify item is initially displayed
    await waitFor(() => {
      expect(screen.getByTestId('item-item-1')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByTestId('empty-cart')).not.toBeInTheDocument();
    });

    // Click the remove button
    fireEvent.click(screen.getByTestId('remove-item-1'));

    // Verify item is removed
    await waitFor(() => {
      expect(screen.queryByTestId('item-item-1')).not.toBeInTheDocument();
    });

    // Verify empty cart message is displayed
    await waitFor(() => {
      expect(screen.getByTestId('empty-cart')).toBeInTheDocument();
    });
  });

  it('continues to function even if API call fails', async () => {
    // Setup test cart with one item
    const testCartItems: CartItem[] = [
      {
        id: 'item-1',
        cart_id: 'cart-1',
        product_id: 'prod-1',
        quantity: 1,
        price: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    // Ensure we mock localStorage with the correct initial test data
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return JSON.stringify(testCartItems);
      }
      if (key === '__storage_test__') {
        return 'test';
      }
      if (key.startsWith('preferred_cart_') || key === ANONYMOUS_CART_COOKIE_NAME) {
        return null;
      }
      return null;
    });

    // Clear any previous setItem calls
    mockLocalStorage.setItem.mockClear();

    // Make the fetch API fail
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter>
        <CartProvider>
          <CartRemovalTest />
        </CartProvider>
      </MemoryRouter>
    );

    // Verify item is initially displayed
    await waitFor(() => {
      expect(screen.getByTestId('item-item-1')).toBeInTheDocument();
    });

    // Click the remove button
    fireEvent.click(screen.getByTestId('remove-item-1'));

    // Verify item is removed from UI despite API failure
    await waitFor(() => {
      expect(screen.queryByTestId('item-item-1')).not.toBeInTheDocument();
    });

    // Verify empty cart message is shown
    await waitFor(() => {
      expect(screen.getByTestId('empty-cart')).toBeInTheDocument();
    });

    // Verify localStorage was still updated
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('uses emergency cart clear with specific item ID when removal fails', async () => {
    // Create test cart items
    const testCartItems: CartItem[] = [
      {
        id: 'item-1',
        cart_id: 'cart-1',
        product_id: 'prod-1',
        quantity: 1,
        price: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
      {
        id: 'item-2',
        cart_id: 'cart-1',
        product_id: 'prod-2',
        quantity: 2,
        price: 20,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    // Setup a custom implementation of mockLocalStorage.getItem
    // This version will return the full test cart items after an attempt to remove item-1
    let hasAttemptedRemoval = false;
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        // After setItem has been called (indicating a removal attempt),
        // return the original items to simulate failed removal
        if (hasAttemptedRemoval) {
          return JSON.stringify(testCartItems);
        }
        // Before removal attempt, return normal items
        return JSON.stringify(testCartItems);
      }
      return null;
    });

    // Intercept localStorage.setItem to detect removal attempt
    mockLocalStorage.setItem.mockImplementation((key, _value) => {
      if (key === CART_DATA_STORAGE_KEY) {
        hasAttemptedRemoval = true;
      }
    });

    // Setup a spy for the fetch call to emergency-cart-clear
    const emergencyCartClearSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Mock fetch to use our spy for emergency-cart-clear
    mockFetch.mockImplementation((url, options) => {
      if (url === '/api/emergency-cart-clear') {
        return emergencyCartClearSpy(url, options);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    render(
      <MemoryRouter>
        <CartProvider>
          <CartRemovalTest />
        </CartProvider>
      </MemoryRouter>
    );

    // Verify both items are initially displayed
    await waitFor(() => {
      expect(screen.getByTestId('item-item-1')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId('item-item-2')).toBeInTheDocument();
    });

    // Click the remove button for the first item
    fireEvent.click(screen.getByTestId('remove-item-1'));

    // Wait long enough for the emergency cart clear to be triggered (accounting for setTimeout)
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify emergency cart clear was called
    expect(emergencyCartClearSpy).toHaveBeenCalled();

    // Verify it was called with the correct URL
    const spyCall = emergencyCartClearSpy.mock.calls[0];
    expect(spyCall[0]).toBe('/api/emergency-cart-clear');
  });
});
