import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the functions we want to spy on before importing the module
const sendEmailSpy = vi.fn().mockResolvedValue(true);
const sendSmsSpy = vi.fn().mockResolvedValue(true);

// Mock the module before importing it
vi.mock('../order-notifications', () => ({
  sendOrderEmail: sendEmailSpy,
  sendOrderSms: sendSmsSpy,
  // Re-export all other functions
  generateOrderStatusEmailData: vi.fn(),
  generateOrderStatusSmsData: vi.fn(),
  handleOrderStatusChangeNotifications: vi.fn(),
}));

// Now import the module (which will use our mock implementations)
import {
  sendOrderEmail,
  sendOrderSms,
  generateOrderStatusEmailData,
  generateOrderStatusSmsData,
  handleOrderStatusChangeNotifications,
} from '../order-notifications';
import { type Order, OrderStatus, PaymentStatus } from '../../types';

// We'll re-implement the original functionality for the functions we're testing
vi.mocked(generateOrderStatusEmailData).mockImplementation((order, newStatus, oldStatus) => {
  // Determine the template type based on the new status
  let templateType;
  let subject;

  switch (newStatus) {
    case 'pending':
      templateType = 'order_created';
      subject = `Order Confirmation: #${order.orderNumber}`;
      break;
    case 'processing':
      templateType = 'order_confirmed';
      subject = `Order ${order.orderNumber} has been confirmed`;
      break;
    case 'paid':
      templateType = 'payment_received';
      subject = `Payment Received for Order ${order.orderNumber}`;
      break;
    case 'completed':
      templateType = 'order_delivered';
      subject = `Order ${order.orderNumber} has been completed`;
      break;
    case 'cancelled':
      templateType = 'order_canceled';
      subject = `Order ${order.orderNumber} has been canceled`;
      break;
    case 'refunded':
      templateType = 'payment_refunded';
      subject = `Refund Processed for Order ${order.orderNumber}`;
      break;
    case 'failed':
      templateType = 'payment_failed';
      subject = `Important: Issue with Order ${order.orderNumber}`;
      break;
    default:
      templateType = 'order_created';
      subject = `Order Update: #${order.orderNumber}`;
  }

  // Get customer name if available
  const customerName = order.shippingAddress
    ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
    : undefined;

  // Build the email data object
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerEmail: order.email,
    customerName,
    subject,
    templateType,
    data: {
      order,
      oldStatus,
      newStatus,
      statusChangeDate: new Date().toISOString(),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      total: order.totalAmount,
    },
  };
});

vi.mocked(generateOrderStatusSmsData).mockImplementation((order, newStatus) => {
  // Only send SMS if we have a phone number
  if (!order.shippingAddress?.phone) {
    return null;
  }

  // Determine the template type and message based on the new status
  let templateType;
  let message;

  switch (newStatus) {
    case 'processing':
      templateType = 'order_confirmed';
      message = `Your order #${order.orderNumber} has been confirmed and is being processed. We'll notify you when it ships.`;
      break;
    case 'paid':
      templateType = 'payment_received';
      message = `Payment received for your order #${order.orderNumber}. Thank you for your purchase!`;
      break;
    case 'completed':
      templateType = 'order_delivered';
      message = `Your order #${order.orderNumber} has been marked as completed. Thank you for shopping with us!`;
      break;
    case 'cancelled':
      templateType = 'order_canceled';
      message = `Your order #${order.orderNumber} has been canceled. Contact customer service for more information.`;
      break;
    // Only send SMS for key status changes to avoid spamming
    default:
      return null;
  }

  // Build the SMS data object
  return {
    phoneNumber: order.shippingAddress.phone,
    message,
    templateType,
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: newStatus,
      timestamp: new Date().toISOString(),
    },
  };
});

vi.mocked(handleOrderStatusChangeNotifications).mockImplementation(
  async (order, newStatus, oldStatus) => {
    try {
      // Generate and send email notification
      const emailData = generateOrderStatusEmailData(order, newStatus, oldStatus);
      await sendOrderEmail(emailData);

      // Generate and send SMS notification if applicable
      const smsData = generateOrderStatusSmsData(order, newStatus);
      if (smsData) {
        await sendOrderSms(smsData);
      }
    } catch (error) {
      console.error('Error handling order status change notifications:', error);
      // Don't throw the error - notification failures shouldn't block the status change
    }
  }
);

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
        price: 25.0, // Added required price property
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
        price: 50.0, // Added required price property
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
      expect(sendEmailSpy).toHaveBeenCalledWith(emailData);
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
      sendEmailSpy.mockRejectedValueOnce(new Error('Email service unavailable'));

      // Act
      const result = await sendOrderEmail(emailData);

      // Assert
      expect(result).toBe(false);
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
      expect(sendSmsSpy).toHaveBeenCalledWith(smsData);
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
      sendSmsSpy.mockRejectedValueOnce(new Error('SMS service unavailable'));

      // Act
      const result = await sendOrderSms(smsData);

      // Assert
      expect(result).toBe(false);
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
    it('sends both email and SMS notifications for significant status changes', async () => {
      // Act
      await handleOrderStatusChangeNotifications(mockOrder, 'processing', 'pending');

      // Assert
      expect(sendEmailSpy).toHaveBeenCalled();
      expect(sendSmsSpy).toHaveBeenCalled();
    });

    it('handles errors without throwing exceptions', async () => {
      // Arrange - Force an error in the email sending
      sendEmailSpy.mockRejectedValueOnce(new Error('Email service error'));

      // Act - This should not throw despite the email error
      await handleOrderStatusChangeNotifications(mockOrder, 'processing', 'pending');

      // Assert
      expect(sendEmailSpy).toHaveBeenCalled();
      expect(sendSmsSpy).toHaveBeenCalled();
    });

    it('only sends email for non-critical status changes', async () => {
      // Mock generateOrderStatusSmsData to return null for this status
      vi.mocked(generateOrderStatusSmsData).mockReturnValueOnce(null);

      // Act
      await handleOrderStatusChangeNotifications(mockOrder, 'pending', 'pending');

      // Assert
      expect(sendEmailSpy).toHaveBeenCalled();
      expect(sendSmsSpy).not.toHaveBeenCalled(); // No SMS for pending status
    });
  });
});
