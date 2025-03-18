import { describe, test, expect, vi, beforeEach } from 'vitest';
import { SquarePaymentProvider } from '../SquarePaymentProvider';
import { SquareClient } from 'square';

// Mock the Square client
vi.mock('square', () => ({
  SquareClient: vi.fn().mockImplementation(() => ({
    locationsApi: {
      retrieveLocation: vi.fn().mockResolvedValue({
        result: {
          location: {
            id: 'test_location_id',
            name: 'Test Location',
          },
        },
      }),
    },
    ordersApi: {
      createOrder: vi.fn().mockResolvedValue({
        result: {
          order: {
            id: 'test_order_id',
            location_id: 'test_location_id',
          },
        },
      }),
    },
    paymentsApi: {
      createPayment: vi.fn().mockResolvedValue({
        result: {
          payment: {
            id: 'test_payment_id',
            status: 'COMPLETED',
            order_id: 'test_order_id',
            receipt_url: 'https://receipt-url.com',
          },
        },
      }),
      getPayment: vi.fn().mockResolvedValue({
        result: {
          payment: {
            id: 'test_payment_id',
            status: 'COMPLETED',
            order_id: 'test_order_id',
            receipt_url: 'https://receipt-url.com',
            amount_money: {
              amount: BigInt(10000),
              currency: 'USD',
            },
          },
        },
      }),
      cancelPayment: vi.fn().mockResolvedValue({
        result: {
          payment: {
            id: 'test_payment_id',
            status: 'CANCELED',
          },
        },
      }),
    },
    refundsApi: {
      refundPayment: vi.fn().mockResolvedValue({
        result: {
          refund: {
            id: 'test_refund_id',
            status: 'COMPLETED',
            payment_id: 'test_payment_id',
          },
        },
      }),
    },
  })),
  SquareEnvironment: {
    Production: 'production',
    Sandbox: 'sandbox',
  },
  ApiError: class ApiError extends Error {
    result: any;
    constructor(message: string, result?: any) {
      super(message);
      this.result = result;
    }
  },
}));

describe('SquarePaymentProvider', () => {
  let provider: SquarePaymentProvider;

  beforeEach(() => {
    provider = new SquarePaymentProvider();
    vi.clearAllMocks();
  });

  test('should initialize with valid configuration', async () => {
    const result = await provider.initialize({
      accessToken: 'test_token',
      locationId: 'test_location_id',
      applicationId: 'test_app_id',
      environment: 'sandbox',
    });

    expect(result).toBe(true);
    expect(SquareClient).toHaveBeenCalled();
  });

  test('should create a payment intent', async () => {
    // Initialize provider first
    await provider.initialize({
      accessToken: 'test_token',
      locationId: 'test_location_id',
      applicationId: 'test_app_id',
    });

    const result = await provider.createPayment(
      {
        value: 100,
        currency: 'USD',
      },
      {
        orderReference: 'ORDER-123',
      }
    );

    expect(result.paymentIntentId).toBe('test_order_id');
    expect(result.clientSecret).toBe('test_location_id:test_order_id');
  });

  test('basic provider properties', () => {
    expect(provider.provider).toBe('square');
    expect(provider.displayName).toBe('Square');
  });
});
