// Order item option type
export interface OrderItemOption {
  name: string;
  value: string;
}

// Address type
export interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// Tracking information type
export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  // Additional properties for compatibility
  url?: string;
  number?: string;
  shippingOption?: string | Record<string, unknown>; // For ShippingOption compatibility
  success?: boolean;
  status?: string;
  paymentId?: string;
}

// Order metadata type
export interface OrderMetadata {
  [key: string]: TrackingInfo | string | number | boolean | null | undefined;
  tracking?: TrackingInfo;
  notes?: string;
}

// Order status types
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

// Payment status types
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'paid';

// Order item type
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  unitPrice?: number;
  totalPrice?: number;
  options?: OrderItemOption[] | string[];
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Order status history type
export interface OrderStatusHistory {
  id?: string;
  status: OrderStatus;
  date: string;
  note?: string;
  notes?: string; // For backward compatibility
  createdAt?: string;
  createdBy?: string;
}

// Order type
export interface Order {
  id: string;
  orderNumber: string;
  userId: string | undefined; // Allow undefined for guest checkouts
  email: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingCost: number;
  taxAmount: number;
  subtotalAmount: number;
  totalAmount: number;
  items: OrderItem[];
  metadata?: OrderMetadata;
  createdAt: string;
  updatedAt: string;

  // Additional properties needed by components
  shippingAddress?: Address;
  billingAddress?: Address;
  paymentIntentId?: string;
  paymentMethodId?: string;
  paymentProvider?: string;
  shippingMethod?: string;
  notes?: string;
  statusHistory?: OrderStatusHistory[];

  // For compatibility
  checkoutSessionId?: string;
  cartId?: string;
}

// Order create input
export interface OrderCreateInput {
  userId: string | undefined; // Allow undefined for compatibility
  email: string;
  items: OrderItemInput[];
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingCost?: number;
  taxAmount?: number;
  metadata?: OrderMetadata;
  notes?: string;
  // Additional properties for compatibility
  paymentIntentId?: string;
  paymentMethodId?: string;
  paymentProvider?: string;
  shippingMethod?: string;
  subtotalAmount?: number;
  totalAmount?: number;
  checkoutSessionId?: string;
  cartId?: string;
}

// Order item input
export interface OrderItemInput {
  productId: string;
  product_id?: string; // For backward compatibility
  variantId?: string | null; // Allow null for compatibility
  variant_id?: string | null; // For backward compatibility
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  options?: string[];
  product?: Record<string, unknown>; // For backward compatibility
  sku?: string;
}

// Order update input
export interface OrderUpdateInput {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  items?: OrderItemInput[];
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingCost?: number;
  taxAmount?: number;
  metadata?: OrderMetadata;
  notes?: string;
  // Additional properties
  paymentIntentId?: string;
  paymentMethodId?: string;
}

// Order filter options
export interface OrderFilterOptions {
  searchQuery?: string;
  status?: OrderStatus | OrderStatus[];
  dateFrom?: string;
  dateTo?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'orderNumber' | 'totalAmount';
  sortDirection?: 'asc' | 'desc';

  // Additional filter properties
  userId?: string;
  email?: string;
  paymentStatus?: PaymentStatus | PaymentStatus[];
  minAmount?: number;
  maxAmount?: number;
  shippingCountries?: string[];
}

// Order list result
export interface OrderListResult {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  limit?: number;
  offset?: number;
}

// Database model interfaces
export interface DbOrder {
  id: string;
  order_number: string;
  user_id: string;
  email: string;
  guest_email?: string;
  status: string;
  payment_status: string;
  shipping_cost: number;
  tax_amount: number;
  subtotal_amount: number;
  total_amount: number;
  tax?: number;
  subtotal?: number;
  total?: number;
  created_at: string;
  updated_at: string;
  metadata?: string; // JSON stringified
  shipping_address?: string; // JSON stringified
  billing_address?: string; // JSON stringified
  payment_intent_id?: string;
  payment_method_id?: string;
  payment_provider?: string;
  shipping_method?: string;
  notes?: string;
  checkout_session_id?: string;
  cart_id?: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  price: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  image_url?: string;
  options?: string; // JSON stringified array
  sku?: string;
  unit_price?: number;
  total_price?: number;
  metadata?: string;
}

export interface DbOrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  date: string;
  note?: string;
  notes?: string;
  created_at?: string;
  created_by?: string;
}

// Legacy type for compatibility
export type OrderListResponse = OrderListResult;
