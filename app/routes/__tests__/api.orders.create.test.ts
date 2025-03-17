import { vi, describe, it, expect, beforeEach } from 'vitest';

// Create the mocks
const mockCreateOrderFromCheckout = vi.fn().mockImplementation(() => {
  return {
    id: 'order-123',
    orderNumber: 'NO-20250315-ABCD',
  };
});

const mockGetCheckoutSession = vi.fn();

const mockRequireAuth = vi.fn().mockImplementation(() => {
  return {
    user: { id: 'user-123', email: 'test@example.com' },
    response: new Response(),
  };
});

// Mock the modules directly
vi.mock('~/features/orders/api/integrations/checkoutIntegration', () => ({
  createOrderFromCheckout: mockCreateOrderFromCheckout,
}));

vi.mock('~/features/checkout/api/checkoutService', () => ({
  CheckoutService: vi.fn().mockImplementation(() => ({
    getCheckoutSession: mockGetCheckoutSession,
  })),
}));

vi.mock('~/server/middleware/auth.server', () => ({
  requireAuth: mockRequireAuth,
}));

// Import the action to test
import { action } from '../api.orders.create';

describe('Order Create API', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();

    // Default implementation returns the mock checkout
    mockGetCheckoutSession.mockResolvedValue(mockCheckout);
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
    expect(mockCreateOrderFromCheckout).toHaveBeenCalledWith(
      mockCheckout,
      'pi-123',
      undefined,
      'stripe',
      expect.anything() // supabase client
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
    mockGetCheckoutSession.mockResolvedValue(null);

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
    mockRequireAuth.mockImplementationOnce(() => ({
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
    // Arrange - checkout has null userId
    mockGetCheckoutSession.mockResolvedValue({
      ...mockCheckout,
      userId: null,
    });

    const formData = new FormData();
    formData.append('checkoutId', 'checkout-123');

    const request = new Request('http://localhost/api/orders/create', {
      method: 'POST',
      body: formData,
    });

    // Act
    const response = await action({ request, params: {}, context: {} });
    await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockCreateOrderFromCheckout).toHaveBeenCalled();
  });
});
