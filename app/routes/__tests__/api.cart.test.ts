// app/routes/__tests__/api.cart.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { action } from '~/routes/api.cart';

// Mock the CartService and Supabase client
vi.mock('~/features/cart/api/cartServiceRPC', () => ({
  CartServiceRPC: vi.fn().mockImplementation(() => ({
    addToCart: vi.fn(),
    getCartItems: vi.fn(),
  })),
}));

vi.mock('~/server/services/supabase.server', () => ({
  createSupabaseClient: vi.fn().mockReturnValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  }),
}));

// Mock the cookie functions
vi.mock('~/features/cart/utils/serverCookie', () => ({
  getAnonymousCartId: vi.fn().mockResolvedValue('test-anonymous-cart-id'),
  setAnonymousCartId: vi.fn().mockImplementation(response => response),
  anonymousCartCookie: { parse: vi.fn(), serialize: vi.fn() },
}));

// Import the mocks directly
import { CartServiceRPC } from '~/features/cart/api/cartServiceRPC';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { getAnonymousCartId, setAnonymousCartId } from '~/features/cart/utils/serverCookie';

describe('Cart API Action', () => {
  // Mock FormData and Request
  let mockFormData;
  let mockRequest;
  let mockCartService;

  beforeEach(() => {
    vi.resetAllMocks();

    // Reset our cookie mock functions
    (getAnonymousCartId as ReturnType<typeof vi.fn>).mockResolvedValue('test-anonymous-cart-id');
    (setAnonymousCartId as ReturnType<typeof vi.fn>).mockImplementation(response => response);

    // Setup form data mock with default values
    mockFormData = {
      get: vi.fn(key => {
        const values = {
          action: 'add',
          productId: 'prod-123',
          quantity: '2',
          price: '99.99',
          variantId: '',
        };
        return values[key] || null;
      }),
    };

    // Setup request mock with headers for cookie handling
    mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData),
      headers: {
        get: vi.fn(name => (name === 'Cookie' ? 'anonymousCartId=test-anonymous-cart-id' : null)),
      },
    };

    // Setup Supabase client mock with proper auth session response
    createSupabaseClient.mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
      rpc: vi.fn().mockReturnValue({ data: null, error: null }),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnValue({ data: null, error: null }),
      }),
    });

    // Setup cart service mock
    mockCartService = {
      addToCart: vi.fn().mockResolvedValue({
        id: 'item-123',
        product_id: 'prod-123',
        quantity: 2,
        price: 99.99,
      }),
      getCartItems: vi.fn().mockResolvedValue([
        {
          id: 'item-123',
          product_id: 'prod-123',
          quantity: 2,
          price: 99.99,
        },
      ]),
    };

    // Override the CartServiceRPC constructor mock
    (CartServiceRPC as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => mockCartService
    );
  });

  it('successfully adds an item to the cart', async () => {
    // Make sure mockCartService.addToCart actually returns a value
    mockCartService.addToCart.mockResolvedValue({
      id: 'item-123',
      product_id: 'prod-123',
      quantity: 2,
      price: 99.99,
    });

    // Mock getCartItems to return an array with the new item
    mockCartService.getCartItems = vi.fn().mockResolvedValue([
      {
        id: 'item-123',
        product_id: 'prod-123',
        quantity: 2,
        price: 99.99,
      },
    ]);

    // Execute action
    const result = await action({ request: mockRequest as any, params: {}, context: {} });
    const data = await result.json();

    // Check success response
    expect(data.success).toBe(true);
    expect(data.cartItem).toEqual({
      id: 'item-123',
      product_id: 'prod-123',
      quantity: 2,
      price: 99.99,
    });

    // Check CartService was called correctly
    expect(mockCartService.addToCart).toHaveBeenCalledWith({
      productId: 'prod-123',
      quantity: 2,
      price: 99.99,
      variantId: undefined,
    });
  });

  it('validates required fields when adding to cart', async () => {
    // Override form data mock to simulate missing productId
    mockFormData.get = vi.fn(key => {
      const values = {
        action: 'add',
        productId: '', // Empty productId
        quantity: '2',
        price: '99.99',
      };
      return values[key] || null;
    });

    // Execute action
    const result = await action({ request: mockRequest as any, params: {}, context: {} });
    const data = await result.json();

    // Check error response
    expect(data.error).toBe('Product ID is required');
    expect(result.status).toBe(400);

    // CartService should not be called
    expect(mockCartService.addToCart).not.toHaveBeenCalled();
  });

  it('validates quantity is a positive number', async () => {
    // Override form data mock to simulate invalid quantity
    mockFormData.get = vi.fn(key => {
      const values = {
        action: 'add',
        productId: 'prod-123',
        quantity: '0', // Invalid quantity
        price: '99.99',
      };
      return values[key] || null;
    });

    // Execute action
    const result = await action({ request: mockRequest as any, params: {}, context: {} });
    const data = await result.json();

    // Check error response
    expect(data.error).toBe('Quantity must be a positive number');
    expect(result.status).toBe(400);

    // CartService should not be called
    expect(mockCartService.addToCart).not.toHaveBeenCalled();
  });

  it('handles invalid action type', async () => {
    // Override form data mock with invalid action
    mockFormData.get = vi.fn(key => {
      const values = {
        action: 'invalid-action',
        productId: 'prod-123',
        quantity: '2',
        price: '99.99',
      };
      return values[key] || null;
    });

    // Execute action
    const result = await action({ request: mockRequest as any, params: {}, context: {} });
    const data = await result.json();

    // Check error response
    expect(data.error).toBe('Invalid action');
    expect(result.status).toBe(400);
  });

  it('handles CartService errors gracefully', async () => {
    // Make the CartService throw an error
    mockCartService.addToCart.mockRejectedValue(new Error('Database connection error'));

    // Execute action
    const result = await action({ request: mockRequest as any, params: {}, context: {} });
    const data = await result.json();

    // Check error response
    expect(data.error).toBe('Database connection error');
    expect(result.status).toBe(500);
  });

  it('passes variant ID correctly when provided', async () => {
    // Override form data mock to include variantId
    mockFormData.get = vi.fn(key => {
      const values = {
        action: 'add',
        productId: 'prod-123',
        quantity: '2',
        price: '99.99',
        variantId: 'var-456',
      };
      return values[key] || null;
    });

    // Execute action
    await action({ request: mockRequest as any, params: {}, context: {} });

    // Check CartService was called with variant ID
    expect(mockCartService.addToCart).toHaveBeenCalledWith({
      productId: 'prod-123',
      quantity: 2,
      price: 99.99,
      variantId: 'var-456',
    });
  });

  it('handles non-Error exceptions', async () => {
    // Make the CartService throw a non-Error value
    mockCartService.addToCart.mockRejectedValue('Unexpected failure');

    // Execute action
    const result = await action({ request: mockRequest as any, params: {}, context: {} });
    const data = await result.json();

    // Check error response
    expect(data.error).toBe('An unexpected error occurred');
    expect(result.status).toBe(500);
  });
});
