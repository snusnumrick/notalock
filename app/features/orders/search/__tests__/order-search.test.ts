import { describe, it, expect } from 'vitest';
import { searchOrders, quickSearchOrders, fuzzySearchOrders } from '../order-search';
import { type Order, OrderStatus, PaymentStatus } from '../../types';

describe('Order Search', () => {
  // Mock orders for testing search functionality
  const mockOrders: Order[] = [
    // Order 1 - Completed, US customer
    createMockOrder({
      id: 'order-1',
      orderNumber: 'NO-20250315-AAAA',
      userId: 'user-1',
      email: 'john.doe@example.com',
      status: 'completed',
      paymentStatus: 'paid',
      totalAmount: 125.5,
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        country: 'US',
      },
      items: [
        {
          productId: 'product-1',
          name: 'Premium Headphones',
          sku: 'AUDIO-001',
          quantity: 1,
          unitPrice: 99.99,
          totalPrice: 99.99,
        },
        {
          productId: 'product-2',
          name: 'USB Cable',
          sku: 'ACC-100',
          quantity: 2,
          unitPrice: 12.75,
          totalPrice: 25.5,
        },
      ],
      notes: 'Customer requested express shipping',
      createdAt: '2025-03-15T12:00:00Z',
    }),

    // Order 2 - Processing, UK customer
    createMockOrder({
      id: 'order-2',
      orderNumber: 'NO-20250314-BBBB',
      userId: 'user-2',
      email: 'emma.smith@example.com',
      status: 'processing',
      paymentStatus: 'paid',
      totalAmount: 249.99,
      shippingAddress: {
        firstName: 'Emma',
        lastName: 'Smith',
        country: 'UK',
      },
      items: [
        {
          productId: 'product-3',
          name: 'Wireless Keyboard',
          sku: 'KB-200',
          quantity: 1,
          unitPrice: 79.99,
          totalPrice: 79.99,
        },
        {
          productId: 'product-4',
          name: 'Wireless Mouse',
          sku: 'MS-200',
          quantity: 1,
          unitPrice: 49.99,
          totalPrice: 49.99,
        },
        {
          productId: 'product-5',
          name: '27" Monitor',
          sku: 'MON-27',
          quantity: 1,
          unitPrice: 120.0,
          totalPrice: 120.0,
        },
      ],
      createdAt: '2025-03-14T15:30:00Z',
    }),

    // Order 3 - Cancelled, US customer with the same product as Order 1
    createMockOrder({
      id: 'order-3',
      orderNumber: 'NO-20250313-CCCC',
      userId: 'user-3',
      email: 'robert.johnson@example.com',
      status: 'cancelled',
      paymentStatus: 'refunded',
      totalAmount: 99.99,
      shippingAddress: {
        firstName: 'Robert',
        lastName: 'Johnson',
        country: 'US',
      },
      items: [
        {
          productId: 'product-1',
          name: 'Premium Headphones',
          sku: 'AUDIO-001',
          quantity: 1,
          unitPrice: 99.99,
          totalPrice: 99.99,
        },
      ],
      notes: 'Customer cancelled due to long delivery time',
      createdAt: '2025-03-13T09:45:00Z',
    }),

    // Order 4 - Pending, Canada customer
    createMockOrder({
      id: 'order-4',
      orderNumber: 'NO-20250312-DDDD',
      userId: 'user-4',
      email: 'sarah.williams@example.com',
      status: 'pending',
      paymentStatus: 'pending',
      totalAmount: 349.98,
      shippingAddress: {
        firstName: 'Sarah',
        lastName: 'Williams',
        country: 'CA',
      },
      billingAddress: {
        firstName: 'Sarah',
        lastName: 'Williams-Billing', // Different last name for billing
        country: 'CA',
      },
      items: [
        {
          productId: 'product-6',
          name: 'Smartphone Case',
          sku: 'PHONE-CASE',
          quantity: 1,
          unitPrice: 29.99,
          totalPrice: 29.99,
        },
        {
          productId: 'product-7',
          name: 'Laptop Backpack',
          sku: 'BAG-001',
          quantity: 1,
          unitPrice: 89.99,
          totalPrice: 89.99,
        },
        {
          productId: 'product-8',
          name: 'Bluetooth Speaker',
          sku: 'AUDIO-002',
          quantity: 1,
          unitPrice: 129.99,
          totalPrice: 129.99,
        },
        {
          productId: 'product-9',
          name: 'Power Bank',
          sku: 'PWR-500',
          quantity: 1,
          unitPrice: 49.99,
          totalPrice: 49.99,
        },
        {
          productId: 'product-10',
          name: 'Screen Protector',
          sku: 'SP-001',
          quantity: 2,
          unitPrice: 24.99,
          totalPrice: 49.98,
        },
      ],
      createdAt: '2025-03-12T18:20:00Z',
    }),

    // Order 5 - Completed, Germany customer with high value
    createMockOrder({
      id: 'order-5',
      orderNumber: 'NO-20250310-EEEE',
      userId: 'user-5',
      email: 'michael.schmidt@example.com',
      status: 'completed',
      paymentStatus: 'paid',
      totalAmount: 1899.97,
      shippingAddress: {
        firstName: 'Michael',
        lastName: 'Schmidt',
        country: 'DE',
      },
      items: [
        {
          productId: 'product-11',
          name: 'Laptop Pro 16"',
          sku: 'LT-PRO-16',
          quantity: 1,
          unitPrice: 1599.99,
          totalPrice: 1599.99,
        },
        {
          productId: 'product-12',
          name: 'Extended Warranty',
          sku: 'WARR-3YR',
          quantity: 1,
          unitPrice: 299.99,
          totalPrice: 299.99,
        },
      ],
      createdAt: '2025-03-10T10:15:00Z',
    }),
  ];

  // Helper function to create mock orders
  function createMockOrder(partialOrder: Partial<Order>): Order {
    return {
      id: partialOrder.id || 'order-id',
      orderNumber: partialOrder.orderNumber || 'NO-123',
      userId: partialOrder.userId || 'user-123',
      email: partialOrder.email || 'customer@example.com',
      status: (partialOrder.status as OrderStatus) || 'completed',
      paymentStatus: (partialOrder.paymentStatus as PaymentStatus) || 'paid',
      shippingCost: partialOrder.shippingCost || 10,
      taxAmount: partialOrder.taxAmount || 5,
      subtotalAmount: (partialOrder.totalAmount || 100) - 15, // Subtract shipping + tax
      totalAmount: partialOrder.totalAmount || 100,
      shippingAddress: partialOrder.shippingAddress
        ? {
            firstName: partialOrder.shippingAddress.firstName || 'First',
            lastName: partialOrder.shippingAddress.lastName || 'Last',
            address1: partialOrder.shippingAddress.address1 || '123 Main St',
            city: partialOrder.shippingAddress.city || 'City',
            state: partialOrder.shippingAddress.state || 'State',
            postalCode: partialOrder.shippingAddress.postalCode || '12345',
            country: partialOrder.shippingAddress.country || 'US',
            phone: partialOrder.shippingAddress.phone,
          }
        : undefined,
      billingAddress: partialOrder.billingAddress,
      items: partialOrder.items || [],
      notes: partialOrder.notes,
      createdAt: partialOrder.createdAt || '2025-03-15T12:00:00Z',
      updatedAt: partialOrder.updatedAt || '2025-03-15T12:00:00Z',
    };
  }

  describe('searchOrders', () => {
    it('returns all orders when no search options are provided', () => {
      // Act
      const result = searchOrders(mockOrders);

      // Assert
      expect(result.orders).toHaveLength(mockOrders.length);
      expect(result.total).toBe(mockOrders.length);

      // Default sorting should be by date, newest first
      expect(result.orders[0].id).toBe('order-1'); // March 15
      expect(result.orders[1].id).toBe('order-2'); // March 14
    });

    it('filters by order ID', () => {
      // Act
      const result = searchOrders(mockOrders, {
        orderIds: ['order-1', 'order-3'],
      });

      // Assert
      expect(result.orders).toHaveLength(2);
      expect(result.orders.map(o => o.id)).toContain('order-1');
      expect(result.orders.map(o => o.id)).toContain('order-3');
    });

    it('filters by order number', () => {
      // Act
      const result = searchOrders(mockOrders, {
        orderNumbers: ['NO-20250315-AAAA'],
      });

      // Assert
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].orderNumber).toBe('NO-20250315-AAAA');
    });

    it('filters by customer ID', () => {
      // Act
      const result = searchOrders(mockOrders, {
        customerIds: ['user-2'],
      });

      // Assert
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].userId).toBe('user-2');
    });

    it('filters by email', () => {
      // Act
      const result = searchOrders(mockOrders, {
        emails: ['john.doe@example.com', 'emma.smith@example.com'],
      });

      // Assert
      expect(result.orders).toHaveLength(2);
      expect(result.orders[0].email).toBe('john.doe@example.com');
      expect(result.orders[1].email).toBe('emma.smith@example.com');
    });

    it('filters by status', () => {
      // Act
      const result = searchOrders(mockOrders, {
        statuses: ['completed'],
      });

      // Assert
      expect(result.orders).toHaveLength(2);
      expect(result.orders[0].status).toBe('completed');
      expect(result.orders[1].status).toBe('completed');
    });

    it('filters by payment status', () => {
      // Act
      const result = searchOrders(mockOrders, {
        paymentStatuses: ['pending'],
      });

      // Assert
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].paymentStatus).toBe('pending');
    });

    it('filters by date range', () => {
      // Act
      const result = searchOrders(mockOrders, {
        minDate: new Date('2025-03-14T00:00:00Z'),
        maxDate: new Date('2025-03-15T23:59:59Z'),
      });

      // Assert
      expect(result.orders).toHaveLength(2);
      expect(result.orders[0].id).toBe('order-1'); // March 15
      expect(result.orders[1].id).toBe('order-2'); // March 14
    });

    it('filters by amount range', () => {
      // Act
      const result = searchOrders(mockOrders, {
        minAmount: 1000,
        maxAmount: 2000,
      });

      // Assert
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].id).toBe('order-5'); // $1899.97
    });

    it('filters by product IDs', () => {
      // Act
      const result = searchOrders(mockOrders, {
        productIds: ['product-1'], // In orders 1 and 3
      });

      // Assert
      expect(result.orders).toHaveLength(2);
      expect(result.orders.map(o => o.id)).toContain('order-1');
      expect(result.orders.map(o => o.id)).toContain('order-3');
    });

    it('filters by shipping country', () => {
      // Act
      const result = searchOrders(mockOrders, {
        shippingCountries: ['US'],
      });

      // Assert
      expect(result.orders).toHaveLength(2);
      expect(result.orders[0].shippingAddress?.country).toBe('US');
      expect(result.orders[1].shippingAddress?.country).toBe('US');
    });

    it('searches by text query in order number', () => {
      // Act
      const result = searchOrders(mockOrders, {
        query: 'AAAA',
      });

      // Assert
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].orderNumber).toBe('NO-20250315-AAAA');
    });

    it('searches by text query in customer name', () => {
      // Act
      const result = searchOrders(mockOrders, {
        query: 'Smith',
      });

      // Assert
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].shippingAddress?.lastName).toBe('Smith');
    });

    it('searches by text query in product name', () => {
      // Act
      const result = searchOrders(mockOrders, {
        query: 'Headphones',
      });

      // Assert
      expect(result.orders).toHaveLength(2); // Orders 1 and 3
      expect(result.orders.every(o => o.items.some(item => item.name.includes('Headphones')))).toBe(
        true
      );
    });

    it('searches by text query in SKU', () => {
      // Act
      const result = searchOrders(mockOrders, {
        query: 'AUDIO',
      });

      // Assert
      expect(result.orders).toHaveLength(3); // Orders 1, 3, and 4 (AUDIO-001 and AUDIO-002)
    });

    it('searches in notes when includeNotesInSearch is true', () => {
      // Act
      const result = searchOrders(mockOrders, {
        query: 'express shipping',
        includeNotesInSearch: true,
      });

      // Assert
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].id).toBe('order-1');
    });

    it('applies exact match for text search when requested', () => {
      // Act - Case-sensitive search with exact match
      const result = searchOrders(mockOrders, {
        query: 'premium headphones', // lowercase, but product is "Premium Headphones"
        exactMatch: true,
      });

      // Assert - Should not match due to case difference
      expect(result.orders).toHaveLength(0);

      // Act - With correct case
      const resultCorrectCase = searchOrders(mockOrders, {
        query: 'Premium Headphones',
        exactMatch: true,
      });

      // Assert - Should match now
      expect(resultCorrectCase.orders).toHaveLength(2);
    });

    it('applies sorting by date', () => {
      // Act - Sort by date ascending (oldest first)
      const result = searchOrders(mockOrders, {
        sortBy: 'date',
        sortDirection: 'asc',
      });

      // Assert
      expect(result.orders).toHaveLength(5);
      expect(result.orders[0].id).toBe('order-5'); // March 10
      expect(result.orders[4].id).toBe('order-1'); // March 15
    });

    it('applies sorting by total amount', () => {
      // Act - Sort by total amount descending (highest first)
      const result = searchOrders(mockOrders, {
        sortBy: 'total',
        sortDirection: 'desc',
      });

      // Assert
      expect(result.orders).toHaveLength(5);
      expect(result.orders[0].id).toBe('order-5'); // $1899.97
      expect(result.orders[4].id).toBe('order-3'); // $99.99
    });

    it('applies sorting by status', () => {
      // Act - Sort by status alphabetically
      const result = searchOrders(mockOrders, {
        sortBy: 'status',
        sortDirection: 'asc',
      });

      // Assert
      expect(result.orders).toHaveLength(5);
      // Should be in order: cancelled, completed, completed, pending, processing
      expect(result.orders[0].status).toBe('cancelled');
    });

    it('applies pagination', () => {
      // Act - Get first 2 orders with offset 0
      const result1 = searchOrders(mockOrders, {
        limit: 2,
        offset: 0,
      });

      // Assert
      expect(result1.orders).toHaveLength(2);
      expect(result1.total).toBe(5); // Total count includes all matching orders
      expect(result1.limit).toBe(2);
      expect(result1.offset).toBe(0);

      // Act - Get next 2 orders with offset 2
      const result2 = searchOrders(mockOrders, {
        limit: 2,
        offset: 2,
      });

      // Assert
      expect(result2.orders).toHaveLength(2);
      expect(result2.total).toBe(5);
      expect(result2.offset).toBe(2);

      // Verify we got different orders
      expect(result1.orders[0].id).not.toBe(result2.orders[0].id);
    });

    it('combines multiple filter criteria', () => {
      // Act - Search for completed orders in the US with total > $100
      const result = searchOrders(mockOrders, {
        statuses: ['completed'],
        shippingCountries: ['US'],
        minAmount: 100,
      });

      // Assert
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].id).toBe('order-1');
    });
  });

  describe('quickSearchOrders', () => {
    it('returns empty array for empty query', () => {
      // Act
      const result = quickSearchOrders(mockOrders, '');

      // Assert
      expect(result).toEqual([]);
    });

    it('searches across common fields', () => {
      // Act - Search by order number
      const result1 = quickSearchOrders(mockOrders, 'AAAA');
      expect(result1).toHaveLength(1);
      expect(result1[0].orderNumber).toBe('NO-20250315-AAAA');

      // Act - Search by email
      const result2 = quickSearchOrders(mockOrders, 'john.doe');
      expect(result2).toHaveLength(1);
      expect(result2[0].email).toBe('john.doe@example.com');

      // Act - Search by customer name
      const result3 = quickSearchOrders(mockOrders, 'schmidt');
      expect(result3).toHaveLength(1);
      expect(result3[0].shippingAddress?.lastName).toBe('Schmidt');

      // Act - Search by product name
      const result4 = quickSearchOrders(mockOrders, 'monitor');
      expect(result4).toHaveLength(1);
      expect(result4[0].items.some(item => item.name.includes('Monitor'))).toBe(true);

      // Act - Search by SKU
      const result5 = quickSearchOrders(mockOrders, 'AUDIO');
      expect(result5).toHaveLength(3);
    });

    it('is case insensitive', () => {
      // Act
      const result1 = quickSearchOrders(mockOrders, 'premium headphones');
      const result2 = quickSearchOrders(mockOrders, 'PREMIUM HEADPHONES');

      // Assert
      expect(result1).toHaveLength(2);
      expect(result2).toHaveLength(2);
    });

    it('trims whitespace from query', () => {
      // Act
      const result = quickSearchOrders(mockOrders, '  smith  ');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].shippingAddress?.lastName).toBe('Smith');
    });
  });

  describe('fuzzySearchOrders', () => {
    it('returns empty array for empty query', () => {
      // Act
      const result = fuzzySearchOrders(mockOrders, '');

      // Assert
      expect(result).toEqual([]);
    });

    it('finds exact matches with highest priority', () => {
      // Act
      const result = fuzzySearchOrders(mockOrders, 'Laptop Pro');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('order-5');
    });

    it('finds partial word matches', () => {
      // Act
      const result = fuzzySearchOrders(mockOrders, 'head');

      // Assert
      expect(result).toHaveLength(2);
      expect(result.some(o => o.id === 'order-1')).toBe(true);
      expect(result.some(o => o.id === 'order-3')).toBe(true);
    });

    it('handles multi-word queries', () => {
      // Act
      const result = fuzzySearchOrders(mockOrders, 'wireless keyboard mouse');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('order-2');
    });

    it('ranks results by relevance', () => {
      // Act - "audio" appears in multiple orders
      const result = fuzzySearchOrders(mockOrders, 'audio');

      // Assert - Should be ordered by relevance
      expect(result.length).toBeGreaterThan(0);
    });

    it('finds results despite minor typos', () => {
      // Act - Misspelling "headphnes" instead of "headphones"
      const result = fuzzySearchOrders(mockOrders, 'premiem headphnes');

      // Assert - Should still find the headphones
      expect(result).toHaveLength(2);
      expect(result.some(o => o.items.some(item => item.name === 'Premium Headphones'))).toBe(true);
    });
  });
});
