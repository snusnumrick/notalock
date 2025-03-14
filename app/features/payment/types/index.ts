/**
 * Payment provider types and interfaces
 */

/**
 * Payment method types
 */
export type PaymentMethodType = 'credit_card' | 'paypal' | 'bank_transfer' | 'square' | 'stripe';

/**
 * Basic payment info structure
 */
export interface PaymentInfo {
  type: PaymentMethodType;
  cardholderName?: string;
  // We don't store actual payment details like card numbers
  // Those will be handled by the payment provider
  paymentMethodId?: string;
  paymentIntentId?: string;
  billingAddressSameAsShipping?: boolean;
  provider: string;
  providerData?: Record<string, string | number | boolean | object>;
}

/**
 * Payment status
 */
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

/**
 * Payment result returned by payment provider
 */
export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  paymentMethodId?: string;
  paymentIntentId?: string;
  status: PaymentStatus;
  error?: string;
  providerData?: Record<string, string | number | boolean | object>;
}

/**
 * Payment amount structure
 */
export interface PaymentAmount {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
}

/**
 * Payment options for configuring the payment flow
 */
export interface PaymentOptions {
  paymentMethodTypes?: PaymentMethodType[];
  clientName?: string;
  clientEmail?: string;
  // Other options specific to payment providers
  [key: string]: PaymentMethodType[] | string | undefined;
}
