// app/features/cart/context/__tests__/CartContext.edge.test.tsx
import { render, waitFor, act, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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

// Mock components for testing
const CountDisplay = () => {
  const { cartItems } = useCart();
  return <div data-testid="item-count">{cartItems.length}</div>;
};

// Mock window and localStorage
let mockLocalStorage: Record<string, any> = {};
let mockConsoleError: any;

describe('CartContext Edge Cases', () => {
  beforeEach(() => {
    // Reset mocks
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock console.error to prevent test output pollution
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock window.dispatchEvent
    window.dispatchEvent = vi.fn();
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
  });

  it('handles corrupted localStorage data', async () => {
    // Mock corrupted data in localStorage
    mockLocalStorage.getItem.mockReturnValueOnce('invalid-json-data');

    // Should not throw an error
    expect(() => {
      render(
        <CartProvider>
          <CountDisplay />
        </CartProvider>
      );
    }).not.toThrow();

    // Should initialize with empty cart
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    });
  });

  it('handles localStorage being unavailable', async () => {
    // Mock localStorage.getItem throwing error
    mockLocalStorage.getItem.mockImplementationOnce(() => {
      throw new Error('localStorage unavailable');
    });

    // Should not throw an error
    expect(() => {
      render(
        <CartProvider>
          <CountDisplay />
        </CartProvider>
      );
    }).not.toThrow();

    // Should log the error but continue
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toHaveTextContent('0');
    });
  });

  it('uses initialCartItems if localStorage is unavailable', async () => {
    // Make the localStorage.getItem throw an error to simulate being unavailable
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });

    // Mock console.log to prevent noise
    const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Create clear test data - one item
    const initialCartItems: CartItem[] = [
      {
        id: 'test-1',
        cart_id: 'cart-1',
        product_id: 'prod-1',
        quantity: 1,
        price: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    // Create a simple test component to directly access the cart's state
    const TestComponent = () => {
      const { cartItems } = useCart();
      return <div data-testid="item-count">{cartItems.length}</div>;
    };

    // Render with both the provider and component
    render(
      <CartProvider initialCartItems={initialCartItems}>
        <TestComponent />
      </CartProvider>
    );

    // Wait for initialization to complete with a longer timeout
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Verify the component shows the right count (using getByTestId from render result)
    await waitFor(
      () => {
        const itemCount = screen.getByTestId('item-count').textContent;
        expect(itemCount).toBe('1');
      },
      { timeout: 1000 }
    );

    // Clean up mocks
    mockConsoleLog.mockRestore();
  });

  it('prefers localStorage data over initialCartItems when both exist', async () => {
    const initialCartItems: CartItem[] = [
      {
        id: 'server-item',
        cart_id: 'cart-1',
        product_id: 'prod-server',
        quantity: 1,
        price: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    const localStorageItems: CartItem[] = [
      {
        id: 'local-item',
        cart_id: 'cart-1',
        product_id: 'prod-local',
        quantity: 2,
        price: 20,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    // Mock localStorage to return localStorageItems
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(localStorageItems));

    const ItemIdChecker = () => {
      const { cartItems } = useCart();
      return (
        <div>
          {cartItems.map(item => (
            <div key={item.id} data-testid={`item-${item.id}`}>
              {item.product_id}
            </div>
          ))}
        </div>
      );
    };

    render(
      <CartProvider initialCartItems={initialCartItems}>
        <ItemIdChecker />
      </CartProvider>
    );

    // Should use localStorage items rather than initialCartItems
    await waitFor(() => {
      expect(screen.getByTestId('item-local-item')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByTestId('item-server-item')).not.toBeInTheDocument();
    });
  });

  it('handles empty arrays in localStorage', async () => {
    // Mock empty array in localStorage
    mockLocalStorage.getItem.mockReturnValueOnce('[]');

    const initialCartItems: CartItem[] = [
      {
        id: 'server-item',
        cart_id: 'cart-1',
        product_id: 'prod-server',
        quantity: 1,
        price: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        variant_id: null,
      },
    ];

    render(
      <CartProvider initialCartItems={initialCartItems}>
        <CountDisplay />
      </CartProvider>
    );

    // Should use initialCartItems when localStorage is empty
    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    });
  });

  it('gracefully handles localStorage errors when saving', async () => {
    // Mock localStorage.setItem to throw an error
    mockLocalStorage.setItem.mockImplementationOnce(() => {
      throw new Error('localStorage setItem failed');
    });

    const TestComponent = () => {
      const { addToCart } = useCart();
      return (
        <button
          data-testid="add-button"
          onClick={() => addToCart({ productId: 'test', quantity: 1, price: 10 })}
        >
          Add
        </button>
      );
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Trigger the action that would cause saving
    screen.getByTestId('add-button').click();

    // Should log the error but not crash
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });
});
