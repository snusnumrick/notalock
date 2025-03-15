import { action } from '../create-intent';
import { getPaymentService } from '~/features/payment/PaymentService';

// Mock the PaymentService
jest.mock('~/features/payment/PaymentService', () => ({
  getPaymentService: jest.fn().mockReturnValue({
    createPayment: jest.fn().mockResolvedValue({
      clientSecret: 'test_client_secret',
      paymentIntentId: 'test_payment_intent_id',
    }),
    getClientConfig: jest.fn().mockReturnValue({
      provider: 'test_provider',
    }),
  }),
}));

// Mock the authentication function (if used)
jest.mock('~/features/auth/auth.server', () => ({
  requireAuthenticatedUser: jest.fn().mockResolvedValue({ id: 'user_123' }),
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
    jest.clearAllMocks();
  });

  test('should return 405 for non-POST requests', async () => {
    const request = new Request('http://localhost/api/payment/create-intent', {
      method: 'GET',
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(405);

    const data = await response.json();
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

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.clientSecret).toBe('test_client_secret');
    expect(data.paymentIntentId).toBe('test_payment_intent_id');
    expect(data.provider).toBe('test_provider');

    // Verify createPayment was called with correct parameters
    const paymentService = getPaymentService();
    expect(paymentService.createPayment).toHaveBeenCalledWith(
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
    const paymentService = getPaymentService();
    expect(paymentService.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          { name: 'Product 1', price: 50, quantity: 1 },
          { name: 'Product 2', price: 50, quantity: 1 },
        ],
      }),
      expect.anything()
    );
  });

  test('should handle validation errors', async () => {
    const request = createRequest({
      // Missing required 'amount' field
      currency: 'USD',
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid request data');
    expect(data.validationErrors).toBeDefined();
  });

  test('should handle payment service errors', async () => {
    // Mock the createPayment method to return an error
    (getPaymentService().createPayment as jest.Mock).mockResolvedValueOnce({
      error: 'Payment service error',
    });

    const request = createRequest({
      amount: 100,
      currency: 'USD',
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Payment service error');
  });

  test('should handle unexpected errors', async () => {
    // Mock the createPayment method to throw an error
    (getPaymentService().createPayment as jest.Mock).mockRejectedValueOnce(
      new Error('Unexpected error')
    );

    const request = createRequest({
      amount: 100,
      currency: 'USD',
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unexpected error');
  });
});
