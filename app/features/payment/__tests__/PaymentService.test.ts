import { describe, test, expect, vi, beforeEach } from 'vitest';
import { PaymentService, getPaymentService } from '../PaymentService';
import type { PaymentProviderInterface } from '../providers/PaymentProviderInterface';

// Create a mock payment provider for testing
class MockTestProvider implements PaymentProviderInterface {
  readonly provider = 'test_provider';
  readonly displayName = 'Test Provider';
  initialized = false;

  async initialize(): Promise<boolean> {
    this.initialized = true;
    return true;
  }

  async createPayment() {
    return {
      clientSecret: 'test_client_secret',
      paymentIntentId: 'test_payment_intent_id',
    };
  }

  async processPayment(paymentIntentId: string) {
    return {
      success: true,
      paymentId: 'test_payment_id',
      paymentIntentId,
      status: 'completed' as const,
      providerData: { provider: this.provider },
    };
  }

  async verifyPayment(paymentId: string) {
    return {
      success: true,
      paymentId,
      status: 'completed' as const,
      providerData: { provider: this.provider },
    };
  }

  async cancelPayment() {
    return { success: true };
  }

  async refundPayment() {
    return {
      success: true,
      refundId: 'test_refund_id',
    };
  }

  getClientConfig() {
    return { test: true };
  }
}

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let testProvider: MockTestProvider;

  beforeEach(() => {
    // Create a fresh service instance
    vi.resetModules();
    paymentService = new PaymentService();
    testProvider = new MockTestProvider();

    // Clear any existing providers and register test provider
    (paymentService as any).providers = new Map();
    paymentService.registerProvider(testProvider);
  });

  test('should register and retrieve providers', () => {
    const providers = paymentService.getAvailableProviders();
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe('test_provider');
    expect(providers[0].name).toBe('Test Provider');
  });

  test('should set the active provider', async () => {
    const result = await paymentService.setActiveProvider('test_provider', { test: true });
    expect(result).toBe(true);
    expect(testProvider.initialized).toBe(true);
  });

  test('should set the default provider', () => {
    paymentService.setDefaultProvider('test_provider');
    expect((paymentService as any).defaultProvider).toBe('test_provider');
  });

  test('should create a payment', async () => {
    paymentService.setDefaultProvider('test_provider');

    const result = await paymentService.createPayment({
      value: 100,
      currency: 'USD',
    });

    expect(result.clientSecret).toBe('test_client_secret');
    expect(result.paymentIntentId).toBe('test_payment_intent_id');
  });

  test('should process a payment', async () => {
    paymentService.setDefaultProvider('test_provider');

    const result = await paymentService.processPayment('test_payment_intent_id', {
      provider: 'test_provider',
      type: 'credit_card',
    });

    expect(result.success).toBe(true);
    expect(result.paymentId).toBe('test_payment_id');
    expect(result.status).toBe('completed');
  });

  test('singleton instance should work correctly', () => {
    const instance1 = getPaymentService();
    const instance2 = getPaymentService();

    expect(instance1).toBe(instance2);
  });
});
