// Tracking information type
export interface TrackingInfo {
  number: string;
  carrier: string;
  url: string;
}

// Order metadata type
export interface OrderMetadata {
  tracking?: TrackingInfo;
  notes?: string;
  [key: string]: TrackingInfo;
}

// Order status types
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

// Payment status types
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Order item type
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

// Order type
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
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
}

// Order filter options
export interface OrderFilterOptions {
  searchQuery?: string;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'orderNumber' | 'totalAmount';
  sortDirection?: 'asc' | 'desc';
}

// Order service response
export interface OrderListResponse {
  orders: Order[];
  total: number;
}
