import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OrderService } from '../orderService';
import { OrderStatus, PaymentStatus } from '../../types';
import { mockDeep } from 'vitest-mock-extended';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabaseClient = mockDeep<SupabaseClient>();

// Mock order data
const mockOrder = {
  id: 'order-123',
  order_number: 'NO-20250315-ABCD',
  user_id: 'user-123',
  email: 'test@example.com',
  status: 'pending' as OrderStatus,
  payment_status: 'pending' as PaymentStatus,
  payment_intent_id: null,
  payment_method_id: null,
  payment_provider: null,
  shipping_address: {
    name: 'Test User',
    line1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    postal_code: '12345',
    country: 'US',
  },
  billing_address: {
    name: 'Test User',
    line1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    postal_code: '12345',
    country: 'US',
  },
  shipping_method: 'standard',
  shipping_cost: 10,
  tax_amount: 5,
  subtotal_amount: 100,
  total_amount: 115,
  notes: null,
  metadata: null,
  checkout_session_id: null,
  cart_id: 'cart-123',
  created_at: '2025-03-15T12:00:00Z',
  updated_at: '2025-03-15T12:00:00Z',
};

// Mock order items
const mockOrderItems = [
  {
    id: 'item-1',
    order_id: 'order-123',
    product_id: 'product-1',
    variant_id: null,
    name: 'Product 1',
    sku: 'SKU1',
    quantity: 2,
    unit_price: 25,
    total_price: 50,
    image_url: 'image1.jpg',
    options: null,
    metadata: null,
    created_at: '2025-03-15T12:00:00Z',
    updated_at: '2025-03-15T12:00:00Z',
  },
  {
    id: 'item-2',
    order_id: 'order-123',
    product_id: 'product-2',
    variant_id: null,
    name: 'Product 2',
    sku: 'SKU2',
    quantity: 1,
    unit_price: 50,
    total_price: 50,
    image_url: 'image2.jpg',
    options: null,
    metadata: null,
    created_at: '2025-03-15T12:00:00Z',
    updated_at: '2025-03-15T12:00:00Z',
  },
];

// Mock status history
const mockStatusHistory = [
  {
    id: 'history-1',
    order_id: 'order-123',
    status: 'pending' as OrderStatus,
    notes: 'Order created',
    created_at: '2025-03-15T12:00:00Z',
    created_by: null,
  },
];

// Mock cart items
const mockCartItems = [
  {
    id: 'cart-item-1',
    cart_id: 'cart-123',
    product_id: 'product-1',
    variant_id: null,
    quantity: 2,
    price: 25,
    created_at: '2025-03-15T11:00:00Z',
    updated_at: '2025-03-15T11:00:00Z',
    product: {
      name: 'Product 1',
      sku: 'SKU1',
      image_url: 'image1.jpg',
    },
  },
  {
    id: 'cart-item-2',
    cart_id: 'cart-123',
    product_id: 'product-2',
    variant_id: null,
    quantity: 1,
    price: 50,
    created_at: '2025-03-15T11:00:00Z',
    updated_at: '2025-03-15T11:00:00Z',
    product: {
      name: 'Product 2',
      sku: 'SKU2',
      image_url: 'image2.jpg',
    },
  },
];

