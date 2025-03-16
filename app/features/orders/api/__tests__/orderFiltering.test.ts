import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OrderService } from '../orderService';
import { type OrderFilterOptions } from '../../types';
import { mockDeep } from 'vitest-mock-extended';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabaseClient = mockDeep<SupabaseClient>();

describe('Order Filtering and Search', () => {
  let orderService: OrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    orderService = new OrderService(mockSupabaseClient);

    // Reset the mock implementation
    mockSupabaseClient.from.mockClear();
  });

  describe('getOrders with filtering', () => {
    it('applies status filter correctly', async () => {
      // Arrange
      const filterOptions: OrderFilterOptions = {
        status: 'processing',
        limit: 10,
        offset: 0,
      };

      setupMockResponse();

      // Act
      await orderService.getOrders(filterOptions);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(mockSupabaseFrom().eq).toHaveBeenCalledWith('status', 'processing');
    });

    it('handles array of statuses for filtering', async () => {
      // Arrange
      const filterOptions: OrderFilterOptions = {
        status: ['processing', 'paid'],
        limit: 10,
        offset: 0,
      };

      setupMockResponse();

      // Act
      await orderService.getOrders(filterOptions);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(mockSupabaseFrom().in).toHaveBeenCalledWith('status', ['processing', 'paid']);
    });

    it('applies payment status filter correctly', async () => {
      // Arrange
      const filterOptions: OrderFilterOptions = {
        paymentStatus: 'paid',
        limit: 10,
        offset: 0,
      };

      setupMockResponse();

      // Act
      await orderService.getOrders(filterOptions);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(mockSupabaseFrom().eq).toHaveBeenCalledWith('payment_status', 'paid');
    });

    it('applies date range filters correctly', async () => {
      // Arrange
      const filterOptions: OrderFilterOptions = {
        dateFrom: '2025-01-01T00:00:00Z',
        dateTo: '2025-03-31T23:59:59Z',
        limit: 10,
        offset: 0,
      };

      setupMockResponse();

      // Act
      await orderService.getOrders(filterOptions);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(mockSupabaseFrom().gte).toHaveBeenCalledWith('created_at', '2025-01-01T00:00:00Z');
      expect(mockSupabaseFrom().lte).toHaveBeenCalledWith('created_at', '2025-03-31T23:59:59Z');
    });

    it('applies price range filters correctly', async () => {
      // Arrange
      const filterOptions: OrderFilterOptions = {
        minAmount: 50,
        maxAmount: 200,
        limit: 10,
        offset: 0,
      };

      setupMockResponse();

      // Act
      await orderService.getOrders(filterOptions);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(mockSupabaseFrom().gte).toHaveBeenCalledWith('total_amount', 50);
      expect(mockSupabaseFrom().lte).toHaveBeenCalledWith('total_amount', 200);
    });

    it('processes search query correctly', async () => {
      // Arrange
      const filterOptions: OrderFilterOptions = {
        searchQuery: 'test@example.com',
        limit: 10,
        offset: 0,
      };

      setupMockResponse();

      // Act
      await orderService.getOrders(filterOptions);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(mockSupabaseFrom().or).toHaveBeenCalledWith(
        `order_number.ilike.%test@example.com%,email.ilike.%test@example.com%`
      );
    });

    it('applies sorting correctly', async () => {
      // Arrange
      const filterOptions: OrderFilterOptions = {
        sortBy: 'totalAmount',
        sortDirection: 'desc',
        limit: 10,
        offset: 0,
      };

      setupMockResponse();

      // Act
      await orderService.getOrders(filterOptions);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(mockSupabaseFrom().order).toHaveBeenCalledWith('total_amount', {
        ascending: false,
      });
    });

    it('applies pagination correctly', async () => {
      // Arrange
      const filterOptions: OrderFilterOptions = {
        limit: 20,
        offset: 40,
      };

      setupMockResponse();

      // Act
      await orderService.getOrders(filterOptions);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(mockSupabaseFrom().range).toHaveBeenCalledWith(40, 59); // offset to offset+limit-1
    });

    it('combines multiple filter criteria correctly', async () => {
      // Arrange
      const filterOptions: OrderFilterOptions = {
        status: 'processing',
        paymentStatus: 'pending',
        dateFrom: '2025-01-01T00:00:00Z',
        minAmount: 50,
        searchQuery: 'test',
        sortBy: 'createdAt',
        sortDirection: 'desc',
        limit: 10,
        offset: 0,
      };

      setupMockResponse();

      // Act
      await orderService.getOrders(filterOptions);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('orders');
      expect(mockSupabaseFrom().eq).toHaveBeenCalledWith('status', 'processing');
      expect(mockSupabaseFrom().eq).toHaveBeenCalledWith('payment_status', 'pending');
      expect(mockSupabaseFrom().gte).toHaveBeenCalledWith('created_at', '2025-01-01T00:00:00Z');
      expect(mockSupabaseFrom().gte).toHaveBeenCalledWith('total_amount', 50);
      expect(mockSupabaseFrom().or).toHaveBeenCalledWith(
        `order_number.ilike.%test%,email.ilike.%test%`
      );
      expect(mockSupabaseFrom().order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(mockSupabaseFrom().range).toHaveBeenCalledWith(0, 9);
    });

    it('returns formatted results with the correct structure', async () => {
      // Arrange
      const mockOrders = [
        {
          id: 'order-123',
          order_number: 'NO-123',
          status: 'processing',
          payment_status: 'pending',
          total_amount: 100,
          created_at: '2025-03-15T12:00:00Z',
          updated_at: '2025-03-15T12:00:00Z',
        },
      ];

      const mockOrderItems = [
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
      ];

      mockSupabaseClient.from.mockImplementation(table => {
        if (table === 'orders') {
          return {
            select: vi.fn().mockReturnThis(),
            count: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
              data: mockOrders,
              count: 1,
              error: null,
            }),
          } as any;
        } else if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockOrderItems,
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
      const result = await orderService.getOrders({ limit: 10, offset: 0 });

      // Assert
      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);

      // Verify the order is formatted correctly
      expect(result.orders[0].id).toBe('order-123');
      expect(result.orders[0].orderNumber).toBe('NO-123');
      expect(result.orders[0].status).toBe('processing');
      expect(result.orders[0].paymentStatus).toBe('pending');
      expect(result.orders[0].items).toHaveLength(1);
      expect(result.orders[0].items[0].productId).toBe('product-1');
    });
  });

  describe('error handling', () => {
    it('handles database errors when filtering orders', async () => {
      // Arrange
      mockSupabaseClient.from.mockImplementation(() => {
        return {
          select: vi.fn().mockReturnThis(),
          count: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error', code: 'PGRST116' },
          }),
        } as any;
      });

      // Act & Assert
      await expect(orderService.getOrders({ limit: 10, offset: 0 })).rejects.toThrow(
        'Failed to get orders: Database error'
      );
    });
  });

  // Helper function to set up a standard mock response
  function setupMockResponse() {
    mockSupabaseClient.from.mockImplementation(() => {
      return {
        select: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      } as any;
    });
  }

  // Helper function to get the mock Supabase "from" chain
  function mockSupabaseFrom() {
    return mockSupabaseClient.from('orders') as any;
  }
});
