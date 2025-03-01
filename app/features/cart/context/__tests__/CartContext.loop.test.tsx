// app/features/cart/context/__tests__/CartContext.loop.test.tsx
import React, { useEffect } from 'react';
import { render, act, fireEvent, screen } from '@testing-library/react';
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

describe('Cart Loop Prevention', () => {
  let effectRuns = 0;
  let mockTime = 0;

  // Mock performance.now
  const originalNow = performance.now;

  beforeEach(() => {
    // Reset counter
    effectRuns = 0;
    mockTime = 0;

    // Mock performance.now
    performance.now = vi.fn(() => mockTime);

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
    });

    // Mock window.dispatchEvent
    window.dispatchEvent = vi.fn();
  });

  afterEach(() => {
    performance.now = originalNow;
  });

  it('does not cause infinite loops with frequent state updates', async () => {
    // Component that tracks effect runs
    const CartStateMonitor = () => {
      const { cartItems, updateCartItem } = useCart();

      // Count effect runs to detect potential loops
      useEffect(() => {
        effectRuns++;
      }, [cartItems]);

      return (
        <div>
          <span data-testid="count">{cartItems.length}</span>
          <button data-testid="trigger-update" onClick={() => updateCartItem('test-id', 10)}>
            Update
          </button>
        </div>
      );
    };

    // Initial test data
    const initialCartItems: CartItem[] = [
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

    // Mock localStorage to return the test data
    window.localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(initialCartItems));

    render(
      <CartProvider>
        <CartStateMonitor />
      </CartProvider>
    );

    // Reset counter after initial renders
    effectRuns = 0;

    // Simulate multiple rapid updates
    for (let i = 0; i < 5; i++) {
      mockTime += 50; // Advance mock time by 50ms
      fireEvent.click(screen.getByTestId('trigger-update'));
    }

    // If we're triggering infinite loops, this would be much higher
    // 5 clicks should cause at most 5-10 effect runs, not hundreds
    expect(effectRuns).toBeLessThan(15);
  });

  it('does not re-render excessively when navigating between pages', async () => {
    // Component that simulates mounting/unmounting during navigation
    const NavigationSimulator = () => {
      const { cartItems } = useCart();

      // Count effect runs
      useEffect(() => {
        effectRuns++;
      }, [cartItems]);

      return <div data-testid="simulator">{cartItems.length}</div>;
    };

    const initialCartItems: CartItem[] = [
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

    // Mock localStorage
    window.localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(initialCartItems));

    const NavigationTest = () => {
      const [isShown, setIsShown] = React.useState(true);

      // Simulate a navigation without actually unmounting the provider
      React.useEffect(() => {
        const timer = setTimeout(() => {
          setIsShown(false);

          // Simulate coming back after a short delay
          setTimeout(() => {
            setIsShown(true);
          }, 50);
        }, 50);

        return () => clearTimeout(timer);
      }, []);

      return <CartProvider>{isShown && <NavigationSimulator />}</CartProvider>;
    };

    render(<NavigationTest />);

    // Reset counter after initial render
    effectRuns = 0;

    // Wait for the navigation cycle to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    // The number of effect runs should be low, indicating no infinite loops
    expect(effectRuns).toBeLessThan(5);
  });

  it('stabilizes effects when storing and loading from localStorage', async () => {
    // Track localStorage operations
    let saveOperations = 0;
    let loadOperations = 0;

    // Custom mocks to count operations
    window.localStorage.setItem = vi.fn(() => {
      saveOperations++;
    });
    window.localStorage.getItem = vi.fn(() => {
      loadOperations++;
      return JSON.stringify([
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
      ]);
    });

    // Create a component that simulates multiple re-renders
    const RerenderComponent = () => {
      const [count, setCount] = React.useState(0);

      // Force re-renders
      React.useEffect(() => {
        if (count < 5) {
          const timer = setTimeout(() => {
            setCount(prev => prev + 1);
          }, 50);

          return () => clearTimeout(timer);
        }
        return undefined;
      }, [count]);

      return (
        <CartProvider>
          <div>Cart Test {count}</div>
        </CartProvider>
      );
    };

    // Render the component
    render(<RerenderComponent />);

    // Reset counters
    saveOperations = 0;
    loadOperations = 0;

    // Wait for all re-renders to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    // Should have limited localStorage operations to avoid excessive reads/writes
    // It's important that this number doesn't grow linearly with remounts
    expect(saveOperations).toBeLessThan(10);
    expect(loadOperations).toBeLessThan(10);
  });
});
