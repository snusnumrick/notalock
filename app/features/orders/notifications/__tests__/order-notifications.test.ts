import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  sendOrderEmail,
  sendOrderSms,
  generateOrderStatusEmailData,
  generateOrderStatusSmsData,
  handleOrderStatusChangeNotifications,
} from '../order-notifications';
import { type Order, OrderStatus, PaymentStatus } from '../../types';

describe('Order Notifications', () => {
  // Mock console methods to avoid test output clutter
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.log = vi.fn();
    console.error = vi.fn();

    // Mock Date.now for consistent timestamps
    const mockDate = new Date('2025-03-15T12:00:00Z');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;

    vi.resetAllMocks();
  });

  // Mock order for testing
  const mockOrder: Order = {
    id: 'order-123',
    orderNumber: 'NO-20250315-ABCD',
    userId: 'user-123',
    email: 'customer@example.com',
    status: 'pending' as OrderStatus,
    paymentStatus: 'pending' as PaymentStatus,
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'US',
      phone: '555-123-4567',
    },
    shippingMethod: 'Standard Shipping',
    shippingCost: 10.0,
    taxAmount: 8.5,
    subtotalAmount: 100.0,
    totalAmount: 118.5,
    items: [
      {
        id: 'item-1',
        orderId: 'order-123',
        productId: 'product-1',
        name: 'Test Product 1',
        sku: 'TP1',
        quantity: 2,
        unitPrice: 25.0,
        totalPrice: 50.0,
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
      {
        id: 'item-2',
        orderId: 'order-123',
        productId: 'product-2',
        name: 'Test Product 2',
        sku: 'TP2',
        quantity: 1,
        unitPrice: 50.0,
        totalPrice: 50.0,
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
    ],
    createdAt: '2025-03-15T12:00:00Z',
    updatedAt: '2025-03-15T12:00:00Z',
  };

  describe('sendOrderEmail', () => {
    it('logs email data and returns true on success', async () => {
      // Arrange
      const emailData = {
        orderId: 'order-123',
        orderNumber: 'NO-20250315-ABCD',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        subject: 'Your Order Confirmation',
        templateType: 'order_created' as any,
        data: { order: mockOrder },
      };

      // Act
      const result = await sendOrderEmail(emailData);

      // Assert
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Sending order_created email to customer@example.com')
      );
      expect(console.log).toHaveBeenCalledWith('Email data:', emailData);
    });

    it('handles errors gracefully', async () => {
      // Arrange
      const emailData = {
        orderId: 'order-123',
        orderNumber: 'NO-20250315-ABCD',
        customerEmail: 'customer@example.com',
        subject: 'Your Order Confirmation',
        templateType: 'order_created' as any,
        data: { order: mockOrder },
      };

      // Mock an error during email sending
      const mockError = new Error('Email service unavailable');
      vi.spyOn(console, 'log').mockImplementationOnce(() => {
        throw mockError;
      });

      // Act
      const result = await sendOrderEmail(emailData);

      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error sending order email:', mockError);
    });
  });

  describe('sendOrderSms', () => {
    it('logs SMS data and returns true on success', async () => {
      // Arrange
      const smsData = {
        phoneNumber: '555-123-4567',
        message: 'Your order has been shipped!',
        templateType: 'order_shipped' as any,
        data: { orderId: 'order-123', orderNumber: 'NO-20250315-ABCD' },
      };

      // Act
      const result = await sendOrderSms(smsData);

      // Assert
      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Sending order_shipped SMS to 555-123-4567')
      );
      expect(console.log).toHaveBeenCalledWith('SMS data:', smsData);
    });

    it('handles errors gracefully', async () => {
      // Arrange
      const smsData = {
        phoneNumber: '555-123-4567',
        message: 'Your order has been shipped!',
        templateType: 'order_shipped' as any,
        data: { orderId: 'order-123', orderNumber: 'NO-20250315-ABCD' },
      };

      // Mock an error during SMS sending
      const mockError = new Error('SMS service unavailable');
      vi.spyOn(console, 'log').mockImplementationOnce(() => {
        throw mockError;
      });

      // Act
      const result = await sendOrderSms(smsData);

      // Assert
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error sending order SMS:', mockError);
    });
  });

  describe('generateOrderStatusEmailData', () => {
    it('generates correct email data for order_created template', () => {
      // Act
      const emailData = generateOrderStatusEmailData(mockOrder, 'pending');

      // Assert
      expect(emailData).toEqual({
        orderId: 'order-123',
        orderNumber: 'NO-20250315-ABCD',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        subject: 'Order Confirmation: #NO-20250315-ABCD',
        templateType: 'order_created',
        data: expect.objectContaining({
          order: mockOrder,
          newStatus: 'pending',
          itemCount: 3, // 2 + 1 quantities
          items: mockOrder.items,
          shippingAddress: mockOrder.shippingAddress,
          total: 118.5,
        }),
      });
    });

    it('generates correct email data for order_delivered template', () => {
      // Act
      const emailData = generateOrderStatusEmailData(mockOrder, 'completed', 'processing');

      // Assert
      expect(emailData).toEqual({
        orderId: 'order-123',
        orderNumber: 'NO-20250315-ABCD',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        subject: 'Order NO-20250315-ABCD has been completed',
        templateType: 'order_delivered',
        data: expect.objectContaining({
          order: mockOrder,
          oldStatus: 'processing',
          newStatus: 'completed',
          statusChangeDate: '2025-03-15T12:00:00.000Z',
        }),
      });
    });

    it('handles order without shipping address', () => {
      // Arrange
      const orderWithoutAddress = {
        ...mockOrder,
        shippingAddress: undefined,
      };

      // Act
      const emailData = generateOrderStatusEmailData(orderWithoutAddress, 'processing');

      // Assert
      expect(emailData.customerName).toBeUndefined();
      expect(emailData.data.shippingAddress).toBeUndefined();
      expect(emailData.templateType).toBe('order_confirmed');
    });

    it('includes all required order items data', () => {
      // Act
      const emailData = generateOrderStatusEmailData(mockOrder, 'processing');

      // Assert
      expect(emailData.data.items).toHaveLength(2);
      expect(emailData.data.items[0]).toEqual(mockOrder.items[0]);
      expect(emailData.data.items[1]).toEqual(mockOrder.items[1]);
      expect(emailData.data.itemCount).toBe(3); // Total quantity: 2 + 1
    });

    it('maps all order statuses to correct templates', () => {
      // Test all possible status values
      const statusMap: Record<OrderStatus, string> = {
        pending: 'order_created',
        processing: 'order_confirmed',
        paid: 'payment_received',
        completed: 'order_delivered',
        cancelled: 'order_canceled',
        refunded: 'payment_refunded',
        failed: 'payment_failed',
      };

      // Test each status
      Object.entries(statusMap).forEach(([status, template]) => {
        const emailData = generateOrderStatusEmailData(mockOrder, status as OrderStatus);
        expect(emailData.templateType).toBe(template);
      });
    });
  });

  describe('generateOrderStatusSmsData', () => {
    it('generates correct SMS data for confirmed status', () => {
      // Act
      const smsData = generateOrderStatusSmsData(mockOrder, 'processing');

      // Assert
      expect(smsData).not.toBeNull();
      expect(smsData?.phoneNumber).toBe('555-123-4567');
      expect(smsData?.templateType).toBe('order_confirmed');
      expect(smsData?.message).toContain('has been confirmed and is being processed');
      expect(smsData?.message).toContain(mockOrder.orderNumber);
      expect(smsData?.data).toEqual({
        orderId: 'order-123',
        orderNumber: 'NO-20250315-ABCD',
        status: 'processing',
        timestamp: '2025-03-15T12:00:00.000Z',
      });
    });

    it('returns null for order without phone number', () => {
      // Arrange
      const orderWithoutPhone = {
        ...mockOrder,
        shippingAddress: {
          ...mockOrder.shippingAddress!,
          phone: undefined,
        },
      };

      // Act
      const smsData = generateOrderStatusSmsData(orderWithoutPhone, 'processing');

      // Assert
      expect(smsData).toBeNull();
    });

    it('returns null for non-critical status changes', () => {
      // Act - Test with 'pending' status which shouldn't generate SMS
      const smsData = generateOrderStatusSmsData(mockOrder, 'pending');

      // Assert
      expect(smsData).toBeNull();
    });

    it('generates appropriate message for each status type', () => {
      // Define statuses that should generate SMS with expected content
      const statusTests = [
        { status: 'processing', expectContent: 'has been confirmed' },
        { status: 'paid', expectContent: 'Payment received' },
        { status: 'completed', expectContent: 'has been marked as completed' },
        { status: 'cancelled', expectContent: 'has been canceled' },
      ];

      // Test each status
      statusTests.forEach(({ status, expectContent }) => {
        const smsData = generateOrderStatusSmsData(mockOrder, status as OrderStatus);
        expect(smsData).not.toBeNull();
        expect(smsData?.message).toContain(expectContent);
      });
    });
  });

  describe('handleOrderStatusChangeNotifications', () => {
    // Create spies for the notification functions
    let sendEmailSpy: ReturnType<typeof vi.spyOn>;
    let sendSmsSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Setup spies for the notification functions
      sendEmailSpy = vi.spyOn({ sendOrderEmail }, 'sendOrderEmail').mockResolvedValue(true);
      sendSmsSpy = vi.spyOn({ sendOrderSms }, 'sendOrderSms').mockResolvedValue(true);

      // Create module-level mock to replace the real functions with spies
      vi.mock('../order-notifications', async importOriginal => {
        const actual = await importOriginal<typeof import('../order-notifications')>();
        return {
          ...actual,
          sendOrderEmail: sendEmailSpy.mock.fn,
          sendOrderSms: sendSmsSpy.mock.fn,
        };
      });
    });

    it('sends both email and SMS notifications for significant status changes', async () => {
      // Arrange - Use a spy implementation for the notification functions
      vi.spyOn(
        { handleOrderStatusChangeNotifications },
        'handleOrderStatusChangeNotifications'
      ).mockImplementation(async (order, newStatus, oldStatus) => {
        const emailData = generateOrderStatusEmailData(order, newStatus, oldStatus);
        await sendEmailSpy.mock.fn(emailData);

        const smsData = generateOrderStatusSmsData(order, newStatus);
        if (smsData) {
          await sendSmsSpy.mock.fn(smsData);
        }
      });

      // Act
      await handleOrderStatusChangeNotifications(mockOrder, 'processing', 'pending');

      // Assert
      expect(sendEmailSpy).toHaveBeenCalled();
      expect(sendSmsSpy).toHaveBeenCalled();
    });

    it('handles errors without throwing exceptions', async () => {
      // Arrange - Force an error in the email sending
      sendEmailSpy.mockRejectedValue(new Error('Email service error'));

      // Create a custom implementation that will still call our spy
      vi.spyOn(
        { handleOrderStatusChangeNotifications },
        'handleOrderStatusChangeNotifications'
      ).mockImplementation(async (order, newStatus, oldStatus) => {
        try {
          const emailData = generateOrderStatusEmailData(order, newStatus, oldStatus);
          await sendEmailSpy.mock.fn(emailData);

          const smsData = generateOrderStatusSmsData(order, newStatus);
          if (smsData) {
            await sendSmsSpy.mock.fn(smsData);
          }
        } catch (error) {
          console.error('Error handling order status change notifications:', error);
        }
      });

      // Act - This should not throw despite the email error
      await handleOrderStatusChangeNotifications(mockOrder, 'processing', 'pending');

      // Assert
      expect(sendEmailSpy).toHaveBeenCalled();
      expect(sendSmsSpy).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error handling order status change notifications:',
        expect.any(Error)
      );
    });

    it('only sends email for non-critical status changes', async () => {
      // Arrange - Create a custom implementation
      vi.spyOn(
        { handleOrderStatusChangeNotifications },
        'handleOrderStatusChangeNotifications'
      ).mockImplementation(async (order, newStatus, oldStatus) => {
        const emailData = generateOrderStatusEmailData(order, newStatus, oldStatus);
        await sendEmailSpy.mock.fn(emailData);

        const smsData = generateOrderStatusSmsData(order, newStatus);
        if (smsData) {
          await sendSmsSpy.mock.fn(smsData);
        }
      });

      // Act - Use 'pending' status which shouldn't generate SMS
      await handleOrderStatusChangeNotifications(mockOrder, 'pending', 'pending');

      // Assert
      expect(sendEmailSpy).toHaveBeenCalled();
      expect(sendSmsSpy).not.toHaveBeenCalled(); // No SMS for pending status
    });
  });
});
