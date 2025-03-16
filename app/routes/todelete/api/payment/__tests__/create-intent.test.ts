import { describe, test, expect, beforeEach, vi } from 'vitest';
import { action } from '../create-intent';

// Mock order service integration
vi.mock('~/features/orders/api/orderService', () => ({
  getOrderService: vi.fn().mockResolvedValue({
    getOrderByOrderNumber: vi.fn().mockResolvedValue({
      id: 'test-order-id',
      orderNumber: 'ORDER-123',
      status: 'pending',
      totalAmount: 100,
    }),
    updateOrderFromPayment: vi.fn().mockResolvedValue({
      id: 'test-order-id',
      orderNumber: 'ORDER-123',
      status: 'processing',
    }),
  }),
}));

// Create a mock payment service
const mockCreatePayment = vi.fn().mockResolvedValue({
  clientSecret: 'test_client_secret',
  paymentIntentId: 'test_payment_intent_id',
});

const mockGetClientConfig = vi.fn().mockReturnValue({
  provider: 'test_provider',
});

// Mock the PaymentService module
vi.mock('~/features/payment/PaymentService', () => {
  return {
    getPaymentService: vi.fn().mockImplementation(() => ({
      createPayment: mockCreatePayment,
      getClientConfig: mockGetClientConfig,
    })),
  };
});

// Mock the authentication function
vi.mock('~/features/auth/auth.server', () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue({ id: 'user_123' }),
}));

// Helper to create a request with JSON body
function createRequest(body: any, method = 'POST'): Request {
  return new Request('http://localhost/api/payment/create-intent', {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('create-intent API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should return 405 for non-POST requests', async () => {
    const request = new Request('http://localhost/api/payment/create-intent', {
      method: 'GET',
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(405);

    const data = (await response.json()) as { error: string };
    expect(data.error).toBe('Method not allowed');
  });

  test('should create a payment intent successfully', async () => {
    const request = createRequest({
      amount: 100,
      currency: 'USD',
      orderReference: 'ORDER-123',
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      success: boolean;
      clientSecret: string;
      paymentIntentId: string;
      provider: any;
    };
    expect(data.success).toBe(true);
    expect(data.clientSecret).toBe('test_client_secret');
    expect(data.paymentIntentId).toBe('test_payment_intent_id');
    expect(data.provider).toBe('test_provider');

    // Verify createPayment was called with correct parameters
    expect(mockCreatePayment).toHaveBeenCalledWith(
      {
        value: 100,
        currency: 'USD',
        items: undefined,
      },
      {
        provider: undefined,
        orderReference: 'ORDER-123',
        description: undefined,
        metadata: undefined,
      }
    );
  });

  test('should create a payment intent with line items', async () => {
    const request = createRequest({
      amount: 100,
      currency: 'USD',
      items: [
        { name: 'Product 1', price: 50, quantity: 1 },
        { name: 'Product 2', price: 50, quantity: 1 },
      ],
    });

    await action({ request, params: {}, context: {} } as any);

    // Verify createPayment was called with items
    expect(mockCreatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          { name: 'Product 1', price: 50, quantity: 1 },
          { name: 'Product 2', price: 50, quantity: 1 },
        ],
      }),
      expect.anything()
    );
  });

  test('should handle payment intent creation with order reference', async () => {
    const request = createRequest({
      amount: 100,
      currency: 'USD',
      orderReference: 'ORDER-123',
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(200);

    // Verify payment service was called with order reference
    expect(mockCreatePayment).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        orderReference: 'ORDER-123',
      })
    );
  });

  test('should handle validation errors', async () => {
    const request = createRequest({
      // Missing required 'amount' field
      currency: 'USD',
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(400);

    const data = (await response.json()) as {
      success: boolean;
      error: string;
      validationErrors?: any;
    };
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid request data');
    expect(data.validationErrors).toBeDefined();
  });

  test('should handle payment service errors', async () => {
    // Mock the createPayment method to return an error
    mockCreatePayment.mockResolvedValueOnce({
      error: 'Payment service error',
    });

    const request = createRequest({
      amount: 100,
      currency: 'USD',
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(400);

    const data = (await response.json()) as { success: boolean; error: string };
    expect(data.success).toBe(false);
    expect(data.error).toBe('Payment service error');
  });
});
