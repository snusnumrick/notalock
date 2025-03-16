import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateInvoiceHtml, generateInvoicePdf } from '../invoice-generator';
import { type Order, OrderStatus, PaymentStatus } from '../../types';

// Mock utils
vi.mock('~/lib/utils', () => ({
  formatDate: vi.fn().mockImplementation((_date: string) => 'March 15, 2025'),
  formatCurrency: vi.fn().mockImplementation((amount: number) => `$${amount.toFixed(2)}`),
}));

describe('Invoice Generator', () => {
  // Mock environment variables
  const originalEnv = { ...process.env };

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
    notes: 'Customer requested gift wrapping',
    createdAt: '2025-03-15T12:00:00Z',
    updatedAt: '2025-03-15T12:00:00Z',
  };

  beforeEach(() => {
    // Set up test environment variables
    process.env.COMPANY_NAME = 'Test Company';
    process.env.COMPANY_ADDRESS = '456 Business Ave, Commerce City, CA 54321';
    process.env.COMPANY_TAX_ID = 'TAX-987654321';
    process.env.COMPANY_LOGO_URL = '/test-logo.png';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('generateInvoiceHtml', () => {
    it('generates HTML with all sections by default', () => {
      // Act
      const html = generateInvoiceHtml(mockOrder);

      // Assert
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>Invoice #NO-20250315-ABCD</title>');

      // Company information
      expect(html).toContain('Test Company');
      expect(html).toContain('456 Business Ave, Commerce City, CA 54321');
      expect(html).toContain('TAX-987654321');
      expect(html).toContain('/test-logo.png');

      // Invoice details
      expect(html).toContain('Invoice #NO-20250315-ABCD');
      expect(html).toContain('Date: March 15, 2025');
      expect(html).toContain('Payment Status: PAID');

      // Addresses
      expect(html).toContain('Bill To:');
      expect(html).toContain('Ship To:');
      expect(html).toContain('John Doe');
      expect(html).toContain('123 Main St');
      expect(html).toContain('Apt 4B');
      expect(html).toContain('Anytown, CA 12345');
      expect(html).toContain('Email: customer@example.com');

      // Order items
      expect(html).toContain('Test Product 1');
      expect(html).toContain('TP1');
      expect(html).toContain('2'); // Quantity
      expect(html).toContain('$25.00'); // Unit price
      expect(html).toContain('$50.00'); // Total price

      expect(html).toContain('Test Product 2');
      expect(html).toContain('TP2');

      // Order summary
      expect(html).toContain('Subtotal:');
      expect(html).toContain('$100.00');
      expect(html).toContain('Shipping:');
      expect(html).toContain('$10.00');
      expect(html).toContain('Tax:');
      expect(html).toContain('$8.50');
      expect(html).toContain('Total:');
      expect(html).toContain('$118.50');

      // Payment information
      expect(html).toContain('Payment Information');
      expect(html).toContain('Payment Method: stripe');
      expect(html).toContain('Payment ID: pi_123456');

      // Notes
      expect(html).toContain('Notes');
      expect(html).toContain('Customer requested gift wrapping');

      // Footer
      expect(html).toContain('Thank you for your business!');
    });

    it('excludes sections based on options', () => {
      // Act
      const html = generateInvoiceHtml(mockOrder, {
        includeCompanyLogo: false,
        includeTaxId: false,
        includeBillingAddress: false,
        includeShippingAddress: false,
        includePaymentInfo: false,
        includeOrderNotes: false,
        includeFooter: false,
      });

      // Assert
      expect(html).not.toContain('/test-logo.png');
      expect(html).not.toContain('TAX-987654321');
      expect(html).not.toContain('Bill To:');
      expect(html).not.toContain('Ship To:');
      expect(html).not.toContain('Payment Information');
      expect(html).not.toContain('Notes');
      expect(html).not.toContain('Thank you for your business!');

      // Core order details should still be present
      expect(html).toContain('Invoice #NO-20250315-ABCD');
      expect(html).toContain('Test Product 1');
      expect(html).toContain('$118.50'); // Total
    });

    it('handles missing billing and shipping addresses', () => {
      // Arrange
      const orderWithoutAddresses = {
        ...mockOrder,
        billingAddress: undefined,
        shippingAddress: undefined,
      };

      // Act
      const html = generateInvoiceHtml(orderWithoutAddresses);

      // Assert
      expect(html).toContain('Bill To:');
      expect(html).toContain('Ship To:');
      expect(html).toContain('Not provided'); // Default text for missing addresses
    });

    it('handles orders without notes', () => {
      // Arrange
      const orderWithoutNotes = {
        ...mockOrder,
        notes: undefined,
      };

      // Act
      const html = generateInvoiceHtml(orderWithoutNotes);

      // Assert - Notes section should not be rendered
      expect(html).not.toContain('Customer requested gift wrapping');
      expect(html).not.toContain('<div class="notes">');
    });

    it('handles orders without payment info', () => {
      // Arrange
      const orderWithoutPayment = {
        ...mockOrder,
        paymentIntentId: undefined,
        paymentMethodId: undefined,
        paymentProvider: undefined,
      };

      // Act
      const html = generateInvoiceHtml(orderWithoutPayment);

      // Assert - Payment section should not be rendered
      expect(html).not.toContain('Payment Method:');
      expect(html).not.toContain('Payment ID:');
    });
  });

  describe('generateInvoicePdf', () => {
    it('returns a buffer containing the HTML', async () => {
      // Act
      const result = await generateInvoicePdf(mockOrder);

      // Assert
      expect(result).toBeInstanceOf(Buffer);

      // Convert buffer to string to check content
      const htmlString = result.toString();
      expect(htmlString).toContain('<!DOCTYPE html>');
      expect(htmlString).toContain('Invoice #NO-20250315-ABCD');
    });

    it('passes options to the HTML generator', async () => {
      // Act
      const result = await generateInvoicePdf(mockOrder, {
        includeCompanyLogo: false,
        includeFooter: false,
      });

      // Assert
      const htmlString = result.toString();
      expect(htmlString).not.toContain('/test-logo.png');
      expect(htmlString).not.toContain('Thank you for your business!');
    });
  });
});
