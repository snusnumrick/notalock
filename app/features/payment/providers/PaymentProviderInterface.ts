import type { PaymentAmount, PaymentInfo, PaymentOptions, PaymentResult } from '../types';

/**
 * Interface for payment providers
 * All payment providers must implement this interface
 */
export interface PaymentProviderInterface {
  /**
   * Provider identifier
   */
  readonly provider: string;

  /**
   * Provider display name
   */
  readonly displayName: string;

  /**
   * Initialize the payment provider with configuration
   */
  initialize(config: Record<string, string | number | boolean | object>): Promise<boolean>;

  /**
   * Create a payment intent/transaction
   */
  createPayment(
    amount: PaymentAmount,
    options?: PaymentOptions
  ): Promise<{ clientSecret?: string; paymentIntentId?: string; error?: string }>;

  /**
   * Process a payment with the provided payment information
   */
  processPayment(paymentIntentId: string, paymentInfo: PaymentInfo): Promise<PaymentResult>;

  /**
   * Verify the status of a payment
   */
  verifyPayment(paymentId: string): Promise<PaymentResult>;

  /**
   * Cancel/void a payment
   */
  cancelPayment(paymentId: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Refund a payment
   */
  refundPayment(
    paymentId: string,
    amount?: number
  ): Promise<{ success: boolean; refundId?: string; error?: string }>;

  /**
   * Get client-side configuration for the payment provider
   */
  getClientConfig(): Record<string, string | number | boolean>;
}
