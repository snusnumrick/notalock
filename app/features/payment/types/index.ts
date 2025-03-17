import { type PaymentStatus as DbPaymentStatus } from '~/features/supabase/types/Database.types';

/**
 * Payment method types supported by the application
 */
export type PaymentMethodType =
  | 'credit_card'
  | 'paypal'
  | 'apple_pay'
  | 'google_pay'
  | 'bank_transfer'
  | 'cash_on_delivery';

/**
 * Payment amount details
 */
export interface PaymentAmount {
  value: number;
  currency: string;
  items?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

/**
 * Additional payment options
 */
export interface PaymentOptions {
  provider?: string;
  customerId?: string;
  orderReference?: string;
  description?: string;
  metadata?: Record<string, string>;
  savePaymentMethod?: boolean;
}

/**
 * Payment information for processing
 */
export interface PaymentInfo {
  provider: string;
  type: string;
  paymentMethodId?: string;
  customerId?: string;
  billingInfo?: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  savePaymentMethod?: boolean;
}

/**
 * Payment status types
 */
export type PaymentStatus = DbPaymentStatus;
// export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded' | 'canceled';

/**
 * Payment result from providers
 */
export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  paymentIntentId?: string;
  paymentMethodId?: string;
  status: PaymentStatus;
  amount?: PaymentAmount;
  error?: string;
  providerData?: Record<string, unknown>;
  refundAmount?: number;
  refundReason?: string;
  refundDate?: string;
  orderReference?: string;
  metadata?: Record<string, unknown>;
}

/**
 * SDK window augmentation for global SDKs
 */
declare global {
  interface Window {
    Square?: unknown;
    Stripe?: (publishableKey: string) => unknown;
  }
}
