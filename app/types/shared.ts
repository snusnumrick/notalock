/**
 * Shared type definitions used across the application
 * These types are imported from the Supabase database enums
 */

import type { Database } from '~/features/supabase/types/Database.types';

// Re-export the database enum types to make them available throughout the application
export type CheckoutStep = Database['public']['Enums']['checkout_step'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type PaymentMethodType = Database['public']['Enums']['payment_method_type'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type CartStatus = Database['public']['Enums']['cart_status'];
export type UserRole = Database['public']['Enums']['user_role'];

/**
 * Type guard functions to check if a string is a valid enum value
 */

export function isValidCheckoutStep(value: string): value is CheckoutStep {
  return ['information', 'shipping', 'payment', 'review', 'confirmation'].includes(
    value as CheckoutStep
  );
}

export function isValidOrderStatus(value: string): value is OrderStatus {
  return [
    'pending',
    'processing',
    'paid',
    'completed',
    'cancelled',
    'refunded',
    'failed',
    'created',
    'shipped',
    'delivered',
    'payment_failed',
  ].includes(value as OrderStatus);
}

export function isValidPaymentMethodType(value: string): value is PaymentMethodType {
  return ['credit_card', 'paypal', 'bank_transfer', 'square'].includes(value as PaymentMethodType);
}

export function isValidPaymentStatus(value: string): value is PaymentStatus {
  return ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'].includes(
    value as PaymentStatus
  );
}

export function isValidCartStatus(value: string): value is CartStatus {
  return [
    'active',
    'merged',
    'checkout',
    'completed',
    'abandoned',
    'duplicate',
    'cleared',
    'consolidated',
  ].includes(value as CartStatus);
}

export function isValidUserRole(value: string): value is UserRole {
  return ['customer', 'business', 'admin'].includes(value as UserRole);
}
