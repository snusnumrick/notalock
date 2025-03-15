import { SquarePaymentProvider } from '../SquarePaymentProvider';
import { Client } from 'square';

// Mock Square Client to avoid actual API calls during tests
jest.mock('square', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      locationsApi: {
        retrieveLocation: jest.fn().mockResolvedValue({
          result: {
            location: {
              id: 'test_location_id',
              name: 'Test Location',
            },
          },
        }),
      },
      ordersApi: {
        createOrder: jest.fn().mockResolvedValue({
          result: {
            order: {
              id: 'test_order_id',
              lineItems: [],
              totalMoney: {
                amount: 1000,
                currency: 'USD',
              },
            },
          },
        }),
      },
      paymentsApi: {
        createPayment: jest.fn().mockResolvedValue({
          result: {
            payment: {
              id: 'test_payment_id',
              orderId: 'test_order_id',
              status: 'COMPLETED',
              amountMoney: {
                amount: 1000,
                currency: 'USD',
              },
              receiptUrl: 'https://receipt.url',
            },
          },
        }),
        getPayment: jest.fn().mockResolvedValue({
          result: {
            payment: {
              id: 'test_payment_id',
              orderId: 'test_order_id',
              status: 'COMPLETED',
              amountMoney: {
                amount: 1000,
                currency: 'USD',
              },
              receiptUrl: 'https://receipt.url',
            },
          },
        }),
        cancelPayment: jest.fn().mockResolvedValue({
          result: {
            payment: {
              id: 'test_payment_id',
              status: 'CANCELED',
            },
          },
        }),
      },
      refundsApi: {
        refundPayment: jest.fn().mockResolvedValue({
          result: {
            refund: {
              id: 'test_refund_id',
              paymentId: 'test_payment_id',
              status: 'COMPLETED',
              amountMoney: {
                amount: 1000,
                currency: 'USD',
              },
            },
          },
        }),
      },
    })),
    Environment: {
      Sandbox: 'sandbox',
      Production: 'production',
    },
  };
});

describe('SquarePaymentProvider', () => {
  let provider: SquarePaymentProvider;
  const testConfig = {
    accessToken: 'test_token',
    applicationId: 'test_app_id',
    locationId: 'test_location_id',
    environment: 'sandbox' as const,
  };

  beforeEach(async () => {
    provider = new SquarePaymentProvider();
    await provider.initialize(testConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with valid configuration', async () => {
    const result = await provider.initialize(testConfig);
    expect(result).toBe(true);
    expect(Client).toHaveBeenCalledWith({
      accessToken: 'test_token',
      environment: 'sandbox',
    });
  });

  test('should have correct provider identifier and display name', () => {
    expect(provider.provider).toBe('square');
    expect(provider.displayName).toBe('Square');
  });

  test('should create a payment intent', async () => {
    const result = await provider.createPayment(
      {
        value: 100,
        currency: 'USD',
        items: [
          {
            name: 'Test Product',
            price: 100,
            quantity: 1,
          },
        ],
      },
      {
        orderReference: 'TEST-ORDER-123',
      }
    );

    expect(result.clientSecret).toBeDefined();
    expect(result.paymentIntentId).toBe('test_order_id');
    expect(result.error).toBeUndefined();
  });

  test('should process a payment successfully', async () => {
    const result = await provider.processPayment('test_order_id', {
      provider: 'square',
      type: 'credit_card',
      paymentMethodId: 'test_payment_token',
    });

    expect(result.success).toBe(true);
    expect(result.paymentId).toBe('test_payment_id');
    expect(result.status).toBe('completed');
    expect(result.providerData?.provider).toBe('square');
  });

  test('should verify a payment', async () => {
    const result = await provider.verifyPayment('test_payment_id');

    expect(result.success).toBe(true);
    expect(result.paymentId).toBe('test_payment_id');
    expect(result.status).toBe('completed');
    expect(result.providerData?.provider).toBe('square');
  });

  test('should cancel a payment', async () => {
    const result = await provider.cancelPayment('test_payment_id');

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('should refund a payment', async () => {
    const result = await provider.refundPayment('test_payment_id', 100);

    expect(result.success).toBe(true);
    expect(result.refundId).toBe('test_refund_id');
    expect(result.error).toBeUndefined();
  });

  test('should return client configuration', () => {
    const config = provider.getClientConfig();

    expect(config.applicationId).toBe('test_app_id');
    expect(config.locationId).toBe('test_location_id');
    expect(config.environment).toBe('sandbox');
  });

  test('should fail with proper error if not initialized', async () => {
    // Create a new instance without initializing
    const uninitializedProvider = new SquarePaymentProvider();

    const createResult = await uninitializedProvider.createPayment({
      value: 100,
      currency: 'USD',
    });
    expect(createResult.error).toBeDefined();

    const processResult = await uninitializedProvider.processPayment('test_id', {
      provider: 'square',
      type: 'credit_card',
    });
    expect(processResult.success).toBe(false);

    const verifyResult = await uninitializedProvider.verifyPayment('test_id');
    expect(verifyResult.success).toBe(false);

    const cancelResult = await uninitializedProvider.cancelPayment('test_id');
    expect(cancelResult.success).toBe(false);

    const refundResult = await uninitializedProvider.refundPayment('test_id');
    expect(refundResult.success).toBe(false);

    expect(() => uninitializedProvider.getClientConfig()).toThrow();
  });
});
