import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the modules with auto mocks (no implementation)
vi.mock('~/features/orders/api/integrations/checkoutIntegration');
vi.mock('~/features/checkout/api/checkoutService');
vi.mock('~/server/middleware/auth.server');
vi.mock('~/server/services/supabase.server');

// Now import the mocked modules
import { createOrderFromCheckout } from '~/features/orders/api/integrations/checkoutIntegration';
import { CheckoutService } from '~/features/checkout/api/checkoutService';
import { requireAuth } from '~/server/middleware/auth.server';
import { createSupabaseClient } from '~/server/services/supabase.server';

// Import the action after mocks are set up
import { action } from '../api.orders.create';

// Create mock implementations to be used in tests
const mockOrder = {
  id: 'order-123',
  orderNumber: 'NO-20250315-ABCD',
};

const mockCheckout = {
  id: 'checkout-123',
  cartId: 'cart-123',
  userId: 'user-123',
  status: 'pending',
  shippingAddress: {
    name: 'Test User',
    email: 'test@example.com',
  },
  paymentInfo: {
    provider: 'stripe',
    type: 'card',
  },
};

// Mock getCheckoutSession method
const mockGetCheckoutSession = vi.fn().mockResolvedValue(mockCheckout);

// Mock Supabase client
const mockSupabaseClient = {
  // Add any methods that would be used in the action function
  // This is a minimal implementation
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
  },
};

describe('Order Create API', () => {
  // Set up our mock implementations before each test
  beforeEach(() => {
    vi.clearAllMocks();

    // Set the implementations after the mocks are established
    vi.mocked(createOrderFromCheckout).mockResolvedValue(mockOrder);

    // Mock CheckoutService implementation
    vi.mocked(CheckoutService).mockImplementation(() => ({
      getCheckoutSession: mockGetCheckoutSession,
    }));

    // Mock requireAuth implementation
    vi.mocked(requireAuth).mockImplementation(() => {
      return {
        user: { id: 'user-123', email: 'test@example.com' },
        response: new Response(),
      };
    });

    // Mock createSupabaseClient implementation
    vi.mocked(createSupabaseClient).mockReturnValue(mockSupabaseClient);
  });

  it('should create an order from a checkout session', async () => {
    // Arrange
    const formData = new FormData();
    formData.append('checkoutId', 'checkout-123');
    formData.append('paymentIntentId', 'pi-123');

    const request = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      body: formData,
    });

    // Act
    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    // Assert
    expect(mockGetCheckoutSession).toHaveBeenCalledWith('checkout-123');
    expect(createOrderFromCheckout).toHaveBeenCalledWith(
      mockCheckout,
      'pi-123',
      undefined,
      'stripe',
      mockSupabaseClient // Mock supabase client
    );

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      orderId: 'order-123',
      orderNumber: 'NO-20250315-ABCD',
    });
  });

  it('should return 400 if checkout ID is missing', async () => {
    // Arrange
    const formData = new FormData();
    // Missing checkoutId

    const request = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      body: formData,
    });

    // Act
    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Missing checkout ID',
    });
  });

  it('should return 404 if checkout is not found', async () => {
    // Arrange - checkout session is null
    mockGetCheckoutSession.mockResolvedValueOnce(null);

    const formData = new FormData();
    formData.append('checkoutId', 'non-existent');

    const request = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      body: formData,
    });

    // Act
    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: 'Checkout not found',
    });
  });

  it('should return 403 if user does not have access to the checkout', async () => {
    // Arrange - different user
    vi.mocked(requireAuth).mockImplementationOnce(() => ({
      user: { id: 'different-user', email: 'different@example.com' },
      response: new Response(),
    }));

    const formData = new FormData();
    formData.append('checkoutId', 'checkout-123');

    const request = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      body: formData,
    });

    // Act
    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(403);
    expect(data).toEqual({
      error: 'Unauthorized',
    });
  });

  it('should allow access for guest checkout (no user ID)', async () => {
    // Create a guest checkout session (no userId)
    const guestCheckout = {
      ...mockCheckout,
      userId: null,
    };

    // Mock the getCheckoutSession to return a guest checkout
    mockGetCheckoutSession.mockResolvedValueOnce(guestCheckout);

    // Ensure createOrderFromCheckout returns a valid order
    vi.mocked(createOrderFromCheckout).mockResolvedValueOnce(mockOrder);

    const formData = new FormData();
    formData.append('checkoutId', 'checkout-123');

    const request = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      body: formData,
    });

    try {
      // Act
      const response = await action({ request, params: {}, context: {} });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(createOrderFromCheckout).toHaveBeenCalled();
      expect(data).toEqual({
        success: true,
        orderId: 'order-123',
        orderNumber: 'NO-20250315-ABCD',
      });
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error;
    }
  });
});
