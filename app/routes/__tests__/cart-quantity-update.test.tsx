import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { CartItem } from '~/features/cart/types/cart.types';

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
import { CartProvider, useCart } from '~/features/cart/context/CartContext';
import { CART_DATA_STORAGE_KEY } from '~/features/cart/constants';

// Test component to simulate the cart page quantity update functionality
const CartQuantityUpdateTest = () => {
  const { cartItems, updateCartItem } = useCart();
  const [clientItems, setClientItems] = React.useState<CartItem[]>([]);
  const [hasInitialized, setHasInitialized] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Initialize client items from cart context
  React.useEffect(() => {
    if (!hasInitialized && cartItems.length > 0) {
      setClientItems(cartItems);
      setHasInitialized(true);
    }
  }, [cartItems, hasInitialized]);

  // Keep clientDisplayItems in sync with cartItems after initialization
  React.useEffect(() => {
    if (hasInitialized && cartItems.length > 0) {
      console.log('Cart page - Syncing client display items with cart context');
      setClientItems(cartItems);
    }
  }, [hasInitialized, cartItems]);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(true);
    try {
      // Update via the CartContext to ensure global state update
      await updateCartItem(itemId, newQuantity);

      // Update clientDisplayItems to reflect the change immediately
      if (hasInitialized) {
        setClientItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId
              ? { ...item, quantity: newQuantity, updated_at: new Date().toISOString() }
              : item
          )
        );

        // Dispatch event in case other components need to be notified
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('cart-state-changed', {
              detail: { type: 'update', itemId, quantity: newQuantity },
            })
          );
        }
      }
    } finally {
      setIsUpdating(false);
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
                <div className="quantity-controls" data-testid={`quantity-controls-${item.id}`}>
                  <button
                    data-testid={`decrease-${item.id}`}
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={isUpdating || item.quantity <= 1}
                  >
                    {isUpdating ? '...' : '-'}
                  </button>
                  <span data-testid={`quantity-${item.id}`}>{item.quantity}</span>
                  <button
                    data-testid={`increase-${item.id}`}
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? '...' : '+'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

describe('Cart Quantity Update', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockNavigate.mockReset();
    mockFetch.mockClear();

    // Make sure localStorage.getItem returns null by default for cart data
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === '__storage_test__') {
        return 'test';
      }
      return null;
    });
  });

  it('updates quantity in UI immediately when + button is clicked', async () => {
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

    // Setup localStorage to return the specific test items and nothing else
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return JSON.stringify(testCartItems);
      }
      if (key === '__storage_test__') {
        return 'test';
      }
      return null;
    });

    // Clear any previous setItem calls
    mockLocalStorage.setItem.mockClear();

    render(
      <MemoryRouter>
        <CartProvider>
          <CartQuantityUpdateTest />
        </CartProvider>
      </MemoryRouter>
    );

    // Verify item is initially displayed with quantity 1
    await waitFor(() => {
      expect(screen.getByTestId('item-item-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('quantity-item-1').textContent).toBe('1');

    // Click the increase button
    fireEvent.click(screen.getByTestId('increase-item-1'));

    // Verify quantity in UI is updated immediately to 2
    await waitFor(() => {
      expect(screen.getByTestId('quantity-item-1').textContent).toBe('2');
    });

    // Verify localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalled();

    // Verify an event was dispatched
    expect(window.dispatchEvent).toHaveBeenCalled();

    // Check that at least one of the dispatch calls had the expected event data
    const dispatchCalls = (window.dispatchEvent as any).mock.calls;
    let foundExpectedEvent = false;

    for (const call of dispatchCalls) {
      const event = call[0];
      if (
        event instanceof CustomEvent &&
        event.type === 'cart-state-changed' &&
        event.detail &&
        event.detail.type === 'update' &&
        event.detail.itemId === 'item-1' &&
        event.detail.quantity === 2
      ) {
        foundExpectedEvent = true;
        break;
      }
    }

    expect(foundExpectedEvent).toBe(true);
  });

  it('updates quantity in UI immediately when - button is clicked', async () => {
    // Setup test cart with one item with quantity 3
    const testCartItems: CartItem[] = [
      {
        id: 'item-1',
        cart_id: 'cart-1',
        product_id: 'prod-1',
        quantity: 3,
        price: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    // Setup localStorage to return the specific test items and nothing else
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return JSON.stringify(testCartItems);
      }
      if (key === '__storage_test__') {
        return 'test';
      }
      return null;
    });

    // Clear any previous setItem calls
    mockLocalStorage.setItem.mockClear();

    render(
      <MemoryRouter>
        <CartProvider>
          <CartQuantityUpdateTest />
        </CartProvider>
      </MemoryRouter>
    );

    // Verify item is initially displayed with quantity 3
    await waitFor(() => {
      expect(screen.getByTestId('item-item-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('quantity-item-1').textContent).toBe('3');

    // Click the decrease button
    fireEvent.click(screen.getByTestId('decrease-item-1'));

    // Verify quantity in UI is updated immediately to 2
    await waitFor(() => {
      expect(screen.getByTestId('quantity-item-1').textContent).toBe('2');
    });

    // Verify localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('prevents decreasing quantity below 1', async () => {
    // Setup test cart with one item with quantity 1
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

    // Setup localStorage to return the specific test items and nothing else
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return JSON.stringify(testCartItems);
      }
      if (key === '__storage_test__') {
        return 'test';
      }
      return null;
    });

    // Clear any previous setItem calls
    mockLocalStorage.setItem.mockClear();

    render(
      <MemoryRouter>
        <CartProvider>
          <CartQuantityUpdateTest />
        </CartProvider>
      </MemoryRouter>
    );

    // Verify item is initially displayed with quantity 1
    await waitFor(() => {
      expect(screen.getByTestId('item-item-1')).toBeInTheDocument();
    });

    // Decrease button should be disabled when quantity is 1
    const decreaseButton = screen.getByTestId('decrease-item-1');
    expect(decreaseButton).toBeDisabled();

    // Quantity should still be 1
    expect(screen.getByTestId('quantity-item-1').textContent).toBe('1');
  });

  it('updates the client display items even when cartItems is empty', async () => {
    // Setup localStorage with items but cartContext will be empty at first
    const testCartItems: CartItem[] = [
      {
        id: 'item-1',
        cart_id: 'cart-1',
        product_id: 'prod-1',
        quantity: 2,
        price: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    // Setup localStorage to return the specific test items and nothing else
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return JSON.stringify(testCartItems);
      }
      if (key === '__storage_test__') {
        return 'test';
      }
      return null;
    });

    // Clear any previous setItem calls
    mockLocalStorage.setItem.mockClear();

    // Create a custom component that manipulates cartItems directly
    const ManualCartUpdater = () => {
      const { cartItems, updateCartItem } = useCart();
      const [clientItems, setClientItems] = React.useState<CartItem[]>([]);
      const [hasInitialized, setHasInitialized] = React.useState(false);

      // Initialize client display items on first render
      React.useEffect(() => {
        if (!hasInitialized && cartItems.length > 0) {
          setClientItems(cartItems);
          setHasInitialized(true);
        }
      }, [hasInitialized, cartItems]);

      // Keep clientDisplayItems in sync with cartItems after initialization
      React.useEffect(() => {
        if (hasInitialized && cartItems.length > 0) {
          setClientItems(cartItems);
        }
      }, [hasInitialized, cartItems]);

      const updateQuantity = async () => {
        if (cartItems.length > 0) {
          await updateCartItem(cartItems[0].id, 5);

          // Even though cartItems might not be updated immediately in state,
          // we still update clientItems directly
          setClientItems(prev =>
            prev.map(item => (item.id === cartItems[0].id ? { ...item, quantity: 5 } : item))
          );
        }
      };

      return (
        <div>
          <div data-testid="cart-count">{cartItems.length}</div>
          <div data-testid="client-count">{clientItems.length}</div>
          <div>
            {clientItems.map(item => (
              <div key={item.id} data-testid={`quantity-${item.id}`}>
                {item.quantity}
              </div>
            ))}
          </div>
          <button data-testid="update-button" onClick={updateQuantity}>
            Update Quantity
          </button>
        </div>
      );
    };

    render(
      <MemoryRouter>
        <CartProvider>
          <ManualCartUpdater />
        </CartProvider>
      </MemoryRouter>
    );

    // Wait for initial state
    await waitFor(() => {
      expect(screen.getByTestId('cart-count').textContent).toBe('1');
    });

    // Initial quantity should be 2
    expect(screen.getByTestId('quantity-item-1').textContent).toBe('2');

    // Click update button
    fireEvent.click(screen.getByTestId('update-button'));

    // Client items should update immediately to quantity 5, even if cartItems hasn't updated yet
    await waitFor(() => {
      expect(screen.getByTestId('quantity-item-1').textContent).toBe('5');
    });
  });
});
