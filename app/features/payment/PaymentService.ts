import type { PaymentAmount, PaymentInfo, PaymentOptions, PaymentResult } from './types';
import type { PaymentProviderInterface } from './providers/PaymentProviderInterface';
import { SquarePaymentProvider } from './providers/SquarePaymentProvider';
import { StripePaymentProvider } from './providers/StripePaymentProvider';

/**
 * Available payment provider types
 */
export type PaymentProviderType = 'square' | 'stripe' | 'mock';

/**
 * Service for managing payment operations
 * Acts as a facade for different payment providers
 */
export class PaymentService {
  private providers: Map<string, PaymentProviderInterface> = new Map();
  private activeProvider: PaymentProviderInterface | null = null;
  private defaultProvider: string = 'mock';

  /**
   * Initialize the payment service
   */
  constructor() {
    // Register built-in providers
    this.registerProvider(new SquarePaymentProvider());
    this.registerProvider(new StripePaymentProvider());
    this.registerMockProvider();
  }

  /**
   * Register a payment provider
   */
  registerProvider(provider: PaymentProviderInterface): void {
    this.providers.set(provider.provider, provider);
  }

  /**
   * Register a mock provider for testing
   */
  private registerMockProvider(): void {
    const mockProvider: PaymentProviderInterface = {
      provider: 'mock',
      displayName: 'Mock Provider (Testing)',

      initialize: async () => true,

      createPayment: async (_amount: PaymentAmount) => ({
        clientSecret: 'mock_secret',
        paymentIntentId: `mock_intent_${Date.now()}`,
      }),

      processPayment: async (paymentIntentId: string, _paymentInfo: PaymentInfo) => ({
        success: true,
        paymentId: `mock_payment_${Date.now()}`,
        paymentIntentId,
        status: 'paid',
        providerData: { provider: 'mock' },
      }),

      verifyPayment: async (paymentId: string) => ({
        success: true,
        paymentId,
        status: 'paid',
        providerData: { provider: 'mock' },
      }),

      cancelPayment: async () => ({ success: true }),

      refundPayment: async () => ({
        success: true,
        refundId: `mock_refund_${Date.now()}`,
      }),

      getClientConfig: () => ({ isMock: true }),
    };

    this.providers.set(mockProvider.provider, mockProvider);
  }

  /**
   * Get all available payment providers
   */
  getAvailableProviders(): { id: string; name: string }[] {
    return Array.from(this.providers.values()).map(provider => ({
      id: provider.provider,
      name: provider.displayName,
    }));
  }

  /**
   * Set the active payment provider by ID
   */
  async setActiveProvider(
    providerId: string,
    config?: Record<string, string | number | boolean | object>
  ): Promise<boolean> {
    const provider = this.providers.get(providerId);

    if (!provider) {
      throw new Error(`Payment provider '${providerId}' not found`);
    }

    if (config) {
      const initialized = await provider.initialize(config);

      if (!initialized) {
        throw new Error(`Failed to initialize payment provider '${providerId}'`);
      }
    }

    this.activeProvider = provider;
    return true;
  }

  /**
   * Set the default provider ID
   */
  setDefaultProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Payment provider '${providerId}' not found`);
    }

    this.defaultProvider = providerId;
  }

  /**
   * Get a specific payment provider by ID
   */
  getProvider(providerId: string): PaymentProviderInterface | null {
    return this.providers.get(providerId) || null;
  }

  /**
   * Get the currently active provider
   */
  private getCurrentProvider(): PaymentProviderInterface {
    if (this.activeProvider) {
      return this.activeProvider;
    }

    const defaultProvider = this.providers.get(this.defaultProvider);

    if (!defaultProvider) {
      throw new Error('No payment provider available');
    }

    return defaultProvider;
  }

  /**
   * Create a payment intent/transaction
   */
  async createPayment(
    amount: PaymentAmount,
    options?: PaymentOptions
  ): Promise<{ clientSecret?: string; paymentIntentId?: string; error?: string }> {
    const provider = this.getCurrentProvider();
    return provider.createPayment(amount, options);
  }

  /**
   * Process a payment with the provided payment information
   */
  async processPayment(paymentIntentId: string, paymentInfo: PaymentInfo): Promise<PaymentResult> {
    // If a specific provider is indicated in the payment info, use that
    if (paymentInfo.provider && this.providers.has(paymentInfo.provider)) {
      const provider = this.providers.get(paymentInfo.provider)!;
      return provider.processPayment(paymentIntentId, paymentInfo);
    }

    // Otherwise use the active/default provider
    const provider = this.getCurrentProvider();
    return provider.processPayment(paymentIntentId, {
      ...paymentInfo,
      provider: provider.provider,
    });
  }

  /**
   * Verify the status of a payment
   */
  async verifyPayment(paymentId: string, providerId?: string): Promise<PaymentResult> {
    const provider = providerId ? this.providers.get(providerId) : this.getCurrentProvider();

    if (!provider) {
      throw new Error(`Payment provider '${providerId}' not found`);
    }

    return provider.verifyPayment(paymentId);
  }

  /**
   * Cancel/void a payment
   */
  async cancelPayment(
    paymentId: string,
    providerId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const provider = providerId ? this.providers.get(providerId) : this.getCurrentProvider();

    if (!provider) {
      throw new Error(`Payment provider '${providerId}' not found`);
    }

    return provider.cancelPayment(paymentId);
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
    providerId?: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    const provider = providerId ? this.providers.get(providerId) : this.getCurrentProvider();

    if (!provider) {
      throw new Error(`Payment provider '${providerId}' not found`);
    }

    return provider.refundPayment(paymentId, amount);
  }

  /**
   * Get a payment intent by ID
   * This is a convenience method used primarily for webhook handling
   */
  async getPaymentIntent(paymentIntentId: string, providerId?: string): Promise<unknown> {
    const provider = providerId ? this.providers.get(providerId) : this.getCurrentProvider();

    if (!provider) {
      throw new Error(`Payment provider not found: ${providerId || 'default'}`);
    }

    if (provider.provider === 'stripe' && provider instanceof StripePaymentProvider) {
      return provider.getPaymentIntent(paymentIntentId);
    }

    throw new Error(`Get payment intent not implemented for provider: ${provider.provider}`);
  }

  /**
   * Get client-side configuration for the current payment provider
   */
  getClientConfig(providerId?: string): Record<string, string | number | boolean | object> {
    const provider = providerId ? this.providers.get(providerId) : this.getCurrentProvider();

    if (!provider) {
      throw new Error(`Payment provider '${providerId}' not found`);
    }

    return {
      provider: provider.provider,
      ...provider.getClientConfig(),
    };
  }
}

// Create a singleton instance
let paymentServiceInstance: PaymentService | null = null;

export function getPaymentService(): PaymentService {
  // For tests, we'll rely on the mock implementation
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    if (!paymentServiceInstance) {
      paymentServiceInstance = new PaymentService();
      paymentServiceInstance.setDefaultProvider('mock');
    }
    return paymentServiceInstance;
  }

  // Normal environment initialization
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService();
  }

  return paymentServiceInstance;
}
