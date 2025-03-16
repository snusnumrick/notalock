import { describe, test, expect, vi } from 'vitest';
import { action } from '../square';
import { getPaymentService } from '../../../../../features/payment/PaymentService';
import { updateOrderStatusFromPayment } from '../../../../../features/orders/api/actions.server';

// Mock the order module with a proper implementation based on real functionality
vi.mock('~/features/orders/api/actions.server', () => ({
  updateOrderStatusFromPayment: vi
    .fn()
    .mockImplementation(async (orderReference, paymentResult) => {
      console.log(
        `Mocked order update for ${orderReference} with payment ${paymentResult.paymentId}`
      );
      return Promise.resolve();
    }),
}));

// Mock the payment config
vi.mock('~/features/payment/config/paymentConfig.server', () => ({
  loadPaymentConfig: vi.fn().mockReturnValue({
    square: {
      webhookSignatureKey: 'test_signature_key',
    },
  }),
}));

// Mock crypto for verification
vi.mock('crypto', () => ({
  createHmac: vi.fn().mockReturnValue({
    update: vi.fn(),
    digest: vi.fn().mockReturnValue('valid_signature'),
  }),
}));

// Mock the PaymentService
vi.mock('~/features/payment/PaymentService', () => {
  return {
    getPaymentService: vi.fn().mockReturnValue({
      getProvider: vi.fn().mockReturnValue({
        verifyWebhookSignature: vi.fn().mockReturnValue(true),
      }),
      verifyPayment: vi.fn().mockResolvedValue({
        success: true,
        status: 'completed',
        paymentId: 'test_payment_id',
      }),
    }),
  };
});

describe('Square webhook handler', () => {
  test('should return 400 for invalid request method', async () => {
    const request = new Request('http://localhost/api/webhooks/square', {
      method: 'GET',
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(400);
  });

  test('should process a valid payment notification', async () => {
    const webhookBody = {
      type: 'payment.updated',
      data: {
        object: {
          payment: {
            id: 'test_payment_id',
            status: 'COMPLETED',
            order_id: 'test_order_id',
          },
        },
      },
    };

    const request = new Request('http://localhost/api/webhooks/square', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-square-hmacsha256-signature': 'valid_signature',
      },
      body: JSON.stringify(webhookBody),
    });

    const response = await action({ request, params: {}, context: {} } as any);
    expect(response.status).toBe(200);

    // Verify the payment service was called with correct parameters
    const paymentService = getPaymentService();
    expect(paymentService.verifyPayment).toHaveBeenCalledWith('test_payment_id', 'square');

    // Verify the order status update was called
    // The mock resolves with a successful payment result
    expect(updateOrderStatusFromPayment).toHaveBeenCalled();
    // Verify order reference was passed
    expect(updateOrderStatusFromPayment).toHaveBeenCalledWith(
      expect.any(String), // The order ID
      expect.objectContaining({
        success: true,
        status: expect.any(String),
        paymentId: 'test_payment_id',
      })
    );
  });
});
