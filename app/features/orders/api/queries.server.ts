/**
 * Order Queries - Server-side
 *
 * This module provides a server-side API for retrieving order data.
 * These functions are used by the action handlers and route loaders.
 */

import { getOrderService } from './orderService';
import type { Order, OrderFilterOptions, OrderListResult } from '../types';

/**
 * Get an order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const orderService = await getOrderService();
    return await orderService.getOrderById(orderId);
  } catch (error) {
    console.error('Error in getOrderById:', error);
    return null;
  }
}

/**
 * Get an order by order number
 */
export async function getOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
  try {
    const orderService = await getOrderService();
    return await orderService.getOrderByOrderNumber(orderNumber);
  } catch (error) {
    console.error('Error in getOrderByOrderNumber:', error);
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
    console.error('Error in getUserOrders:', error);
    return [];
  }
}

/**
 * Get orders by email address
 */
export async function getOrdersByEmail(email: string): Promise<Order[]> {
  try {
    const orderService = await getOrderService();
    return await orderService.getOrdersByEmail(email);
  } catch (error) {
    console.error('Error in getOrdersByEmail:', error);
    return [];
  }
}

/**
 * Get orders with filtering and pagination
 */
export async function getOrders(options: OrderFilterOptions): Promise<OrderListResult> {
  try {
    const orderService = await getOrderService();
    return await orderService.getOrders(options);
  } catch (error) {
    console.error('Error in getOrders:', error);
    return {
      orders: [],
      total: 0,
      limit: options.limit || 10,
      offset: options.offset || 0,
    };
  }
}

/**
 * Get an order by payment intent ID
 */
export async function getOrderByPaymentIntentId(paymentIntentId: string): Promise<Order | null> {
  try {
    const orderService = await getOrderService();
    return await orderService.getOrderByPaymentIntentId(paymentIntentId);
  } catch (error) {
    console.error('Error in getOrderByPaymentIntentId:', error);
    return null;
  }
}
