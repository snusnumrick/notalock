import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  getOrderById,
  getOrderByOrderNumber,
  getUserOrders,
  getOrdersByEmail,
  getOrders,
  getOrderByPaymentIntentId,
} from '../queries.server';
import { OrderStatus, PaymentStatus, type Order, type OrderListResult } from '../../types';

// Mock the orderService module
vi.mock('../orderService', () => ({
  getOrderService: vi.fn().mockResolvedValue({
    getOrderById: vi.fn(),
    getOrderByOrderNumber: vi.fn(),
    getOrderByPaymentIntentId: vi.fn(),
    getUserOrders: vi.fn(),
    getOrdersByEmail: vi.fn(),
    getOrders: vi.fn(),
  }),
}));

// Import the mocked function
import { getOrderService } from '../orderService';

describe('Order API - Queries', () => {
  const mockOrderService = {
    getOrderById: vi.fn(),
    getOrderByOrderNumber: vi.fn(),
    getOrderByPaymentIntentId: vi.fn(),
    getUserOrders: vi.fn(),
    getOrdersByEmail: vi.fn(),
    getOrders: vi.fn(),
  };

  const mockOrder: Order = {
    id: 'order-123',
    orderNumber: 'NO-20250315-ABCD',
    email: 'test@example.com',
    status: 'pending' as OrderStatus,
    paymentStatus: 'pending' as PaymentStatus,
    shippingCost: 10,
    taxAmount: 5,
    subtotalAmount: 100,
    totalAmount: 115,
    items: [
      {
        id: 'item-1',
        orderId: 'order-123',
        productId: 'product-1',
        name: 'Product 1',
        sku: 'SKU1',
        quantity: 2,
        unitPrice: 25,
        totalPrice: 50,
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
    ],
    createdAt: '2025-03-15T12:00:00Z',
    updatedAt: '2025-03-15T12:00:00Z',
  };

  const mockOrdersResult: OrderListResult = {
    orders: [mockOrder],
    total: 1,
    limit: 10,
    offset: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getOrderService to return our mock service
    (getOrderService as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrderService);

    // Reset mock service function implementations
    mockOrderService.getOrderById.mockReset().mockResolvedValue(mockOrder);
    mockOrderService.getOrderByOrderNumber.mockReset().mockResolvedValue(mockOrder);
    mockOrderService.getOrderByPaymentIntentId.mockReset().mockResolvedValue(mockOrder);
    mockOrderService.getUserOrders.mockReset().mockResolvedValue([mockOrder]);
    mockOrderService.getOrdersByEmail.mockReset().mockResolvedValue([mockOrder]);
    mockOrderService.getOrders.mockReset().mockResolvedValue(mockOrdersResult);
  });

  describe('getOrderById', () => {
    it('should return order when found', async () => {
      // Act
      const result = await getOrderById('order-123');

      // Assert
      expect(mockOrderService.getOrderById).toHaveBeenCalledWith('order-123');
      expect(result).toEqual(mockOrder);
    });

    it('should return null when error occurs', async () => {
      // Arrange
      mockOrderService.getOrderById.mockRejectedValue(new Error('Not found'));

      // Act
      const result = await getOrderById('invalid-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getOrderByOrderNumber', () => {
    it('should return order when found', async () => {
      // Act
      const result = await getOrderByOrderNumber('NO-20250315-ABCD');

      // Assert
      expect(mockOrderService.getOrderByOrderNumber).toHaveBeenCalledWith('NO-20250315-ABCD');
      expect(result).toEqual(mockOrder);
    });

    it('should return null when error occurs', async () => {
      // Arrange
      mockOrderService.getOrderByOrderNumber.mockRejectedValue(new Error('Not found'));

      // Act
      const result = await getOrderByOrderNumber('invalid-number');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getUserOrders', () => {
    it('should return orders for the user', async () => {
      // Act
      const result = await getUserOrders('user-123');

      // Assert
      expect(mockOrderService.getUserOrders).toHaveBeenCalledWith('user-123');
      expect(result).toEqual([mockOrder]);
    });

    it('should return empty array when error occurs', async () => {
      // Arrange
      mockOrderService.getUserOrders.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await getUserOrders('user-123');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getOrdersByEmail', () => {
    it('should return orders for the email', async () => {
      // Act
      const result = await getOrdersByEmail('test@example.com');

      // Assert
      expect(mockOrderService.getOrdersByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual([mockOrder]);
    });

    it('should return empty array when error occurs', async () => {
      // Arrange
      mockOrderService.getOrdersByEmail.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await getOrdersByEmail('test@example.com');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getOrders', () => {
    it('should return filtered orders with pagination', async () => {
      // Arrange
      const filterOptions = {
        status: 'pending' as OrderStatus,
        limit: 10,
        offset: 0,
      };

      // Act
      const result = await getOrders(filterOptions);

      // Assert
      expect(mockOrderService.getOrders).toHaveBeenCalledWith(filterOptions);
      expect(result).toEqual(mockOrdersResult);
    });

    it('should return empty result when error occurs', async () => {
      // Arrange
      const filterOptions = {
        status: 'pending' as OrderStatus,
        limit: 10,
        offset: 0,
      };
      mockOrderService.getOrders.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await getOrders(filterOptions);

      // Assert
      expect(result).toEqual({
        orders: [],
        total: 0,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('getOrderByPaymentIntentId', () => {
    it('should return order when found by payment intent ID', async () => {
      // Act
      const result = await getOrderByPaymentIntentId('pi-123');

      // Assert
      expect(mockOrderService.getOrderByPaymentIntentId).toHaveBeenCalledWith('pi-123');
      expect(result).toEqual(mockOrder);
    });

    it('should return null when error occurs', async () => {
      // Arrange
      mockOrderService.getOrderByPaymentIntentId.mockRejectedValue(new Error('Not found'));

      // Act
      const result = await getOrderByPaymentIntentId('invalid-pi');

      // Assert
      expect(result).toBeNull();
    });
  });
});
