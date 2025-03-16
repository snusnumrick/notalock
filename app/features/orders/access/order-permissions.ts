/**
 * Order Permissions Module
 *
 * Handles access control checks for orders
 */

import type { Order } from '../types';

/**
 * User role types
 */
export type UserRole = 'admin' | 'customer' | 'guest' | 'staff';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Permission action types
 */
export type OrderAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'updateStatus'
  | 'updatePayment'
  | 'export'
  | 'cancel'
  | 'refund';

/**
 * Check if a user has permission to perform an action on an order
 */
export function canPerformOrderAction(
  user: User | null,
  action: OrderAction,
  order?: Order
): boolean {
  // Admin can do everything
  if (user?.role === 'admin') {
    return true;
  }

  // Staff has limited permissions
  if (user?.role === 'staff') {
    switch (action) {
      case 'view':
      case 'updateStatus':
      case 'export':
        return true;
      case 'update':
      case 'updatePayment':
        return order?.status !== 'completed' && order?.status !== 'refunded';
      case 'cancel':
        return order?.status === 'pending' || order?.status === 'processing';
      case 'refund':
        return order?.status === 'paid' || order?.status === 'completed';
      case 'create':
      case 'delete':
        return false;
    }
  }

  // Customer can only access their own orders
  if (user?.role === 'customer') {
    // Must have a user ID to match against
    if (!user.id) {
      return false;
    }

    // Must have an order to check ownership for most actions
    if (!order && action !== 'create') {
      return false;
    }

    // Customers can only access their own orders
    if (order && order.userId !== user.id) {
      return false;
    }

    switch (action) {
      case 'view':
        return true;
      case 'create':
        return true;
      case 'cancel':
        return order?.status === 'pending' || order?.status === 'processing';
      case 'update':
      case 'delete':
      case 'updateStatus':
      case 'updatePayment':
      case 'export':
      case 'refund':
        return false;
    }
  }

  // Guest customers can access orders via email/order number
  if (user?.role === 'guest') {
    switch (action) {
      case 'view':
        // Guest needs to have an email that matches the order
        return !!order && order.email === user.email;
      case 'create':
        return true;
      case 'cancel':
        // Can only cancel their own orders in certain states
        return (
          !!order &&
          order.email === user.email &&
          (order.status === 'pending' || order.status === 'processing')
        );
      case 'update':
      case 'delete':
      case 'updateStatus':
      case 'updatePayment':
      case 'export':
      case 'refund':
        return false;
    }
  }

  // Default deny
  return false;
}

/**
 * Check if a user can view an order's sensitive data
 */
export function canViewOrderSensitiveData(user: User | null, order: Order): boolean {
  // Admin and staff can see everything
  if (user?.role === 'admin' || user?.role === 'staff') {
    return true;
  }

  // Customer can only view sensitive data of their own orders
  if (user?.role === 'customer') {
    return !!user.id && order.userId === user.id;
  }

  // Guest can only view sensitive data if email matches
  if (user?.role === 'guest') {
    return order.email === user.email;
  }

  return false;
}

/**
 * Filter sensitive data from an order based on user permissions
 */
export function filterOrderSensitiveData(user: User | null, order: Order): Order {
  // If user can view sensitive data, return the full order
  if (canViewOrderSensitiveData(user, order)) {
    return order;
  }

  // Otherwise, remove sensitive fields
  const filteredOrder = { ...order };

  // Remove payment information
  delete filteredOrder.paymentIntentId;
  delete filteredOrder.paymentMethodId;

  // Remove full address details but keep basic shipping info
  if (filteredOrder.shippingAddress) {
    filteredOrder.shippingAddress = {
      ...filteredOrder.shippingAddress,
      phone: '***', // Mask phone
      address1: '***', // Mask address
      address2: undefined,
      postalCode: '***', // Mask postal code
    };
  }

  // Remove billing address completely
  delete filteredOrder.billingAddress;

  return filteredOrder;
}

/**
 * Get user's accessible order actions for an order
 */
export function getAccessibleOrderActions(user: User | null, order: Order): OrderAction[] {
  // Check all possible actions
  const allActions: OrderAction[] = [
    'view',
    'create',
    'update',
    'delete',
    'updateStatus',
    'updatePayment',
    'export',
    'cancel',
    'refund',
  ];

  // Filter to only actions the user has permission for
  return allActions.filter(action => canPerformOrderAction(user, action, order));
}
