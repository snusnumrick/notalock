import type { Order } from '../types';

/**
 * Helper function to convert JsonifyObject<Order> to Order
 * This safely casts serialized order data back to the Order type
 */
export function ensureOrderType(order: unknown): Order {
  // We need to use unknown as an intermediate step for this cast
  // since TypeScript would otherwise warn about incompatible types
  return order as Order;
}

/**
 * Helper function to convert JsonifyObject<Order>[] to Order[]
 * This safely casts serialized orders array back to the Order[] type
 */
export function ensureOrderArrayType(orders: unknown[]): Order[] {
  // Cast the entire array using unknown as an intermediate step
  return orders as Order[];
}
