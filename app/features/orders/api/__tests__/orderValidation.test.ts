import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OrderService } from '../orderService';
import { mockDeep } from 'vitest-mock-extended';
import { SupabaseClient } from '@supabase/supabase-js';
import { type OrderCreateInput, type OrderUpdateInput } from '../../types';

// Mock Supabase client
const mockSupabaseClient = mockDeep<SupabaseClient>();

describe('Order Data Validation', () => {
  let orderService: OrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    orderService = new OrderService(mockSupabaseClient);

    // Reset the mock implementation
    mockSupabaseClient.from.mockClear();

    // Setup successful mock responses
    mockSupabaseClient.from.mockImplementation(table => {
      if (table === 'orders') {
        return {
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        } as any;
      } else if (table === 'order_items') {
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      } else if (table === 'carts') {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      }
      return mockSupabaseClient;
    });
  });

  describe('createOrder validation', () => {
    it('rejects order creation with missing required fields', async () => {
      // Arrange
      const incompleteInput = {
        // Missing email
        items: [
          {
            product_id: 'product-1',
            quantity: 2,
            price: 50,
          },
        ],
        shippingCost: 10,
        taxAmount: 5,
        subtotalAmount: 100,
        totalAmount: 115,
      } as unknown as OrderCreateInput;

      // Act & Assert
      await expect(orderService.createOrder(incompleteInput)).rejects.toThrow(
        'Email is required for order creation'
      );
    });

    it('validates required numeric values', async () => {
      // Arrange
      const invalidInput = {
        email: 'test@example.com',
        items: [
          {
            product_id: 'product-1',
            quantity: 2,
            price: 50,
          },
        ],
        shippingCost: -10, // Negative value
        taxAmount: 5,
        subtotalAmount: 100,
        totalAmount: 115,
      } as OrderCreateInput;

      // Act & Assert
      await expect(orderService.createOrder(invalidInput)).rejects.toThrow(
        'Shipping cost cannot be negative'
      );
    });

    it('validates the items array is not empty', async () => {
      // Arrange
      const emptyItemsInput = {
        email: 'test@example.com',
        items: [], // Empty items array
        shippingCost: 10,
        taxAmount: 5,
        subtotalAmount: 0,
        totalAmount: 15,
      } as OrderCreateInput;

      // Act & Assert
      await expect(orderService.createOrder(emptyItemsInput)).rejects.toThrow(
        'Cannot create order with no items'
      );
    });

    it('validates the total amount calculation', async () => {
      // Arrange
      const incorrectTotalInput = {
        email: 'test@example.com',
        items: [
          {
            product_id: 'product-1',
            quantity: 2,
            price: 50,
          },
        ],
        shippingCost: 10,
        taxAmount: 5,
        subtotalAmount: 100,
        totalAmount: 200, // Incorrect total (should be 115)
      } as OrderCreateInput;

      // Act & Assert
      await expect(orderService.createOrder(incorrectTotalInput)).rejects.toThrow(
        'Total amount does not match the sum of subtotal, shipping, and tax'
      );
    });

    it('accepts valid order input', async () => {
      // Arrange
      const validInput = {
        email: 'test@example.com',
        items: [
          {
            product_id: 'product-1',
            quantity: 2,
            price: 50,
            product: {
              name: 'Test Product',
              sku: 'TP1',
            },
          },
        ],
        shippingCost: 10,
        taxAmount: 5,
        subtotalAmount: 100,
        totalAmount: 115,
      } as OrderCreateInput;

      // Mock successful order creation
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'order-123',
                order_number: 'NO-123',
                email: 'test@example.com',
                status: 'pending',
                payment_status: 'pending',
                shipping_cost: 10,
                tax_amount: 5,
                subtotal_amount: 100,
                total_amount: 115,
                created_at: '2025-03-15T12:00:00Z',
                updated_at: '2025-03-15T12:00:00Z',
              },
              error: null,
            }),
          } as any;
        } else if (table === 'order_items') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'item-1',
                  order_id: 'order-123',
                  product_id: 'product-1',
                  name: 'Test Product',
                  sku: 'TP1',
                  quantity: 2,
                  unit_price: 50,
                  total_price: 100,
                  created_at: '2025-03-15T12:00:00Z',
                  updated_at: '2025-03-15T12:00:00Z',
                },
              ],
              error: null,
            }),
          } as any;
        } else if (table === 'order_status_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Act
      const result = await orderService.createOrder(validInput);

      // Assert
      expect(result).toBeDefined();
      expect(result.orderNumber).toBe('NO-123');
      expect(result.email).toBe('test@example.com');
      expect(result.totalAmount).toBe(115);
    });
  });

  describe('updateOrder validation', () => {
    it('rejects invalid order status values', async () => {
      // Arrange
      const invalidUpdate = {
        status: 'invalid_status' as any,
      };

      // Act & Assert
      await expect(orderService.updateOrder('order-123', invalidUpdate)).rejects.toThrow(
        'Invalid order status: invalid_status'
      );
    });

    it('rejects invalid payment status values', async () => {
      // Arrange
      const invalidUpdate = {
        paymentStatus: 'invalid_payment_status' as any,
      };

      // Act & Assert
      await expect(orderService.updateOrder('order-123', invalidUpdate)).rejects.toThrow(
        'Invalid payment status: invalid_payment_status'
      );
    });

    it('accepts valid status update', async () => {
      // Arrange
      const validUpdate: OrderUpdateInput = {
        status: 'processing',
        notes: 'Order is being processed',
      };

      // Mock successful order update
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'order-123',
                order_number: 'NO-123',
                status: 'processing',
                notes: 'Order is being processed',
                updated_at: '2025-03-15T12:00:00Z',
              },
              error: null,
            }),
          } as any;
        } else if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          } as any;
        } else if (table === 'order_status_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Act
      const result = await orderService.updateOrder('order-123', validUpdate);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('processing');
      expect(result.notes).toBe('Order is being processed');
    });

    it('rejects update with both status and payment status for separate workflows', async () => {
      // Arrange
      const combinedUpdate = {
        status: 'completed',
        paymentStatus: 'paid',
      };

      // Act & Assert
      await expect(orderService.updateOrder('order-123', combinedUpdate)).rejects.toThrow(
        'Cannot update both order status and payment status in one operation'
      );
    });

    it('validates metadata is a valid object', async () => {
      // Arrange
      const invalidUpdate = {
        metadata: 'not-an-object' as any,
      };

      // Act & Assert
      await expect(orderService.updateOrder('order-123', invalidUpdate)).rejects.toThrow(
        'Metadata must be an object'
      );
    });
  });

  describe('order state transitions', () => {
    it('validates allowed status transitions', async () => {
      // Arrange - Mock the order with current status
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'order-123',
                status: 'completed', // Already completed
                created_at: '2025-03-15T12:00:00Z',
                updated_at: '2025-03-15T12:00:00Z',
              },
              error: null,
            }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Setup update attempt
      const invalidTransition = {
        status: 'processing', // Can't go back to processing after completed
      };

      // Act & Assert
      await expect(orderService.updateOrder('order-123', invalidTransition)).rejects.toThrow(
        'Invalid status transition: Cannot change from completed to processing'
      );
    });

    it('validates allowed payment status transitions', async () => {
      // Arrange - Mock the order with current payment status
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'order-123',
                payment_status: 'paid', // Already paid
                created_at: '2025-03-15T12:00:00Z',
                updated_at: '2025-03-15T12:00:00Z',
              },
              error: null,
            }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Setup update attempt
      const invalidTransition = {
        paymentStatus: 'pending', // Can't go back to pending after paid
      };

      // Act & Assert
      await expect(orderService.updateOrder('order-123', invalidTransition)).rejects.toThrow(
        'Invalid payment status transition: Cannot change from paid to pending'
      );
    });

    it('allows valid status transitions', async () => {
      // Arrange - Mock the order with current status
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          const getOrderSpy = vi
            .fn()
            .mockResolvedValueOnce({
              data: {
                id: 'order-123',
                status: 'pending', // Current status
                created_at: '2025-03-15T12:00:00Z',
                updated_at: '2025-03-15T12:00:00Z',
              },
              error: null,
            })
            .mockResolvedValueOnce({
              data: {
                id: 'order-123',
                status: 'processing', // Updated status
                created_at: '2025-03-15T12:00:00Z',
                updated_at: '2025-03-15T12:30:00Z',
              },
              error: null,
            });

          return {
            select: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: getOrderSpy,
          } as any;
        } else if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          } as any;
        } else if (table === 'order_status_history') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          } as any;
        }
        return mockSupabaseClient;
      });

      // Setup valid transition
      const validTransition = {
        status: 'processing', // Valid: pending -> processing
      };

      // Act
      const result = await orderService.updateOrder('order-123', validTransition);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('processing');
    });
  });
});
