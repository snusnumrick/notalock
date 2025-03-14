/**
 * Checkout process types and interfaces
 */

import { PaymentMethodType } from '~/features/payment';
import { Database } from '~/features/supabase/types/Database.types';

/**
 * Represents a customer address for shipping or billing
 */
export interface Address {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Available shipping methods
 */
export type ShippingMethod = 'standard' | 'express' | 'overnight';

/**
 * Shipping option with pricing
 */
export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  method: ShippingMethod;
  price: number;
  estimatedDelivery: string;
}

/**
 * Basic payment info structure
 */
export interface PaymentInfo {
  type: PaymentMethodType;
  cardholderName?: string;
  // We don't store actual payment details like card numbers
  // Those will be handled by the payment provider
  paymentMethodId?: string;
  billingAddressSameAsShipping?: boolean;
  billingAddress?: Address;
  provider?: string;
}

/**
 * Checkout step states
 */
export type CheckoutStep = 'information' | 'shipping' | 'payment' | 'review' | 'confirmation';

/**
 * Status of an order
 */
export type OrderStatus = 'created' | 'processing' | 'completed' | 'cancelled' | 'refunded';

/**
 * Checkout session for storing checkout progress
 */
export interface CheckoutSession {
  id: string;
  cartId: string;
  userId?: string;
  guestEmail?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingMethod?: ShippingMethod;
  shippingOption?: ShippingOption;
  paymentMethod?: PaymentMethodType;
  paymentInfo?: PaymentInfo;
  currentStep: CheckoutStep;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Order object that is created after successful checkout
 */
export interface Order {
  id: string;
  checkoutSessionId: string;
  cartId: string;
  userId?: string;
  guestEmail?: string;
  orderNumber: string;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethod: ShippingMethod;
  shippingCost: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: 'pending' | 'paid' | 'failed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Snake case mapping removed as it was unused

export type DbCheckoutSession = Database['public']['Tables']['checkout_sessions']['Row'];

export type OrderDBInput = Database['public']['Tables']['orders']['Insert'];
export type OrderDbItem = Database['public']['Tables']['order_items']['Row'];

/**
 * Individual item in an order
 */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  options?: {
    name: string;
    value: string;
  }[];
}
