import { StripePaymentProvider } from '../StripePaymentProvider';
import Stripe from 'stripe';

// Mock Stripe to avoid actual API calls during tests
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentMethods: {
      list: jest.fn().mockResolvedValue({
        data: [],
      }),
    },
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'test_payment_intent_id',
        client_secret: 'test_client_secret',
        status: 'requires_payment_method',
        amount: 10000,
        currency: 'usd',
        metadata: {},
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'test_payment_intent_id',
        client_secret: 'test_client_secret',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {},
      }),
      confirm: jest.fn().mockResolvedValue({
        id: 'test_payment_intent_id',
        status: 'succeeded',
      }),
      cancel: jest.fn().mockResolvedValue({
        id: 'test_payment_intent_id',
        status: 'canceled',
      }),
    },
    refunds: {
      create: jest.fn().mockResolvedValue({
        id: 'test_refund_id',
        payment_intent: 'test_payment_intent_id',
        amount: 10000,
        status: 'succeeded',
      }),
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'test_payment_intent_id',
          },
        },
      }),
    },
  }));
});

describe('StripePaymentProvider', () => {
  let provider: StripePaymentProvider;
  const testConfig = {
    secretKey: 'test_secret_key',
    publishableKey: 'test_publishable_key',
    webhookSecret: 'test_webhook_secret',
  };

  beforeEach(async () => {
    provider = new StripePaymentProvider();
    await provider.initialize(testConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with valid configuration', async () => {
    const result = await provider.initialize(testConfig);
    expect(result).toBe(true);
    expect(Stripe).toHaveBeenCalledWith('test_secret_key', {
      apiVersion: '2023-10-16',
    });
  });

  test('should have correct provider identifier and display name', () => {
    expect(provider.provider).toBe('stripe');
    expect(provider.displayName).toBe('Stripe');
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

    expect(result.clientSecret).toBe('test_client_secret');
    expect(result.paymentIntentId).toBe('test_payment_intent_id');
    expect(result.error).toBeUndefined();
  });

  test('should process a payment successfully', async () => {
    const result = await provider.processPayment('test_payment_intent_id', {
      provider: 'stripe',
      type: 'credit_card',
      paymentMethodId: 'test_payment_method_id',
    });

    expect(result.success).toBe(true);
    expect(result.paymentId).toBe('test_payment_intent_id');
    expect(result.status).toBe('completed');
    expect(result.providerData?.provider).toBe('stripe');
  });

  test('should verify a payment', async () => {
    const result = await provider.verifyPayment('test_payment_intent_id');

    expect(result.success).toBe(true);
    expect(result.paymentId).toBe('test_payment_intent_id');
    expect(result.status).toBe('completed');
    expect(result.providerData?.provider).toBe('stripe');
  });

  test('should cancel a payment', async () => {
    const result = await provider.cancelPayment('test_payment_intent_id');

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('should refund a payment', async () => {
    const result = await provider.refundPayment('test_payment_intent_id', 100);

    expect(result.success).toBe(true);
    expect(result.refundId).toBe('test_refund_id');
    expect(result.error).toBeUndefined();
  });

  test('should verify webhook signatures', () => {
    const isValid = provider.verifyWebhookSignature('payload', 'signature');
    expect(isValid).toBe(true);
  });

  test('should get payment intent details', async () => {
    const paymentIntent = await provider.getPaymentIntent('test_payment_intent_id');
    expect(paymentIntent.id).toBe('test_payment_intent_id');
    expect(paymentIntent.status).toBe('succeeded');
  });

  test('should return client configuration', () => {
    const config = provider.getClientConfig();
    expect(config.publishableKey).toBe('test_publishable_key');
  });

  test('should fail with proper error if not initialized', async () => {
    // Create a new instance without initializing
    const uninitializedProvider = new StripePaymentProvider();

    const createResult = await uninitializedProvider.createPayment({
      value: 100,
      currency: 'USD',
    });
    expect(createResult.error).toBeDefined();

    const processResult = await uninitializedProvider.processPayment('test_id', {
      provider: 'stripe',
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
