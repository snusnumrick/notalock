import { vi, describe, it, expect } from 'vitest';
import { exportOrder, exportOrders } from '../order-exporter';
import { type Order, OrderStatus, PaymentStatus } from '../../types';

// Mock formatDate and formatCurrency functions
vi.mock('~/lib/utils', () => ({
  formatDate: vi.fn().mockImplementation((_date, _format) => '2025-03-15 12:00:00'),
  formatCurrency: vi.fn().mockImplementation(amount => `$${amount.toFixed(2)}`),
}));

describe('Order Exporter', () => {
  // Mock order for testing
  const mockOrder: Order = {
    id: 'order-123',
    orderNumber: 'NO-20250315-ABCD',
    userId: 'user-123',
    email: 'customer@example.com',
    status: 'completed' as OrderStatus,
    paymentStatus: 'paid' as PaymentStatus,
    paymentIntentId: 'pi_123456',
    paymentMethodId: 'pm_123456',
    paymentProvider: 'stripe',
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      address2: 'Apt 4B',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'US',
      phone: '555-123-4567',
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      address2: 'Apt 4B',
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
    statusHistory: [
      {
        id: 'history-1',
        orderId: 'order-123',
        status: 'pending',
        notes: 'Order created',
        createdAt: '2025-03-15T11:00:00Z',
      },
      {
        id: 'history-2',
        orderId: 'order-123',
        status: 'processing',
        notes: 'Payment received',
        createdAt: '2025-03-15T11:30:00Z',
      },
      {
        id: 'history-3',
        orderId: 'order-123',
        status: 'completed',
        notes: 'Order shipped',
        createdAt: '2025-03-15T12:00:00Z',
      },
    ],
    notes: 'Customer requested gift wrapping',
    createdAt: '2025-03-15T11:00:00Z',
    updatedAt: '2025-03-15T12:00:00Z',
  };

  // Create a second order for multiple order tests
  const mockOrder2: Order = {
    ...mockOrder,
    id: 'order-456',
    orderNumber: 'NO-20250314-EFGH',
    status: 'processing' as OrderStatus,
    paymentStatus: 'pending' as PaymentStatus,
    paymentIntentId: 'pi_654321',
    items: [
      {
        id: 'item-3',
        orderId: 'order-456',
        productId: 'product-3',
        name: 'Test Product 3',
        sku: 'TP3',
        quantity: 3,
        unitPrice: 30.0,
        totalPrice: 90.0,
        createdAt: '2025-03-14T12:00:00Z',
        updatedAt: '2025-03-14T12:00:00Z',
      },
    ],
    createdAt: '2025-03-14T12:00:00Z',
    updatedAt: '2025-03-14T12:00:00Z',
  };

  describe('exportOrder - CSV format', () => {
    it('exports a single order to CSV with all sections by default', () => {
      // Act
      const csv = exportOrder(mockOrder, { format: 'csv' });

      // Assert
      expect(typeof csv).toBe('string');

      // Check for order headers
      expect(csv as string).toContain('Order ID,Order Number,Customer Email,Status,Payment Status');

      // Check for order data
      expect(csv as string).toContain(
        `${mockOrder.id},${mockOrder.orderNumber},${mockOrder.email}`
      );

      // Check for shipping address
      expect(csv as string).toContain('SHIPPING ADDRESS');
      expect(csv as string).toContain('John Doe');
      expect(csv as string).toContain('123 Main St');

      // Check for billing address
      expect(csv as string).toContain('BILLING ADDRESS');

      // Check for payment info
      expect(csv as string).toContain('PAYMENT INFORMATION');
      expect(csv as string).toContain(`Payment Intent ID,${mockOrder.paymentIntentId}`);

      // Check for order items
      expect(csv as string).toContain('ORDER ITEMS');
      expect(csv as string).toContain(
        'Item ID,Product ID,SKU,Name,Quantity,Unit Price,Total Price'
      );
      expect(csv as string).toContain('TP1,Test Product 1,2,25,50');
      expect(csv as string).toContain('TP2,Test Product 2,1,50,50');
    });

    it('excludes sections based on options', () => {
      // Act
      const csv = exportOrder(mockOrder, {
        format: 'csv',
        includeItems: false,
        includeAddresses: false,
        includePaymentInfo: false,
        includeStatusHistory: false,
      });

      // Assert
      expect(typeof csv).toBe('string');

      // Check for order headers (these should always be included)
      expect(csv as string).toContain('Order ID,Order Number,Customer Email');

      // Check that excluded sections are not present
      expect(csv as string).not.toContain('SHIPPING ADDRESS');
      expect(csv as string).not.toContain('BILLING ADDRESS');
      expect(csv as string).not.toContain('PAYMENT INFORMATION');
      expect(csv as string).not.toContain('ORDER ITEMS');
      expect(csv as string).not.toContain('STATUS HISTORY');
    });

    it('includes status history when requested', () => {
      // Act
      const csv = exportOrder(mockOrder, {
        format: 'csv',
        includeStatusHistory: true,
      });

      // Assert
      expect(csv as string).toContain('STATUS HISTORY');
      expect(csv as string).toContain('Date,Status,Notes');
      expect(csv as string).toContain('Order created');
      expect(csv as string).toContain('Payment received');
      expect(csv as string).toContain('Order shipped');
    });

    it('handles orders without optional attributes', () => {
      // Arrange - Create an order missing some attributes
      const minimalOrder: Order = {
        id: 'order-min',
        orderNumber: 'NO-MIN',
        email: 'minimal@example.com',
        status: 'pending' as OrderStatus,
        paymentStatus: 'pending' as PaymentStatus,
        shippingCost: 0,
        taxAmount: 0,
        subtotalAmount: 50,
        totalAmount: 50,
        items: [],
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      };

      // Act
      const csv = exportOrder(minimalOrder, { format: 'csv' });

      // Assert
      expect(typeof csv).toBe('string');
      expect(csv as string).toContain(
        `${minimalOrder.id},${minimalOrder.orderNumber},${minimalOrder.email}`
      );

      // It should handle missing addresses
      expect(csv as string).toContain('No shipping address provided');
      expect(csv as string).toContain('No billing address provided');

      // It should handle empty items
      expect(csv as string).not.toContain('ORDER ITEMS');
    });
  });

  describe('exportOrders - CSV format', () => {
    it('exports multiple orders to CSV in tabular format', () => {
      // Arrange
      const orders = [mockOrder, mockOrder2];

      // Act
      const csv = exportOrders(orders, { format: 'csv' });

      // Assert
      expect(typeof csv).toBe('string');

      // Should have one header row plus one row per order
      const lines = (csv as string).split('\n');
      expect(lines[0]).toContain('Order ID,Order Number,Customer Email,Status,Payment Status');

      // Should contain both order numbers
      expect(csv as string).toContain(mockOrder.orderNumber);
      expect(csv as string).toContain(mockOrder2.orderNumber);

      // Should have a separate section for items
      expect(csv as string).toContain('ORDER ITEMS');
      expect(csv as string).toContain('Order ID,Order Number,Item ID,Product ID,SKU,Name');

      // Should contain items from both orders
      expect(csv as string).toContain('TP1,Test Product 1,2,25,50');
      expect(csv as string).toContain('TP3,Test Product 3,3,30,90');
    });

    it('respects options to exclude sections', () => {
      // Arrange
      const orders = [mockOrder, mockOrder2];

      // Act
      const csv = exportOrders(orders, {
        format: 'csv',
        includeItems: false,
        includeAddresses: false,
        includePaymentInfo: false,
      });

      // Assert
      expect(typeof csv).toBe('string');

      // Should still have basic order data
      expect(csv as string).toContain(mockOrder.orderNumber);
      expect(csv as string).toContain(mockOrder2.orderNumber);

      // Should not have address columns
      expect(csv as string).not.toContain('Shipping Name');
      expect(csv as string).not.toContain('Billing Address');

      // Should not have payment columns
      expect(csv as string).not.toContain('Payment Intent ID');

      // Should not have items section
      expect(csv as string).not.toContain('ORDER ITEMS');
    });

    it('includes address and payment columns when requested', () => {
      // Arrange
      const orders = [mockOrder, mockOrder2];

      // Act
      const csv = exportOrders(orders, {
        format: 'csv',
        includeAddresses: true,
        includePaymentInfo: true,
      });

      // Assert
      expect(typeof csv).toBe('string');

      // Should have address columns
      const headerLine = (csv as string).split('\n')[0];
      expect(headerLine).toContain('Shipping Name');
      expect(headerLine).toContain('Shipping Address');
      expect(headerLine).toContain('Billing City');

      // Should have payment columns
      expect(headerLine).toContain('Payment Intent ID');
      expect(headerLine).toContain('Payment Provider');

      // Should include the data in the rows
      const dataLines = (csv as string).split('\n').slice(1);
      expect(dataLines.join('\n')).toContain('John Doe');
      expect(dataLines.join('\n')).toContain('pi_123456');
      expect(dataLines.join('\n')).toContain('stripe');
    });
  });

  describe('exportOrder - JSON format', () => {
    it('exports a single order to JSON with all sections by default', () => {
      // Act
      const json = exportOrder(mockOrder, { format: 'json' });

      // Assert
      expect(typeof json).toBe('string');

      // Parse the JSON to verify structure
      const parsedJson = JSON.parse(json as string);
      expect(parsedJson.id).toBe(mockOrder.id);
      expect(parsedJson.orderNumber).toBe(mockOrder.orderNumber);
      expect(parsedJson.email).toBe(mockOrder.email);

      // Should include all sections by default
      expect(parsedJson.items).toHaveLength(2);
      expect(parsedJson.shippingAddress).toBeDefined();
      expect(parsedJson.billingAddress).toBeDefined();
      expect(parsedJson.paymentIntentId).toBe(mockOrder.paymentIntentId);
      expect(parsedJson.statusHistory).toHaveLength(3);
    });

    it('excludes sections based on options', () => {
      // Act
      const json = exportOrder(mockOrder, {
        format: 'json',
        includeItems: false,
        includeAddresses: false,
        includePaymentInfo: false,
        includeStatusHistory: false,
      });

      // Assert
      expect(typeof json).toBe('string');

      // Parse the JSON to verify structure
      const parsedJson = JSON.parse(json as string);
      expect(parsedJson.id).toBe(mockOrder.id);

      // Should exclude requested sections
      expect(parsedJson.items).toBeUndefined();
      expect(parsedJson.shippingAddress).toBeUndefined();
      expect(parsedJson.billingAddress).toBeUndefined();
      expect(parsedJson.paymentIntentId).toBeUndefined();
      expect(parsedJson.statusHistory).toBeUndefined();
    });
  });

  describe('exportOrders - JSON format', () => {
    it('exports multiple orders to JSON as an array', () => {
      // Arrange
      const orders = [mockOrder, mockOrder2];

      // Act
      const json = exportOrders(orders, { format: 'json' });

      // Assert
      expect(typeof json).toBe('string');

      // Parse the JSON to verify structure
      const parsedJson = JSON.parse(json as string);
      expect(Array.isArray(parsedJson)).toBe(true);
      expect(parsedJson).toHaveLength(2);

      // Check first order
      expect(parsedJson[0].id).toBe(mockOrder.id);
      expect(parsedJson[0].orderNumber).toBe(mockOrder.orderNumber);

      // Check second order
      expect(parsedJson[1].id).toBe(mockOrder2.id);
      expect(parsedJson[1].orderNumber).toBe(mockOrder2.orderNumber);
    });

    it('applies the same filtering options to all orders', () => {
      // Arrange
      const orders = [mockOrder, mockOrder2];

      // Act
      const json = exportOrders(orders, {
        format: 'json',
        includeItems: true,
        includeAddresses: false,
        includePaymentInfo: false,
      });

      // Assert
      const parsedJson = JSON.parse(json as string);

      // Both orders should include items
      expect(parsedJson[0].items).toBeDefined();
      expect(parsedJson[1].items).toBeDefined();

      // Both orders should exclude addresses and payment info
      expect(parsedJson[0].shippingAddress).toBeUndefined();
      expect(parsedJson[1].shippingAddress).toBeUndefined();
      expect(parsedJson[0].paymentIntentId).toBeUndefined();
      expect(parsedJson[1].paymentIntentId).toBeUndefined();
    });
  });

  describe('Excel format', () => {
    it('returns a buffer for Excel format', () => {
      // Act
      const result = exportOrder(mockOrder, { format: 'excel' });

      // Assert
      expect(result).toBeInstanceOf(Buffer);

      // In our implementation, it's just a placeholder with JSON data
      expect(result.toString()).toContain('Excel format not implemented');
      expect(result.toString()).toContain(mockOrder.id);
    });

    it('returns a buffer for multiple orders in Excel format', () => {
      // Arrange
      const orders = [mockOrder, mockOrder2];

      // Act
      const result = exportOrders(orders, { format: 'excel' });

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toContain('Excel format not implemented');
      expect(result.toString()).toContain(mockOrder.id);
      expect(result.toString()).toContain(mockOrder2.id);
    });
  });

  describe('Error handling', () => {
    it('throws an error for unsupported export format', () => {
      // Act & Assert
      expect(() => exportOrder(mockOrder, { format: 'xml' as any })).toThrow(
        'Unsupported export format: xml'
      );
    });
  });
});
