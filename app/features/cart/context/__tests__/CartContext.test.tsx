// app/features/cart/context/__tests__/CartContext.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CartProvider, useCart } from '../CartContext';
import type { CartItem } from '../../types/cart.types';
import { CART_DATA_STORAGE_KEY } from '../../constants';

// Mock useFetcher to simulate API interaction
const mockSubmit = vi.fn();
let mockUseFetcherData: any = null;

vi.mock('@remix-run/react', () => ({
  useFetcher: () => ({
    submit: mockSubmit,
    state: 'idle',
    data: mockUseFetcherData,
  }),
}));

// Mock localStorage
let mockStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn(key => mockStore[key] || null),
  setItem: vi.fn((key, value) => {
    mockStore[key] = value.toString();
  }),
  removeItem: vi.fn(key => {
    delete mockStore[key];
  }),
  clear: vi.fn(() => {
    mockStore = {};
  }),
};

// Mock window.dispatchEvent
const mockDispatchEvent = vi.fn();

// Setup global mocks
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
window.dispatchEvent = mockDispatchEvent;

// Make sure we have access to the constants

// Simple test component to access cart context
const CartConsumer = () => {
  const { cartItems, addToCart, updateCartItem, removeCartItem } = useCart();
  return (
    <div>
      <div data-testid="cart-count">{cartItems.length}</div>
      <div data-testid="total-items">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</div>
      <ul>
        {cartItems.map(item => (
          <li key={item.id} data-testid={`item-${item.id}`}>
            {item.product_id} - {item.quantity} x ${item.price}
          </li>
        ))}
      </ul>
      <button
        data-testid="add-item"
        onClick={() => addToCart({ productId: 'test-1', quantity: 1, price: 10 })}
      >
        Add Item
      </button>
      <button
        data-testid="update-item"
        onClick={() => {
          if (cartItems.length > 0) {
            updateCartItem(cartItems[0].id, 5);
          }
        }}
      >
        Update Item
      </button>
      <button
        data-testid="remove-item"
        onClick={() => {
          if (cartItems.length > 0) {
            removeCartItem(cartItems[0].id);
          }
        }}
      >
        Remove Item
      </button>
    </div>
  );
};

