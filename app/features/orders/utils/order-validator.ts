/**
 * Order Validator Utility
 *
 * Validates order data before database operations
 */

import {
  type OrderCreateInput,
  type OrderStatus,
  type OrderUpdateInput,
  type PaymentStatus,
} from '../types';

/**
 * Validates order creation input
 */
export function validateOrderCreation(input: OrderCreateInput): void {
  // Check required fields
  if (!input.email) {
    throw new Error('Email is required for order creation');
  }

  // Check items array
  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('Cannot create order with no items');
  }

  // Check numeric values are not negative
  if (typeof input.shippingCost === 'number' && input.shippingCost < 0) {
    throw new Error('Shipping cost cannot be negative');
  }

  if (typeof input.taxAmount === 'number' && input.taxAmount < 0) {
    throw new Error('Tax amount cannot be negative');
  }

  // Validate total calculation if all fields are provided
  if (
    typeof input.subtotalAmount === 'number' &&
    typeof input.shippingCost === 'number' &&
    typeof input.taxAmount === 'number' &&
    typeof input.totalAmount === 'number'
  ) {
    const calculatedTotal = input.subtotalAmount + input.shippingCost + input.taxAmount;
    // Allow for small floating point differences (up to 1 cent)
    if (Math.abs(calculatedTotal - input.totalAmount) > 0.01) {
      throw new Error('Total amount does not match the sum of subtotal, shipping, and tax');
    }
  }

  // Validate each item has required fields
  input.items.forEach((item, index) => {
    if (!item.productId && !item.product_id) {
      throw new Error(`Item at index ${index} is missing a product ID`);
    }

    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      throw new Error(`Item at index ${index} has an invalid quantity`);
    }

    if (typeof item.price !== 'number' || item.price < 0) {
      throw new Error(`Item at index ${index} has an invalid price`);
    }
  });
}

/**
 * Valid order statuses
 */
export const VALID_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'paid',
  'completed',
  'cancelled',
  'refunded',
  'failed',
];

/**
 * Valid payment statuses
 */
export const VALID_PAYMENT_STATUSES: PaymentStatus[] = [
  'pending',
  'processing',
  'paid',
  'failed',
  'refunded',
  'cancelled',
];

/**
 * Allowed order status transitions
 * Key: current status, Value: array of allowed next statuses (including current status for idempotency)
 */
export const ALLOWED_ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['pending', 'processing', 'paid', 'cancelled', 'failed'],
  processing: ['processing', 'paid', 'completed', 'cancelled', 'failed', 'pending'],
  paid: ['paid', 'processing', 'completed', 'refunded'],
  completed: ['completed', 'refunded', 'processing'], // Allow back to processing for corrections
  cancelled: ['cancelled', 'pending'], // Allow reactivation of cancelled orders
  refunded: ['refunded'],
  failed: ['failed', 'pending', 'processing'],
};

/**
 * Allowed payment status transitions
 * Key: current status, Value: array of allowed next statuses
 */
export const ALLOWED_PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['processing', 'paid', 'failed', 'cancelled'],
  processing: ['paid', 'failed', 'cancelled'],
  paid: ['refunded'],
  failed: ['pending', 'processing'],
  refunded: [],
  cancelled: ['pending'],
};

/**
 * Get allowed status transitions for a current status
 */
export function getAllowedOrderStatusTransitions(currentStatus: OrderStatus): OrderStatus[] {
  return ALLOWED_ORDER_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Get allowed payment status transitions for a current status
 */
export function getAllowedPaymentStatusTransitions(
  currentPaymentStatus: PaymentStatus
): PaymentStatus[] {
  return ALLOWED_PAYMENT_STATUS_TRANSITIONS[currentPaymentStatus] || [];
}

/**
 * Validates order update input
 */
export function validateOrderUpdate(
  input: OrderUpdateInput,
  currentStatus?: OrderStatus,
  currentPaymentStatus?: PaymentStatus
): void {
  console.log('OrderValidator - validateOrderUpdate called with:', {
    input,
    currentStatus,
    currentPaymentStatus,
  });

  // Check that status and payment status are not updated together
  if (input.status && input.paymentStatus) {
    throw new Error('Cannot update both order status and payment status in one operation');
  }

  // Validate order status
  if (input.status) {
    console.log(`Validating order status transition: ${currentStatus} → ${input.status}`);

    if (!VALID_ORDER_STATUSES.includes(input.status)) {
      throw new Error(`Invalid order status: ${input.status}`);
    }

    // Validate status transition if we have current status
    if (currentStatus && !ALLOWED_ORDER_STATUS_TRANSITIONS[currentStatus].includes(input.status)) {
      console.error(`Invalid status transition detected:`, {
        from: currentStatus,
        to: input.status,
        allowedTransitions: ALLOWED_ORDER_STATUS_TRANSITIONS[currentStatus],
      });
      throw new Error(
        `Invalid status transition: Cannot change from ${currentStatus} to ${input.status}. ` +
          `Allowed transitions: ${ALLOWED_ORDER_STATUS_TRANSITIONS[currentStatus].join(', ')}`
      );
    }
  }

  // Validate payment status
  if (input.paymentStatus) {
    console.log(
      `Validating payment status transition: ${currentPaymentStatus} → ${input.paymentStatus}`
    );

    if (!VALID_PAYMENT_STATUSES.includes(input.paymentStatus)) {
      throw new Error(`Invalid payment status: ${input.paymentStatus}`);
    }

    // Validate payment status transition if we have current status
    if (
      currentPaymentStatus &&
      !ALLOWED_PAYMENT_STATUS_TRANSITIONS[currentPaymentStatus].includes(input.paymentStatus)
    ) {
      console.error(`Invalid payment status transition detected:`, {
        from: currentPaymentStatus,
        to: input.paymentStatus,
        allowedTransitions: ALLOWED_PAYMENT_STATUS_TRANSITIONS[currentPaymentStatus],
      });
      throw new Error(
        `Invalid payment status transition: Cannot change from ${currentPaymentStatus} to ${input.paymentStatus}. ` +
          `Allowed transitions: ${ALLOWED_PAYMENT_STATUS_TRANSITIONS[currentPaymentStatus].join(', ')}`
      );
    }
  }

  // Validate metadata is an object if provided
  if (
    input.metadata !== undefined &&
    (typeof input.metadata !== 'object' || input.metadata === null)
  ) {
    throw new Error('Metadata must be an object');
  }

  // Validate numeric values are not negative
  if (typeof input.shippingCost === 'number' && input.shippingCost < 0) {
    throw new Error('Shipping cost cannot be negative');
  }

  if (typeof input.taxAmount === 'number' && input.taxAmount < 0) {
    throw new Error('Tax amount cannot be negative');
  }
}
