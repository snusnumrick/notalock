import { type CartItem } from '~/features/cart/types/cart.types';
import { type Address } from '~/features/checkout/types/checkout.types';
import { type Database } from '~/features/supabase/types/Database.types';

/**
 * Order status type
 */
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

/**
 * Payment status type
 */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * Order item interface
 */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  options?: { name: string; value: string }[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Order status history entry
 */
export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

/**
 * Complete order interface
 */
export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  email: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  paymentMethodId?: string;
  paymentProvider?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingMethod?: string;
  shippingCost: number;
  taxAmount: number;
  subtotalAmount: number;
  totalAmount: number;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  notes?: string;
  metadata?: Record<string, unknown>;
  checkoutSessionId?: string;
  cartId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Order creation input
 */
export interface OrderCreateInput {
  userId?: string;
  email: string;
  cartId?: string;
  items: CartItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingMethod?: string;
  shippingCost: number;
  taxAmount: number;
  subtotalAmount: number;
  totalAmount: number;
  paymentIntentId?: string;
  paymentMethodId?: string;
  paymentProvider?: string;
  metadata?: Record<string, unknown>;
  checkoutSessionId?: string;
}

/**
 * Order update input
 */
export interface OrderUpdateInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentIntentId?: string;
  paymentMethodId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Order filter options
 */
export interface OrderFilterOptions {
  userId?: string;
  email?: string;
  status?: OrderStatus | OrderStatus[];
  paymentStatus?: PaymentStatus | PaymentStatus[];
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string; // For searching by order number or customer info
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'totalAmount' | 'orderNumber';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Order pagination result
 */
export interface OrderListResult {
  orders: Order[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Database order type - represents order in the database
 */
export type DbOrder = Database['public']['Tables']['orders']['Row'];

/**
 * Database order item type - represents order item in the database
 */
export type DbOrderItem = Database['public']['Tables']['order_items']['Row'];

/**
 * Database order status history type - represents status history entry in the database
 */
export type DbOrderStatusHistory = Database['public']['Tables']['order_status_history']['Row'];
