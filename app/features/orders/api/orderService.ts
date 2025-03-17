import { type SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  type Order,
  type OrderCreateInput,
  type OrderFilterOptions,
  type OrderItem,
  type OrderListResult,
  type OrderStatus,
  type OrderStatusHistory,
  type OrderUpdateInput,
  type PaymentStatus,
  type DbOrder,
  type DbOrderItem,
  type DbOrderStatusHistory,
  type OrderMetadata,
} from '../types';
import { type PaymentResult } from '~/features/payment/types';
import { type Address } from '~/features/checkout/types/checkout.types';
import { type Json } from '~/features/supabase/types/Database.types';

// singleto instance of OrderService
let orderServiceInstance: OrderService | null = null;

/**
 * Order Service
 * Handles all order related operations including CRUD operations
 */
export class OrderService {
  private supabase: SupabaseClient;

  /**
   * Initialize the order service with Supabase client
   */
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Generate a unique order number
   * Format: NO-YYYYMMDD-XXXX where XXXX is a random alphanumeric string
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const datePart = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('');

    // Generate a random 4-character alphanumeric string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `NO-${datePart}-${randomPart}`;
  }

  /**
   * Create a new order
   */
  async createOrder(input: OrderCreateInput): Promise<Order> {
    // Generate a unique order ID and order number
    const orderId = uuidv4();
    const orderNumber = this.generateOrderNumber();
    const now = new Date().toISOString();

    // Map the cart items to order items
    const orderItems = input.items.map(item => {
      const totalPrice = (item.price || 0) * (item.quantity || 0);
      return {
        id: uuidv4(),
        order_id: orderId,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        name: item.product?.name || `Product ${item.product_id}`,
        sku:
          item.product?.sku ||
          (item.product_id ? `SKU-${item.product_id.substring(0, 8)}` : 'SKU-UNKNOWN'),
        quantity: item.quantity,
        unit_price: item.price,
        total_price: totalPrice,
        image_url: item.product?.image_url || null,
        options: {},
        created_at: now,
        updated_at: now,
      };
    });

    // Prepare the order data
    const orderData = {
      id: orderId,
      order_number: orderNumber,
      user_id: input.userId || null,
      email: input.email,
      status: 'pending' as OrderStatus,
      payment_status: 'pending' as PaymentStatus,
      payment_intent_id: input.paymentIntentId || null,
      payment_method_id: input.paymentMethodId || null,
      payment_provider: input.paymentProvider || null,
      shipping_address: input.shippingAddress || null,
      billing_address: input.billingAddress || null,
      shipping_method: input.shippingMethod || null,
      shipping_cost: input.shippingCost,
      tax_amount: input.taxAmount,
      subtotal_amount: input.subtotalAmount,
      total_amount: input.totalAmount,
      notes: null,
      metadata: input.metadata || null,
      checkout_session_id: input.checkoutSessionId || null,
      cart_id: input.cartId || null,
      created_at: now,
      updated_at: now,
    };

    try {
      // Insert the order
      const { error: orderError } = await this.supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      // Insert order items
      const { error: itemsError } = await this.supabase.from('order_items').insert(orderItems);

      if (itemsError) {
        // If there's an error with order items, clean up the order
        await this.supabase.from('orders').delete().eq('id', orderId);
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }

      // If the order is created from a cart, update the cart status
      if (input.cartId) {
        try {
          await this.supabase
            .from('carts')
            .update({ status: 'completed', updated_at: now })
            .eq('id', input.cartId);
        } catch (cartError) {
          console.error('Error updating cart status:', cartError);
          // Continue even if cart update fails
        }
      }

      // Fetch the complete order with items
      return this.getOrderById(orderId);
    } catch (error) {
      console.error('Error in createOrder:', error);
      throw error;
    }
  }

  /**
   * Get an order by ID with all related items and status history
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      console.log('Getting order by ID:', orderId);

      // Get the order
      const { data: order, error: orderError } = await this.supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) {
        throw new Error(`Failed to get order: ${orderError.message}`);
      }

      // Get order items
      const { data: orderItems, error: itemsError } = await this.supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) {
        throw new Error(`Failed to get order items: ${itemsError.message}`);
      }

      // Get order status history
      const { data: statusHistory, error: historyError } = await this.supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (historyError) {
        throw new Error(`Failed to get order status history: ${historyError.message}`);
      }

      // Format and return the complete order
      return this.formatOrderResponse(order, orderItems, statusHistory);
    } catch (error) {
      console.error('Error in getOrderById:', error);
      throw error;
    }
  }

  /**
   * Get an order by order number
   */
  async getOrderByOrderNumber(orderNumber: string): Promise<Order> {
    try {
      // Get the order
      const { data: order, error: orderError } = await this.supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (orderError) {
        throw new Error(`Failed to get order: ${orderError.message}`);
      }

      return this.getOrderById(order.id);
    } catch (error) {
      console.error('Error in getOrderByOrderNumber:', error);
      throw error;
    }
  }

  /**
   * Get an order by payment intent ID
   */
  async getOrderByPaymentIntentId(paymentIntentId: string): Promise<Order | null> {
    try {
      // Get the order
      const { data: order, error: orderError } = await this.supabase
        .from('orders')
        .select('*')
        .eq('payment_intent_id', paymentIntentId)
        .maybeSingle();

      if (orderError) {
        throw new Error(`Failed to get order: ${orderError.message}`);
      }

      if (!order) {
        return null;
      }

      return this.getOrderById(order.id);
    } catch (error) {
      console.error('Error in getOrderByPaymentIntentId:', error);
      throw error;
    }
  }

  /**
   * Get orders for a user
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      // Get all orders for the user
      const { data: orders, error: ordersError } = await this.supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw new Error(`Failed to get user orders: ${ordersError.message}`);
      }

      // Get order details for each order
      const orderPromises = orders.map(order => this.getOrderById(order.id));
      return Promise.all(orderPromises);
    } catch (error) {
      console.error('Error in getUserOrders:', error);
      throw error;
    }
  }

  /**
   * Get orders by email address (for guest checkout)
   */
  async getOrdersByEmail(email: string): Promise<Order[]> {
    try {
      // Get all orders for the email
      const { data: orders, error: ordersError } = await this.supabase
        .from('orders')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw new Error(`Failed to get orders by email: ${ordersError.message}`);
      }

      // Get order details for each order
      const orderPromises = orders.map(order => this.getOrderById(order.id));
      return Promise.all(orderPromises);
    } catch (error) {
      console.error('Error in getOrdersByEmail:', error);
      throw error;
    }
  }

  /**
   * Get orders with filtering, sorting, and pagination
   */
  async getOrders(options: OrderFilterOptions): Promise<OrderListResult> {
    try {
      let query = this.supabase.from('orders').select('*', { count: 'exact' });

      // Apply filters
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }

      if (options.email) {
        query = query.eq('email', options.email);
      }

      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      if (options.paymentStatus) {
        if (Array.isArray(options.paymentStatus)) {
          query = query.in('payment_status', options.paymentStatus);
        } else {
          query = query.eq('payment_status', options.paymentStatus);
        }
      }

      if (options.dateFrom) {
        query = query.gte('created_at', options.dateFrom);
      }

      if (options.dateTo) {
        query = query.lte('created_at', options.dateTo);
      }

      if (options.minAmount) {
        query = query.gte('total_amount', options.minAmount);
      }

      if (options.maxAmount) {
        query = query.lte('total_amount', options.maxAmount);
      }

      // Add search query logic for order_number or email
      if (options.searchQuery) {
        query = query.or(
          `order_number.ilike.%${options.searchQuery}%,email.ilike.%${options.searchQuery}%`
        );
      }

      // Sorting
      const sortBy = options.sortBy || 'createdAt';
      const sortField = this.camelToSnakeCase(sortBy);
      const sortDirection = options.sortDirection || 'desc';
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      // Pagination
      const limit = options.limit || 10;
      const offset = options.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Execute the query
      const { data: orders, error, count } = await query;

      if (error) {
        throw new Error(`Failed to get orders: ${error.message}`);
      }

      // Get full order details for each order
      const orderPromises = orders.map(order => this.getOrderById(order.id));
      const detailedOrders = await Promise.all(orderPromises);

      return {
        orders: detailedOrders,
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error in getOrders:', error);
      throw error;
    }
  }

  /**
   * Update an order
   */
  async updateOrder(orderId: string, input: OrderUpdateInput): Promise<Order> {
    try {
      // Prepare the update data
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Add fields to update if they are provided
      if (input.status) updateData.status = input.status;
      if (input.paymentStatus) updateData.payment_status = input.paymentStatus;
      if (input.paymentIntentId) updateData.payment_intent_id = input.paymentIntentId;
      if (input.paymentMethodId) updateData.payment_method_id = input.paymentMethodId;
      if (input.notes) updateData.notes = input.notes;
      if (input.metadata) updateData.metadata = input.metadata;

      // Update the order
      const { error: updateError } = await this.supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) {
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      // Return the updated order
      return this.getOrderById(orderId);
    } catch (error) {
      console.error('Error in updateOrder:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): Promise<Order> {
    return this.updateOrder(orderId, { status, notes });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    paymentIntentId?: string,
    notes?: string
  ): Promise<Order> {
    return this.updateOrder(orderId, { paymentStatus, paymentIntentId, notes });
  }

  /**
   * Update order status based on payment result
   */
  async updateOrderFromPayment(orderId: string, paymentResult: PaymentResult): Promise<Order> {
    // Map payment status to order status
    let orderStatus: OrderStatus;
    let paymentStatus: PaymentStatus;

    // Set default values based on success flag
    if (paymentResult.success) {
      orderStatus = 'paid';
      paymentStatus = 'paid';
    } else {
      orderStatus = 'failed';
      paymentStatus = 'failed';
    }

    // Override with specific payment status if provided
    switch (paymentResult.status) {
      case 'completed':
        orderStatus = 'paid';
        paymentStatus = 'paid';
        break;
      case 'failed':
        orderStatus = 'failed';
        paymentStatus = 'failed';
        break;
      case 'pending':
        orderStatus = 'processing';
        paymentStatus = 'pending';
        break;
      case 'refunded':
        orderStatus = 'refunded';
        paymentStatus = 'refunded';
        break;
      case 'canceled':
        orderStatus = 'cancelled';
        paymentStatus = 'failed';
        break;
    }

    // Include payment details in notes
    const notes = paymentResult.error
      ? `Payment error: ${paymentResult.error}`
      : `Payment processed successfully.`;

    // Add refund information if available
    const refundInfo = paymentResult.refundAmount
      ? ` Refunded amount: ${paymentResult.refundAmount}. Reason: ${
          paymentResult.refundReason || 'Not specified'
        }.`
      : '';

    // Update order with payment information
    const updateData: OrderUpdateInput = {
      status: orderStatus,
      paymentStatus,
      paymentIntentId: paymentResult.paymentIntentId,
      notes: notes + refundInfo,
      metadata: {
        // Store payment result as a JSON string
        paymentResultData: JSON.stringify({
          success: paymentResult.success,
          status: paymentResult.status,
          paymentId: paymentResult.paymentId,
          error: paymentResult.error,
          refundAmount: paymentResult.refundAmount,
          refundReason: paymentResult.refundReason,
          refundDate: paymentResult.refundDate,
        }),
        // Add payment details as tracking info
        tracking: {
          carrier: 'payment',
          trackingNumber: paymentResult.paymentId || 'unknown',
          paymentId: paymentResult.paymentId,
          status: paymentResult.status,
        },
      },
    };

    return this.updateOrder(orderId, updateData);
  }

  /**
   * Helper function to safely parse JSON or handle primitive values
   */
  private safelyParseMetadata(
    metadata: Json | string | null | undefined
  ): Record<string, unknown> | undefined {
    if (!metadata) return undefined;

    if (typeof metadata === 'object' && metadata !== null) {
      return metadata as Record<string, unknown>;
    }

    // If it's a JSON string, try to parse it
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata) as Record<string, unknown>;
      } catch (e) {
        // If it can't be parsed as JSON, store it as a string value
        return { value: metadata };
      }
    }

    // For other primitive types, wrap them in an object
    return { value: metadata };
  }

  /**
   * Check if an object has all required Address properties
   */
  private isValidAddress(obj: unknown): obj is Address {
    if (!obj || typeof obj !== 'object') return false;

    // Use type assertion with Record to check for expected properties
    const addressCandidate = obj as Record<string, unknown>;

    return (
      typeof addressCandidate.firstName === 'string' &&
      typeof addressCandidate.lastName === 'string' &&
      typeof addressCandidate.phone === 'string' &&
      typeof addressCandidate.address1 === 'string' &&
      typeof addressCandidate.city === 'string' &&
      typeof addressCandidate.state === 'string' &&
      typeof addressCandidate.postalCode === 'string' &&
      typeof addressCandidate.country === 'string'
    );
  }

  /**
   * Helper function to safely parse address data
   */
  private safelyParseAddress(address: Json | null): Address | undefined {
    if (!address) return undefined;

    // If it's already an object, validate it
    if (typeof address === 'object' && address !== null) {
      if (Array.isArray(address)) {
        console.error('Address data is an array, expected an object');
        return undefined;
      }

      // Use type guard to validate the address
      if (this.isValidAddress(address)) {
        return address;
      } else {
        console.error('Invalid address object, missing required fields');
        return undefined;
      }
    }

    // If it's a JSON string, try to parse it
    if (typeof address === 'string') {
      try {
        const parsed = JSON.parse(address);
        if (this.isValidAddress(parsed)) {
          return parsed;
        } else {
          console.error('Parsed address string does not contain required fields');
          return undefined;
        }
      } catch (e) {
        console.error('Failed to parse address from string:', e);
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Map Supabase OrderStatus to application OrderStatus
   */
  private mapOrderStatus(status: string): OrderStatus {
    // Map from Supabase OrderStatus to application OrderStatus
    // Handle the 'created' status which is in Supabase but not in application OrderStatus
    if (status === 'created') {
      return 'pending';
    }
    return status as OrderStatus;
  }

  /**
   * Format order response from database objects
   */
  private formatOrderResponse(
    order: DbOrder,
    orderItems: DbOrderItem[],
    statusHistory?: DbOrderStatusHistory[]
  ): Order {
    // Format order items
    const items: OrderItem[] = orderItems.map(item => ({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      variantId: item.variant_id || undefined,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      price: Number(item.price || 0), // Ensure price is always present
      unitPrice: Number(item.unit_price || 0),
      totalPrice: Number(item.total_price || 0),
      imageUrl: item.image_url || undefined,
      options: item.options ? this.formatOrderItemOptions(item.options) : undefined,
      metadata: this.safelyParseMetadata(item.metadata as Json),
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    // Format status history if available
    const formattedHistory: OrderStatusHistory[] | undefined = statusHistory
      ? statusHistory.map(entry => ({
          id: entry.id,
          orderId: entry.order_id,
          status: this.mapOrderStatus(entry.status),
          date: entry.date || entry.created_at || new Date().toISOString(), // Ensure date is always present
          note: entry.note,
          notes: entry.notes || undefined,
          createdAt: entry.created_at,
          createdBy: entry.created_by || undefined,
        }))
      : undefined;

    // Format and return the complete order
    return {
      id: order.id,
      orderNumber: order.order_number,
      userId: order.user_id || undefined,
      email: order.email || order.guest_email || '',
      status: this.mapOrderStatus(order.status),
      paymentStatus: order.payment_status as PaymentStatus,
      paymentIntentId: order.payment_intent_id || undefined,
      paymentMethodId: order.payment_method_id || undefined,
      paymentProvider: order.payment_provider || undefined,
      shippingAddress: this.safelyParseAddress(order.shipping_address as Json),
      billingAddress: this.safelyParseAddress(order.billing_address as Json),
      shippingMethod: order.shipping_method || undefined,
      shippingCost: Number(order.shipping_cost || 0),
      taxAmount: Number(order.tax || 0),
      subtotalAmount: Number(order.subtotal || 0),
      totalAmount: Number(order.total || 0),
      items,
      statusHistory: formattedHistory,
      notes: order.notes || undefined,
      metadata: this.safelyParseMetadata(order.metadata as Json) as unknown as OrderMetadata,
      checkoutSessionId: order.checkout_session_id || undefined,
      cartId: order.cart_id || undefined,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  }

  /**
   * Format order item options from JSON
   */
  private formatOrderItemOptions(options: unknown): { name: string; value: string }[] {
    if (!options) {
      return [];
    }

    // If already an array, map each item to ensure correct structure
    if (Array.isArray(options)) {
      return options.map(opt => {
        // If item is already in correct structure
        if (opt && typeof opt === 'object' && 'name' in opt && 'value' in opt) {
          return {
            name: String(opt.name || ''),
            value: String(opt.value || ''),
          };
        }
        // If item is a simple key-value object, convert to name-value
        else if (opt && typeof opt === 'object') {
          const key = Object.keys(opt)[0] || '';
          return {
            name: key,
            value: String(key in opt ? opt[key] : ''),
          };
        }
        // Fallback for primitive values
        return {
          name: 'option',
          value: String(opt || ''),
        };
      });
    }

    // If options is an object but not array, convert key-value pairs
    if (typeof options === 'object' && options !== null) {
      return Object.entries(options).map(([key, value]) => ({
        name: key,
        value: String(value || ''),
      }));
    }

    // Fallback: return empty array
    return [];
  }

  /**
   * Convert camelCase to snake_case for database queries
   */
  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

/**
 * Create and export a singleton function to get an order service instance
 */
export async function getOrderService(): Promise<OrderService> {
  if (!orderServiceInstance) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    orderServiceInstance = new OrderService(supabase);
  }
  return orderServiceInstance;
}
