import { PaymentService } from '../PaymentService';
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

// Mock for getPaymentService
jest.mock('../PaymentService', () => {
  // Store the original module
  const originalModule = jest.requireActual('../PaymentService');

  // Create a singleton instance for testing
  let testServiceInstance: PaymentService | null = null;

  return {
    ...originalModule,
    // Override getPaymentService to return our test instance
    getPaymentService: jest.fn(() => {
      if (!testServiceInstance) {
        testServiceInstance = new originalModule.PaymentService();
      }
      return testServiceInstance;
    }),
  };
});

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let testProvider: MockTestProvider;

  beforeEach(() => {
    // Start with a fresh service instance
    jest.resetModules();
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

  test('should get provider by ID', () => {
    const provider = paymentService.getProvider('test_provider');
    expect(provider).toBe(testProvider);
  });

  test('should return null for non-existent provider', () => {
    const provider = paymentService.getProvider('non_existent');
    expect(provider).toBeNull();
  });

  test('should create a payment', async () => {
    const result = await paymentService.createPayment({
      value: 100,
      currency: 'USD',
    });

    expect(result.clientSecret).toBe('test_client_secret');
    expect(result.paymentIntentId).toBe('test_payment_intent_id');
  });

  test('should process a payment', async () => {
    const result = await paymentService.processPayment('test_payment_intent_id', {
      provider: 'test_provider',
      type: 'credit_card',
    });

    expect(result.success).toBe(true);
    expect(result.paymentId).toBe('test_payment_id');
    expect(result.status).toBe('completed');
  });

  test('should verify a payment', async () => {
    const result = await paymentService.verifyPayment('test_payment_id', 'test_provider');

    expect(result.success).toBe(true);
    expect(result.paymentId).toBe('test_payment_id');
    expect(result.status).toBe('completed');
  });

  test('should cancel a payment', async () => {
    const result = await paymentService.cancelPayment('test_payment_id', 'test_provider');

    expect(result.success).toBe(true);
  });

  test('should refund a payment', async () => {
    const result = await paymentService.refundPayment('test_payment_id', 100, 'test_provider');

    expect(result.success).toBe(true);
    expect(result.refundId).toBe('test_refund_id');
  });

  test('should get client configuration', () => {
    const config = paymentService.getClientConfig('test_provider');

    expect(config.provider).toBe('test_provider');
    expect(config.test).toBe(true);
  });

  test('should throw error when setting non-existent provider as active', async () => {
    await expect(paymentService.setActiveProvider('non_existent')).rejects.toThrow();
  });

  test('should throw error when setting non-existent provider as default', () => {
    expect(() => paymentService.setDefaultProvider('non_existent')).toThrow();
  });

  test('should throw error when getting client config for non-existent provider', () => {
    expect(() => paymentService.getClientConfig('non_existent')).toThrow();
  });

  test('singleton instance should work correctly', () => {
    // Using import here instead of require
    import { getPaymentService } from '../PaymentService';

    const instance1 = getPaymentService();
    const instance2 = getPaymentService();

    expect(instance1).toBe(instance2);
  });
});