describe('OrderService', () => {
  let orderService: OrderService;

  // Create UUID mock to return predictable values
  vi.mock('uuid', () => ({
    v4: vi.fn().mockReturnValue('mocked-uuid'),
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    orderService = new OrderService(mockSupabaseClient);

    // Reset the chain mocks
    mockSupabaseClient.from.mockClear();

    // Setup UUID mock for predictable test results
    vi.spyOn(global.Math, 'random').mockReturnValue(0.5);

    // Mock Date.now for predictable timestamps
    const mockDate = new Date('2025-03-15T12:00:00Z');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);
  });

  describe('createOrder', () => {
    it('should create a new order from cart items', async () => {
      // Arrange
      const mockInput = {
        userId: 'user-123',
        email: 'test@example.com',
        cartId: 'cart-123',
        items: mockCartItems.map(item => ({
          productId: item.product_id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          address1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        billingAddress: {
          firstName: 'Test',
          lastName: 'User',
          address1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        shippingMethod: 'standard',
        shippingCost: 10,
        taxAmount: 5,
        subtotalAmount: 100,
        totalAmount: 115,
      };

      // Setup mock responses
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          } as any;
        } else if (table === 'order_items') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          } as any;
        } else if (table === 'carts') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        } else if (table === 'order_status_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockStatusHistory, error: null }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Act
      await orderService.createOrder(mockInput);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('order_items');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('carts');
    });

    it('should throw an error if order creation fails', async () => {
      // Arrange
      const mockInput = {
        userId: 'user-123',
        email: 'test@example.com',
        cartId: 'cart-123',
        items: mockCartItems.map(item => ({
          productId: item.product_id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          address1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        billingAddress: {
          firstName: 'Test',
          lastName: 'User',
          address1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        shippingMethod: 'standard',
        shippingCost: 10,
        taxAmount: 5,
        subtotalAmount: 100,
        totalAmount: 115,
      };

      // Setup mock error response
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Act & Assert
      await expect(orderService.createOrder(mockInput)).rejects.toThrow('Failed to create order');
    });
  });

  describe('getOrderById', () => {
    it('should retrieve an order by ID with items and status history', async () => {
      // Arrange
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
          } as any;
        } else if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockOrderItems, error: null }),
          } as any;
        } else if (table === 'order_status_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockStatusHistory, error: null }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Act
      const result = await orderService.getOrderById('order-123');

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('order_items');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('order_status_history');
      expect(result.id).toBe('order-123');
      expect(result.items).toHaveLength(2);
      expect(result.statusHistory).toHaveLength(1);
    });

    it('should throw an error if order retrieval fails', async () => {
      // Arrange
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi
              .fn()
              .mockResolvedValue({ data: null, error: { message: 'Order not found' } }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Act & Assert
      await expect(orderService.getOrderById('non-existent')).rejects.toThrow(
        'Failed to get order'
      );
    });
  });

  describe('getOrderByOrderNumber', () => {
    it('should retrieve an order by order number', async () => {
      // Arrange
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
          } as any;
        } else if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockOrderItems, error: null }),
          } as any;
        } else if (table === 'order_status_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockStatusHistory, error: null }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Act
      const result = await orderService.getOrderByOrderNumber('NO-20250315-ABCD');

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(result.id).toBe('order-123');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status and return the updated order', async () => {
      // Arrange
      const updatedOrder = {
        ...mockOrder,
        status: 'processing' as OrderStatus,
        updated_at: '2025-03-15T13:00:00Z',
      };

      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: updatedOrder, error: null }),
          } as any;
        } else if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockOrderItems, error: null }),
          } as any;
        } else if (table === 'order_status_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockStatusHistory, error: null }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Act
      const result = await orderService.updateOrderStatus(
        'order-123',
        'processing',
        'Status updated'
      );

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(result.status).toBe('processing');
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status and return the updated order', async () => {
      // Arrange
      const updatedOrder = {
        ...mockOrder,
        payment_status: 'paid' as PaymentStatus,
        payment_intent_id: 'pi_123456',
        updated_at: '2025-03-15T13:00:00Z',
      };

      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: updatedOrder, error: null }),
          } as any;
        } else if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockOrderItems, error: null }),
          } as any;
        } else if (table === 'order_status_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockStatusHistory, error: null }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Act
      const result = await orderService.updatePaymentStatus(
        'order-123',
        'paid',
        'pi_123456',
        'Payment completed'
      );

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(result.paymentStatus).toBe('paid');
      expect(result.paymentIntentId).toBe('pi_123456');
    });
  });

  describe('updateOrderFromPayment', () => {
    it('should update order based on successful payment result', async () => {
      // Arrange
      const updatedOrder = {
        ...mockOrder,
        status: 'paid' as OrderStatus,
        payment_status: 'paid' as PaymentStatus,
        payment_intent_id: 'pi_123456',
        updated_at: '2025-03-15T13:00:00Z',
      };

      const paymentResult = {
        success: true,
        paymentId: 'payment_123',
        paymentIntentId: 'pi_123456',
        status: 'completed',
        paymentMethodId: 'pm_123',
      };

      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: updatedOrder, error: null }),
          } as any;
        } else if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockOrderItems, error: null }),
          } as any;
        } else if (table === 'order_status_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockStatusHistory, error: null }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Act
      const result = await orderService.updateOrderFromPayment('order-123', paymentResult);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(result.status).toBe('paid');
      expect(result.paymentStatus).toBe('paid');
    });

    it('should update order based on failed payment result', async () => {
      // Arrange
      const updatedOrder = {
        ...mockOrder,
        status: 'failed' as OrderStatus,
        payment_status: 'failed' as PaymentStatus,
        updated_at: '2025-03-15T13:00:00Z',
      };

      const paymentResult = {
        success: false,
        status: 'failed',
        error: 'Payment declined',
      };

      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: updatedOrder, error: null }),
          } as any;
        } else if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockOrderItems, error: null }),
          } as any;
        } else if (table === 'order_status_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockStatusHistory, error: null }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Act
      const result = await orderService.updateOrderFromPayment('order-123', paymentResult);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(result.status).toBe('failed');
      expect(result.paymentStatus).toBe('failed');
    });
  });

  describe('getUserOrders', () => {
    it('should retrieve all orders for a user', async () => {
      // Arrange
      const ordersList = [
        mockOrder,
        { ...mockOrder, id: 'order-456', order_number: 'NO-20250315-EFGH' },
      ];

      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: ordersList, error: null }),
            single: vi.fn().mockImplementation(id => {
              return Promise.resolve({
                data: ordersList.find(o => o.id === id) || ordersList[0],
                error: null,
              });
            }),
          } as any;
        } else if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockOrderItems, error: null }),
          } as any;
        } else if (table === 'order_status_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockStatusHistory, error: null }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Act
      const result = await orderService.getUserOrders('user-123');

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(result).toHaveLength(2);
    });
  });

  describe('getOrders', () => {
    it('should retrieve orders with filtering and pagination', async () => {
      // Arrange
      const ordersList = [
        mockOrder,
        { ...mockOrder, id: 'order-456', order_number: 'NO-20250315-EFGH' },
      ];

      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: ordersList,
              error: null,
              count: 2,
            }),
            single: vi.fn().mockImplementation(id => {
              return Promise.resolve({
                data: ordersList.find(o => o.id === id) || ordersList[0],
                error: null,
              });
            }),
          } as any;
        } else if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: mockOrderItems, error: null }),
          } as any;
        } else if (table === 'order_status_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockStatusHistory, error: null }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Act
      const result = await orderService.getOrders({
        status: 'pending',
        limit: 10,
        offset: 0,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(result.orders).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });
  });
});
