/**
 * Order Actions Server Module
 * Handles order operations including status updates
 */

import type { PaymentResult } from '~/features/payment/types';
import { type Order } from '../types';
import { getOrderService } from './orderService';

/**
 * Update order status based on payment result
 */
export async function updateOrderStatusFromPayment(
  orderReference: string | unknown,
  paymentResult: PaymentResult
): Promise<void> {
  try {
    // Verify we have a valid order reference
    if (!orderReference || typeof orderReference !== 'string') {
      console.error('Invalid order reference:', orderReference);
      return;
    }

    console.log(
      `Updating order ${orderReference} status based on payment ${paymentResult.paymentIntentId}`,
      paymentResult
    );

    // Get the order service
    const orderService = await getOrderService();

    // Try to find the order by different possible references
    let order: Order | null = null;

    // First try looking up by order number
    try {
      order = await orderService.getOrderByOrderNumber(orderReference);
      console.log(`Found order by order number: ${orderReference}`);
    } catch (e) {
      // If not found by order number, continue to next method
      console.log(`Order not found by order number: ${orderReference}`);
    }

    // If not found, try by payment intent ID if available
    if (!order && paymentResult.paymentIntentId) {
      try {
        order = await orderService.getOrderByPaymentIntentId(paymentResult.paymentIntentId);
        console.log(`Found order by payment intent ID: ${paymentResult.paymentIntentId}`);
      } catch (e) {
        console.log(`Order not found by payment intent ID: ${paymentResult.paymentIntentId}`);
      }
    }

    // If not found, try by ID (UUID format)
    if (
      !order &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderReference)
    ) {
      try {
        order = await orderService.getOrderById(orderReference);
        console.log(`Found order by UUID: ${orderReference}`);
      } catch (e) {
        console.log(`Order not found by UUID: ${orderReference}`);
      }
    }

    // If we still don't have an order, log an error and return
    if (!order) {
      console.error(`No order found for reference: ${orderReference}`);
      return;
    }

    // Update the order with the payment result
    const updatedOrder = await orderService.updateOrderFromPayment(order.id, paymentResult);
    console.log(`Order ${updatedOrder.orderNumber} updated with status: ${updatedOrder.status}`);

    // TODO: Send order status update notifications
    // This would be implementation-specific (email, SMS, etc.)
  } catch (error) {
    console.error('Error updating order status from payment:', error);
    throw error;
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const orderService = await getOrderService();
    return await orderService.getOrderById(orderId);
  } catch (error) {
    console.error('Error getting order by ID:', error);
    return null;
  }
}

/**
 * Get order by order number
 */
export async function getOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
  try {
    const orderService = await getOrderService();
    return await orderService.getOrderByOrderNumber(orderNumber);
  } catch (error) {
    console.error('Error getting order by order number:', error);
    return null;
  }
}

/**
 * Get orders for a user
 */
export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const orderService = await getOrderService();
    return await orderService.getUserOrders(userId);
  } catch (error) {
    console.error('Error getting user orders:', error);
    return [];
  }
}

/**
 * Get orders by email (for guest checkout)
 */
export async function getOrdersByEmail(email: string): Promise<Order[]> {
  try {
    const orderService = await getOrderService();
    return await orderService.getOrdersByEmail(email);
  } catch (error) {
    console.error('Error getting orders by email:', error);
    return [];
  }
}
