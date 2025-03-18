import { describe, test, expect, vi, beforeEach } from 'vitest';
import { StripePaymentProvider } from '../StripePaymentProvider';
import Stripe from 'stripe';

// Mock the Stripe client
vi.mock('stripe', () => {
  // Create a mock Stripe client with all the necessary methods
  const mockStripeClient = vi.fn().mockImplementation(() => ({
    paymentMethods: {
      list: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'pm_test123',
            type: 'card',
          },
        ],
      }),
    },
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_test123',
        status: 'requires_payment_method',
        amount: 10000,
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {},
      }),
      retrieve: vi.fn().mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_test123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {},
      }),
      confirm: vi.fn().mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_test123',
        status: 'succeeded',
      }),
      cancel: vi.fn().mockResolvedValue({
        id: 'pi_test123',
        status: 'canceled',
      }),
    },
    refunds: {
      create: vi.fn().mockResolvedValue({
        id: 're_test123',
        payment_intent: 'pi_test123',
        amount: 10000,
        status: 'succeeded',
      }),
    },
    webhooks: {
      constructEvent: vi.fn().mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
          },
        },
      }),
    },
  }));

  // Return mockStripeClient as the default export
  return { default: mockStripeClient };
});

describe('StripePaymentProvider', () => {
  let provider: StripePaymentProvider;

  beforeEach(() => {
    provider = new StripePaymentProvider();
    vi.clearAllMocks();
  });

  test('should initialize with valid configuration', async () => {
    const result = await provider.initialize({
      secretKey: 'sk_test_123',
      publishableKey: 'pk_test_123',
      webhookSecret: 'whsec_test123',
    });

    expect(result).toBe(true);
    expect(Stripe).toHaveBeenCalledWith('sk_test_123', {
      apiVersion: '2025-02-24.acacia',
    });
  });

  test('should create a payment intent', async () => {
    // Initialize provider first
    await provider.initialize({
      secretKey: 'sk_test_123',
      publishableKey: 'pk_test_123',
    });

    const result = await provider.createPayment(
      {
        value: 100,
        currency: 'USD',
      },
      {
        orderReference: 'ORDER-123',
        description: 'Test payment',
      }
    );

    expect(result.paymentIntentId).toBe('pi_test123');
    expect(result.clientSecret).toBe('pi_test123_secret_test123');
  });

  test('should verify payment status', async () => {
    // Initialize provider first
    await provider.initialize({
      secretKey: 'sk_test_123',
      publishableKey: 'pk_test_123',
    });

    const result = await provider.verifyPayment('pi_test123');

    expect(result.success).toBe(true);
    expect(result.status).toBe('paid');
    expect(result.paymentId).toBe('pi_test123');
  });

  test('basic provider properties', () => {
    expect(provider.provider).toBe('stripe');
    expect(provider.displayName).toBe('Stripe');
  });
});
