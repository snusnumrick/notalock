import { action } from '../square';
import { getPaymentService } from '~/features/payment/PaymentService';
import { updateOrderStatusFromPayment } from '~/features/orders/api/actions.server';

// Mock crypto for webhook signature verification
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('valid_signature'),
  }),
}));

// Mock PaymentService
jest.mock('~/features/payment/PaymentService', () => ({
  getPaymentService: jest.fn().mockReturnValue({
    verifyPayment: jest.fn().mockResolvedValue({
      success: true,
      paymentId: 'test_payment_id',
      status: 'completed',
    }),
  }),
}));

// Mock updateOrderStatusFromPayment
jest.mock('~/features/orders/api/actions.server', () => ({
  updateOrderStatusFromPayment: jest.fn().mockResolvedValue({}),
}));

// Helper to create a webhook request
function createWebhookRequest(body: any, signature = 'valid_signature', method = 'POST'): Request {
  return new Request('http://localhost/api/webhooks/square', {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-square-hmacsha256-signature': signature,
    },
    body: JSON.stringify(body),
  });
}

describe('Square webhook handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 405 for non-POST requests', async () => {
    const request = new Request('http://localhost/api/webhooks/square', {
      method: 'GET',
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(405);

    const data = await response.json();
    expect(data.error).toBe('Method not allowed');
  });

  test('should return 400 if signature header is missing', async () => {
    const request = new Request('http://localhost/api/webhooks/square', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'payment.updated' }),
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid request');
  });

  test('should return 400 if payload is empty', async () => {
    const request = new Request('http://localhost/api/webhooks/square', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-square-hmacsha256-signature': 'valid_signature',
      },
      body: '',
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Empty payload');
  });

  test('should handle payment.updated event successfully', async () => {
    const webhookEvent = {
      type: 'payment.updated',
      data: {
        object: {
          id: 'test_payment_id',
          orderId: 'test_order_id',
          status: 'COMPLETED',
        },
      },
    };

    const request = createWebhookRequest(webhookEvent);
    const response = await action({ request, params: {}, context: {} } as any);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('success');

    // Verify payment verification was called
    expect(getPaymentService().verifyPayment).toHaveBeenCalledWith('test_payment_id', 'square');

    // Verify order update was called
    expect(updateOrderStatusFromPayment).toHaveBeenCalledWith(
      'test_order_id',
      expect.objectContaining({
        success: true,
        status: 'completed',
      })
    );
  });

  test('should handle invalid signature', async () => {
    // Mock crypto to return a different signature
    // Using jest's imported mocked module instead of require
    jest.requireMock('crypto').createHmac().digest.mockReturnValueOnce('invalid_signature');

    const webhookEvent = {
      type: 'payment.updated',
      data: {
        object: {
          id: 'test_payment_id',
        },
      },
    };

    const request = createWebhookRequest(webhookEvent, 'valid_signature');
    const response = await action({ request, params: {}, context: {} } as any);

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Invalid signature');
  });

  test('should handle webhook parsing error', async () => {
    const request = new Request('http://localhost/api/webhooks/square', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-square-hmacsha256-signature': 'valid_signature',
      },
      body: 'invalid-json',
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('should handle payment verification failure', async () => {
    // Mock verifyPayment to return a failure
    (getPaymentService().verifyPayment as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'Payment verification failed',
    });

    const webhookEvent = {
      type: 'payment.updated',
      data: {
        object: {
          id: 'test_payment_id',
          orderId: 'test_order_id',
        },
      },
    };

    const request = createWebhookRequest(webhookEvent);
    const response = await action({ request, params: {}, context: {} } as any);

    // Should still return 200 to acknowledge receipt
    expect(response.status).toBe(200);

    // Order update should not be called
    expect(updateOrderStatusFromPayment).not.toHaveBeenCalled();
  });

  test('should handle unexpected errors', async () => {
    // Mock verifyPayment to throw an error
    (getPaymentService().verifyPayment as jest.Mock).mockRejectedValueOnce(
      new Error('Unexpected error')
    );

    const webhookEvent = {
      type: 'payment.updated',
      data: {
        object: {
          id: 'test_payment_id',
        },
      },
    };

    const request = createWebhookRequest(webhookEvent);
    const response = await action({ request, params: {}, context: {} } as any);

    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });
});
