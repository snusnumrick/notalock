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
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded' | 'canceled';

/**
 * Payment result from providers
 */
export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  paymentIntentId?: string;
  paymentMethodId?: string;
  status: PaymentStatus;
  error?: string;
  providerData?: Record<string, unknown>;
  refundAmount?: number;
  refundReason?: string;
  refundDate?: string;
}

/**
 * SDK window augmentation for global SDKs
 */
declare global {
  interface Window {
    Square?: unknown;
    Stripe?: unknown;
  }
}
