import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  updateOrderStatusFromPayment,
  getOrderById,
  getOrderByOrderNumber,
  getUserOrders,
  getOrdersByEmail,
} from '../actions.server';
import { getOrderService } from '../orderService';
import { OrderStatus, PaymentStatus, type Order } from '../../types';

// Mock the orderService module
vi.mock('../orderService', () => ({
  getOrderService: vi.fn().mockResolvedValue({
    getOrderById: vi.fn(),
    getOrderByOrderNumber: vi.fn(),
    getOrderByPaymentIntentId: vi.fn(),
    getUserOrders: vi.fn(),
    getOrdersByEmail: vi.fn(),
    updateOrderFromPayment: vi.fn(),
  }),
}));

describe('Order API - Actions', () => {
  const mockOrderService = {
    getOrderById: vi.fn(),
    getOrderByOrderNumber: vi.fn(),
    getOrderByPaymentIntentId: vi.fn(),
    getUserOrders: vi.fn(),
    getOrdersByEmail: vi.fn(),
    updateOrderFromPayment: vi.fn(),
  };

  const mockOrder: Order = {
    id: 'order-123',
    orderNumber: 'NO-20250315-ABCD',
    userId: undefined, // Adding the missing required property
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
        price: 25,
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
    ],
    createdAt: '2025-03-15T12:00:00Z',
    updatedAt: '2025-03-15T12:00:00Z',
  };

  const mockPaymentResult = {
    success: true,
    paymentId: 'payment-123',
    paymentIntentId: 'pi-123',
    status: 'completed',
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
    mockOrderService.updateOrderFromPayment.mockReset().mockResolvedValue({
      ...mockOrder,
      status: 'paid',
      paymentStatus: 'paid',
    });
  });

  describe('updateOrderStatusFromPayment', () => {
    it('should update order status when found by order number', async () => {
      // Arrange
      const orderReference = 'NO-20250315-ABCD';

      // Act
      await updateOrderStatusFromPayment(orderReference, mockPaymentResult);

      // Assert
      expect(mockOrderService.getOrderByOrderNumber).toHaveBeenCalledWith(orderReference);
      expect(mockOrderService.updateOrderFromPayment).toHaveBeenCalledWith(
        mockOrder.id,
        mockPaymentResult
      );
    });

    it('should update order status when found by payment intent ID', async () => {
      // Arrange
      const orderReference = 'invalid-reference';
      mockOrderService.getOrderByOrderNumber.mockRejectedValue(new Error('Not found'));

      // Act
      await updateOrderStatusFromPayment(orderReference, mockPaymentResult);

      // Assert
      expect(mockOrderService.getOrderByOrderNumber).toHaveBeenCalledWith(orderReference);
      expect(mockOrderService.getOrderByPaymentIntentId).toHaveBeenCalledWith(
        mockPaymentResult.paymentIntentId
      );
      expect(mockOrderService.updateOrderFromPayment).toHaveBeenCalledWith(
        mockOrder.id,
        mockPaymentResult
      );
    });

    it('should update order status when found by UUID', async () => {
      // Arrange
      const orderReference = '123e4567-e89b-12d3-a456-426614174000';
      mockOrderService.getOrderByOrderNumber.mockRejectedValue(new Error('Not found'));
      mockOrderService.getOrderByPaymentIntentId.mockResolvedValue(null);

      // Act
      await updateOrderStatusFromPayment(orderReference, mockPaymentResult);

      // Assert
      expect(mockOrderService.getOrderByOrderNumber).toHaveBeenCalledWith(orderReference);
      expect(mockOrderService.getOrderById).toHaveBeenCalledWith(orderReference);
      expect(mockOrderService.updateOrderFromPayment).toHaveBeenCalledWith(
        mockOrder.id,
        mockPaymentResult
      );
    });

    it('should handle case when no order is found', async () => {
      // Arrange
      const orderReference = 'invalid-reference';
      mockOrderService.getOrderByOrderNumber.mockRejectedValue(new Error('Not found'));
      mockOrderService.getOrderByPaymentIntentId.mockResolvedValue(null);
      mockOrderService.getOrderById.mockRejectedValue(new Error('Not found'));

      // Act
      await updateOrderStatusFromPayment(orderReference, mockPaymentResult);

      // Assert
      expect(mockOrderService.updateOrderFromPayment).not.toHaveBeenCalled();
    });

    it('should handle invalid order reference', async () => {
      // Arrange & Act
      await updateOrderStatusFromPayment(null, mockPaymentResult);

      // Assert
      expect(mockOrderService.getOrderByOrderNumber).not.toHaveBeenCalled();
      expect(mockOrderService.updateOrderFromPayment).not.toHaveBeenCalled();
    });
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
});
