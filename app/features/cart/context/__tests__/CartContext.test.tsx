// app/features/cart/context/__tests__/CartContext.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CartProvider, useCart } from '../CartContext';
import type { CartItem } from '../../types/cart.types';

// Mock useCart hook implementation
vi.mock('@remix-run/react', () => ({
  useFetcher: () => ({
    submit: vi.fn(),
    state: 'idle',
    data: null,
  }),
}));

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

// Mock window.dispatchEvent
const mockDispatchEvent = vi.fn();

// Setup global mocks
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
window.dispatchEvent = mockDispatchEvent;

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
    // Reset all mocks
    vi.clearAllMocks();
    mockLocalStorage.clear();
    window.dispatchEvent = mockDispatchEvent;
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

    // Setup localStorage mock to return our test cart items
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(testCartItems));

    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(screen.getByTestId('cart-count').textContent).toBe('1');
    });
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('notalock_cart_data');
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

    render(
      <CartProvider initialCartItems={initialCartItems}>
        <CartConsumer />
      </CartProvider>
    );

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(screen.getByTestId('cart-count').textContent).toBe('1');
    });
    expect(screen.getByTestId('item-test-2')).toBeInTheDocument();
  });

  it('adds item to cart', async () => {
    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    expect(screen.getByTestId('cart-count').textContent).toBe('0');

    // Add an item to cart
    fireEvent.click(screen.getByTestId('add-item'));

    // Check if item was added
    await waitFor(() => {
      expect(screen.getByTestId('cart-count').textContent).toBe('1');
    });
    expect(screen.getByTestId('total-items').textContent).toBe('1');

    // Check if localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('notalock_cart_data', expect.any(String));

    // Check if event was dispatched
    expect(mockDispatchEvent).toHaveBeenCalled();
  });

  it('updates item quantity', async () => {
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

    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(testCartItems));

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

    // Check if localStorage was updated
    const lastCall =
      mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
    const savedData = JSON.parse(lastCall[1]);
    expect(savedData[0].quantity).toBe(5);

    // Check if event was dispatched
    expect(mockDispatchEvent).toHaveBeenCalled();
  });

  it('removes item from cart', async () => {
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

    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(testCartItems));

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
    // Check if event was dispatched
    expect(mockDispatchEvent).toHaveBeenCalled();
  });

  it('properly calculates the cart summary', async () => {
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
    expect(screen.getByTestId('total-items').textContent).toBe('0');
    expect(screen.getByTestId('subtotal').textContent).toBe('0');

    // Add multiple items
    fireEvent.click(screen.getByTestId('add-multiple'));

    // Wait for the total items to update
    await waitFor(() => {
      expect(screen.getByTestId('total-items').textContent).toBe('3'); // 2 + 1
    });

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
});