describe('CartContext', () => {
  beforeEach(() => {
    // Reset all mocks and clear global state before each test
    vi.clearAllMocks();
    mockStore = {};
    mockLocalStorage.clear();
    window.dispatchEvent = mockDispatchEvent; // Reset dispatchEvent
    mockUseFetcherData = null; // Reset mock data

    // Make sure localStorage.getItem returns null by default for our cart key
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === '__storage_test__') {
        return 'test'; // For isLocalStorageAvailable check
      }
      return null; // Return null for all other keys including cart data
    });

    // Define the CustomEvent globally for each test
    global.CustomEvent = class CustomEvent extends Event {
      detail: any;
      constructor(type: string, eventInitDict?: CustomEventInit) {
        super(type, eventInitDict);
        this.detail = eventInitDict?.detail;
      }
    } as any;
  });

  it('initializes empty cart when no data available', () => {
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    expect(screen.getByTestId('cart-count').textContent).toBe('0');
  });

  it('loads cart from localStorage on mount', async () => {
    const testCartItems: CartItem[] = [
      {
        id: 'test-1',
        cart_id: 'cart-1',
        product_id: 'prod-1',
        quantity: 2,
        price: 10.99,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    // Setup localStorage mock to return our test cart items with the correct key
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return JSON.stringify(testCartItems);
      }
      if (key === '__storage_test__') {
        return 'test'; // For isLocalStorageAvailable check
      }
      return null;
    });

    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(screen.getByTestId('cart-count').textContent).toBe('1');
    });

    // Verify localStorage was accessed with the correct key
    const getItemCalls = mockLocalStorage.getItem.mock.calls;
    const hasCartKeyAccess = getItemCalls.some(call => call[0] === CART_DATA_STORAGE_KEY);
    expect(hasCartKeyAccess).toBe(true);

    expect(mockDispatchEvent).toHaveBeenCalled();
  });

  it('initializes with provided initialCartItems when localStorage is empty', async () => {
    const initialCartItems: CartItem[] = [
      {
        id: 'test-2',
        cart_id: 'cart-1',
        product_id: 'prod-2',
        quantity: 1,
        price: 19.99,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    // Ensure localStorage is empty by explicitly returning null for cart data
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return null;
      }
      if (key === '__storage_test__') {
        return 'test';
      }
      return null;
    });

    // Make sure CustomEvent is properly defined for the tests
    global.CustomEvent = class CustomEvent extends Event {
      detail: any;
      constructor(type: string, eventInitDict?: CustomEventInit) {
        super(type, eventInitDict);
        this.detail = eventInitDict?.detail;
      }
    } as any;

    render(
      <CartProvider initialCartItems={initialCartItems}>
        <CartConsumer />
      </CartProvider>
    );

    // Wait for the async operations to complete
    await waitFor(
      () => {
        expect(screen.getByTestId('cart-count').textContent).toBe('1');
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        expect(screen.getByTestId('item-test-2')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('adds item to cart and calls API', async () => {
    // Ensure we start with an empty cart by mocking localStorage to return null
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return null;
      }
      if (key === '__storage_test__') {
        return 'test';
      }
      return null;
    });

    // Make sure CustomEvent is properly defined for the tests
    global.CustomEvent = class CustomEvent extends Event {
      detail: any;
      constructor(type: string, eventInitDict?: CustomEventInit) {
        super(type, eventInitDict);
        this.detail = eventInitDict?.detail;
      }
    } as any;

    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    // Verify initial state is empty
    await waitFor(
      () => {
        expect(screen.getByTestId('cart-count').textContent).toBe('0');
      },
      { timeout: 2000 }
    );

    // Add an item to cart
    fireEvent.click(screen.getByTestId('add-item'));

    // Check if item was added
    await waitFor(
      () => {
        expect(screen.getByTestId('cart-count').textContent).toBe('1');
      },
      { timeout: 2000 }
    );
    expect(screen.getByTestId('total-items').textContent).toBe('1');

    // Check if API was called
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'add',
        productId: 'test-1',
        quantity: '1',
        price: '10',
      }),
      expect.objectContaining({ method: 'post', action: '/api/cart' })
    );

    // Check if localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      CART_DATA_STORAGE_KEY,
      expect.any(String)
    );

    // Check if event was dispatched
    expect(mockDispatchEvent).toHaveBeenCalled();
  });

  it('updates item quantity and calls API', async () => {
    // Initialize with an item in the cart
    const testCartItems: CartItem[] = [
      {
        id: 'test-id',
        cart_id: 'cart-1',
        product_id: 'prod-1',
        quantity: 1,
        price: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return JSON.stringify(testCartItems);
      }
      if (key === '__storage_test__') {
        return 'test'; // For isLocalStorageAvailable check
      }
      return null;
    });

    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    // Initial state check
    await waitFor(() => {
      expect(screen.getByTestId('total-items').textContent).toBe('1');
    });

    // Update the item quantity
    fireEvent.click(screen.getByTestId('update-item'));

    await waitFor(() => {
      // Check if quantity was updated
      expect(screen.getByTestId('total-items').textContent).toBe('5');
    });

    // Check if API was called
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'update',
        itemId: 'test-id',
        quantity: '5',
      }),
      expect.objectContaining({ method: 'post', action: '/api/cart' })
    );

    // Check if localStorage was updated
    const setItemCalls = mockLocalStorage.setItem.mock.calls;
    const cartDataCalls = setItemCalls.filter(call => call[0] === CART_DATA_STORAGE_KEY);
    expect(cartDataCalls.length).toBeGreaterThan(0);

    const lastCall = cartDataCalls[cartDataCalls.length - 1];
    const savedData = JSON.parse(lastCall[1]);
    expect(savedData[0].quantity).toBe(5);

    // Check if event was dispatched
    expect(mockDispatchEvent).toHaveBeenCalled();
  });

  it('removes item from cart and calls API', async () => {
    // Initialize with an item in the cart
    const testCartItems: CartItem[] = [
      {
        id: 'test-id',
        cart_id: 'cart-1',
        product_id: 'prod-1',
        quantity: 1,
        price: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return JSON.stringify(testCartItems);
      }
      if (key === '__storage_test__') {
        return 'test'; // For isLocalStorageAvailable check
      }
      return null;
    });

    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    // Initial state check
    await waitFor(() => {
      expect(screen.getByTestId('cart-count').textContent).toBe('1');
    });

    // Remove the item
    fireEvent.click(screen.getByTestId('remove-item'));

    await waitFor(() => {
      // Check if item was removed
      expect(screen.getByTestId('cart-count').textContent).toBe('0');
    });

    // Check if API was called
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'remove',
        itemId: 'test-id',
      }),
      expect.objectContaining({ method: 'post', action: '/api/cart' })
    );

    // Check if event was dispatched
    expect(mockDispatchEvent).toHaveBeenCalled();
  });

  it('properly calculates the cart summary', async () => {
    // Ensure we start with an empty cart by mocking localStorage to return null
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return null;
      }
      if (key === '__storage_test__') {
        return 'test';
      }
      return null;
    });

    // Make sure CustomEvent is properly defined for the tests
    global.CustomEvent = class CustomEvent extends Event {
      detail: any;
      constructor(type: string, eventInitDict?: CustomEventInit) {
        super(type, eventInitDict);
        this.detail = eventInitDict?.detail;
      }
    } as any;

    const SummaryConsumer = () => {
      const { summary, addToCart } = useCart();
      return (
        <div>
          <div data-testid="total-items">{summary.totalItems}</div>
          <div data-testid="subtotal">{summary.subtotal}</div>
          <div data-testid="total">{summary.total}</div>
          <button
            data-testid="add-multiple"
            onClick={() => {
              // Add two different items
              addToCart({ productId: 'prod-1', quantity: 2, price: 10 });
              addToCart({ productId: 'prod-2', quantity: 1, price: 20 });
            }}
          >
            Add Multiple
          </button>
        </div>
      );
    };

    render(
      <CartProvider>
        <SummaryConsumer />
      </CartProvider>
    );

    // Initial state check
    await waitFor(() => {
      expect(screen.getByTestId('total-items').textContent).toBe('0');
    });
    expect(screen.getByTestId('subtotal').textContent).toBe('0');

    // Add multiple items
    fireEvent.click(screen.getByTestId('add-multiple'));

    // Wait for the total items to update
    await waitFor(
      () => {
        expect(screen.getByTestId('total-items').textContent).toBe('3'); // 2 + 1
      },
      { timeout: 2000 }
    );

    // These elements should be available immediately after total-items is updated
    expect(screen.getByTestId('subtotal').textContent).toBe('40'); // (2 * 10) + (1 * 20)
    expect(screen.getByTestId('total').textContent).toBe('40'); // same as subtotal with no shipping/tax
  });

  it('handles localStorage errors gracefully', async () => {
    // Mock localStorage to throw an error
    mockLocalStorage.getItem.mockImplementationOnce(() => {
      throw new Error('localStorage not available');
    });

    // Should not throw when rendering
    expect(() => {
      render(
        <CartProvider>
          <CartConsumer />
        </CartProvider>
      );
    }).not.toThrow();

    // Cart should still initialize with empty state
    expect(screen.getByTestId('cart-count').textContent).toBe('0');
  });

  it('updates cart state when API returns updated cart data', async () => {
    // Ensure we start with an empty cart by mocking localStorage to return null
    mockLocalStorage.getItem.mockImplementation(key => {
      if (key === CART_DATA_STORAGE_KEY) {
        return null;
      }
      if (key === '__storage_test__') {
        return 'test';
      }
      return null;
    });

    // Initialize cart context with empty cart
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    // Initial state check
    await waitFor(() => {
      expect(screen.getByTestId('cart-count').textContent).toBe('0');
    });

    // Setup mock data that will be returned from the API
    const serverCartData = [
      {
        id: 'server-item',
        cart_id: 'server-cart',
        product_id: 'prod-server',
        quantity: 3,
        price: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    // Update mock data that will be returned by useFetcher
    mockUseFetcherData = {
      success: true,
      cart: serverCartData,
    };

    // Trigger a re-render by simulating an action that uses the fetcher
    fireEvent.click(screen.getByTestId('add-item'));

    // Wait for state to update with server data
    await waitFor(() => {
      expect(screen.getByTestId('cart-count').textContent).toBe('1');
    });

    const itemElement = await waitFor(() => {
      const element = screen.queryByTestId('item-server-item');
      expect(element).toBeInTheDocument();
      return element;
    });

    expect(itemElement!.textContent).toContain('prod-server - 3 x $15');
  });
});
