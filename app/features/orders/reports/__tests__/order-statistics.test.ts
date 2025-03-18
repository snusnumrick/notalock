import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getDateRangeForPeriod,
  filterOrdersByDateRange,
  calculateSalesSummary,
  calculateStatusDistribution,
  calculateProductSales,
  calculateTimeSeries,
  generateOrderReport,
  compareOrderPerformance,
} from '../order-statistics';
import { type Order, OrderStatus, PaymentStatus } from '../../types';

// Mock formatCurrency function
vi.mock('~/lib/utils', () => ({
  formatCurrency: vi.fn().mockImplementation(amount => `$${amount.toFixed(2)}`),
}));

describe('Order Statistics', () => {
  // Mock orders for testing
  let mockOrders: Order[];

  // Create mock date for testing
  const mockReferenceDate = new Date('2025-03-15T12:00:00Z');

  // Save original Date implementation
  const originalDate = global.Date;

  beforeEach(() => {
    // Setup mock orders covering a range of dates, statuses, and products
    mockOrders = [
      // March 15 orders (Today)
      createMockOrder({
        id: 'order-1',
        orderNumber: 'NO-20250315-AAAA',
        status: 'completed',
        createdAt: '2025-03-15T10:00:00Z',
        totalAmount: 100,
        items: [
          {
            id: 'item-1',
            orderId: 'order-1',
            productId: 'product-1',
            name: 'Product 1',
            sku: 'P1',
            quantity: 2,
            unitPrice: 25,
            totalPrice: 50,
            price: 25,
          },
          {
            id: 'item-2',
            orderId: 'order-1',
            productId: 'product-2',
            name: 'Product 2',
            sku: 'P2',
            quantity: 1,
            unitPrice: 50,
            totalPrice: 50,
            price: 50,
          },
        ],
      }),
      createMockOrder({
        id: 'order-2',
        orderNumber: 'NO-20250315-BBBB',
        status: 'processing',
        createdAt: '2025-03-15T14:00:00Z',
        totalAmount: 125,
        items: [
          {
            id: 'item-3',
            orderId: 'order-2',
            productId: 'product-3',
            name: 'Product 3',
            sku: 'P3',
            quantity: 1,
            unitPrice: 125,
            totalPrice: 125,
            price: 125,
          },
        ],
      }),

      // March 14 orders (Yesterday)
      createMockOrder({
        id: 'order-3',
        orderNumber: 'NO-20250314-CCCC',
        status: 'completed',
        createdAt: '2025-03-14T09:00:00Z',
        totalAmount: 75,
        items: [
          {
            id: 'item-4',
            orderId: 'order-3',
            productId: 'product-1',
            name: 'Product 1',
            sku: 'P1',
            quantity: 3,
            unitPrice: 25,
            totalPrice: 75,
            price: 25,
          },
        ],
      }),

      // March 10 orders (Last week)
      createMockOrder({
        id: 'order-4',
        orderNumber: 'NO-20250310-DDDD',
        status: 'cancelled',
        createdAt: '2025-03-10T16:00:00Z',
        totalAmount: 50,
        items: [
          {
            id: 'item-5',
            orderId: 'order-4',
            productId: 'product-2',
            name: 'Product 2',
            sku: 'P2',
            quantity: 1,
            unitPrice: 50,
            totalPrice: 50,
            price: 50,
          },
        ],
      }),

      // February 15 orders (Last month)
      createMockOrder({
        id: 'order-5',
        orderNumber: 'NO-20250215-EEEE',
        status: 'completed',
        createdAt: '2025-02-15T11:00:00Z',
        totalAmount: 150,
        items: [
          {
            id: 'item-6',
            orderId: 'order-5',
            productId: 'product-4',
            name: 'Product 4',
            sku: 'P4',
            quantity: 1,
            unitPrice: 150,
            totalPrice: 150,
            price: 150,
          },
        ],
      }),

      // January 15 orders (2 months ago)
      createMockOrder({
        id: 'order-6',
        orderNumber: 'NO-20250115-FFFF',
        status: 'completed',
        createdAt: '2025-01-15T08:00:00Z',
        totalAmount: 200,
        items: [
          {
            id: 'item-7',
            orderId: 'order-6',
            productId: 'product-5',
            name: 'Product 5',
            sku: 'P5',
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200,
            price: 100,
          },
        ],
      }),
    ];

    // Mock Date to return a fixed date
    global.Date = class extends originalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockReferenceDate); // Return mock reference date when called with no args
        } else {
          // @ts-expect-error - Passing unknown args to Date constructor
          super(...args);
        }
      }

      static now() {
        return mockReferenceDate.getTime();
      }

      // Add implementation for Date() without 'new'
      static toString() {
        return new originalDate(mockReferenceDate).toString();
      }
    } as unknown as DateConstructor;
  });

  afterEach(() => {
    // Restore original Date implementation
    global.Date = originalDate;
  });

  // Helper function to create mock order
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
      items: partialOrder.items || [],
      createdAt: partialOrder.createdAt || '2025-03-15T12:00:00Z',
      updatedAt: partialOrder.updatedAt || '2025-03-15T12:00:00Z',
    };
  }

  describe('getDateRangeForPeriod', () => {
    it('returns correct date range for daily period', () => {
      // Act
      const range = getDateRangeForPeriod('daily', mockReferenceDate);

      // Assert
      expect(range.startDate.toISOString()).toBe('2025-03-15T00:00:00.000Z');
      expect(range.endDate.toISOString()).toBe('2025-03-15T23:59:59.999Z');
    });

    it('returns correct date range for weekly period', () => {
      // Act
      const range = getDateRangeForPeriod('weekly', mockReferenceDate);

      // Assert
      expect(range.startDate.toISOString()).toBe('2025-03-09T00:00:00.000Z');
      expect(range.endDate.toISOString()).toBe('2025-03-15T23:59:59.999Z');
    });

    it('returns correct date range for monthly period', () => {
      // Act
      const range = getDateRangeForPeriod('monthly', mockReferenceDate);

      // Assert
      expect(range.startDate.toISOString()).toBe('2025-02-15T00:00:00.000Z');
      expect(range.endDate.toISOString()).toBe('2025-03-15T23:59:59.999Z');
    });

    it('returns correct date range for quarterly period', () => {
      // Act
      const range = getDateRangeForPeriod('quarterly', mockReferenceDate);

      // Assert
      expect(range.startDate.toISOString()).toBe('2024-12-15T00:00:00.000Z');
      expect(range.endDate.toISOString()).toBe('2025-03-15T23:59:59.999Z');
    });

    it('returns correct date range for yearly period', () => {
      // Act
      const range = getDateRangeForPeriod('yearly', mockReferenceDate);

      // Assert
      expect(range.startDate.toISOString()).toBe('2024-03-15T00:00:00.000Z');
      expect(range.endDate.toISOString()).toBe('2025-03-15T23:59:59.999Z');
    });

    it('uses current date if reference date is not provided', () => {
      // Act
      const range = getDateRangeForPeriod('daily'); // No reference date

      // Assert
      expect(range.startDate.toISOString()).toBe('2025-03-15T00:00:00.000Z');
      expect(range.endDate.toISOString()).toBe('2025-03-15T23:59:59.999Z');
    });
  });

  describe('filterOrdersByDateRange', () => {
    it('filters orders correctly based on date range', () => {
      // Arrange
      const dateRange = {
        startDate: new Date('2025-03-14T00:00:00Z'),
        endDate: new Date('2025-03-15T23:59:59Z'),
      };

      // Act
      const filteredOrders = filterOrdersByDateRange(mockOrders, dateRange);

      // Assert
      expect(filteredOrders).toHaveLength(3); // 2 orders from March 15 + 1 from March 14
      expect(filteredOrders.map(o => o.id)).toContain('order-1');
      expect(filteredOrders.map(o => o.id)).toContain('order-2');
      expect(filteredOrders.map(o => o.id)).toContain('order-3');
    });

    it('returns empty array if no orders match the date range', () => {
      // Arrange
      const dateRange = {
        startDate: new Date('2025-04-01T00:00:00Z'),
        endDate: new Date('2025-04-30T23:59:59Z'),
      };

      // Act
      const filteredOrders = filterOrdersByDateRange(mockOrders, dateRange);

      // Assert
      expect(filteredOrders).toHaveLength(0);
    });
  });

  describe('calculateSalesSummary', () => {
    it('calculates correct summary for a set of orders', () => {
      // Act
      const summary = calculateSalesSummary(mockOrders);

      // Assert
      expect(summary.totalOrders).toBe(6);
      expect(summary.totalRevenue).toBe(700); // Sum of all order totals
      expect(summary.averageOrderValue).toBe(700 / 6);

      // 2 + 1 + 3 + 1 + 1 + 2 = 10 items
      expect(summary.totalItems).toBe(10);

      // 6 orders × $10 shipping = $60
      expect(summary.totalShipping).toBe(60);

      // 6 orders × $5 tax = $30
      expect(summary.totalTax).toBe(30);
    });

    it('returns zeros for empty orders array', () => {
      // Act
      const summary = calculateSalesSummary([]);

      // Assert
      expect(summary.totalOrders).toBe(0);
      expect(summary.totalRevenue).toBe(0);
      expect(summary.averageOrderValue).toBe(0);
      expect(summary.totalItems).toBe(0);
      expect(summary.totalShipping).toBe(0);
      expect(summary.totalTax).toBe(0);
    });
  });

  describe('calculateStatusDistribution', () => {
    it('calculates correct status distribution', () => {
      // Act
      const distribution = calculateStatusDistribution(mockOrders);

      // Assert - 4 completed, 1 processing, 1 cancelled
      expect(distribution).toHaveLength(3);

      const completedStatus = distribution.find(d => d.status === 'completed');
      expect(completedStatus?.count).toBe(4);
      expect(completedStatus?.percentage).toBe((4 / 6) * 100);

      const processingStatus = distribution.find(d => d.status === 'processing');
      expect(processingStatus?.count).toBe(1);
      expect(processingStatus?.percentage).toBe((1 / 6) * 100);

      const cancelledStatus = distribution.find(d => d.status === 'cancelled');
      expect(cancelledStatus?.count).toBe(1);
      expect(cancelledStatus?.percentage).toBe((1 / 6) * 100);
    });

    it('returns empty array for empty orders array', () => {
      // Act
      const distribution = calculateStatusDistribution([]);

      // Assert
      expect(distribution).toEqual([]);
    });
  });

  describe('calculateProductSales', () => {
    it('calculates correct product sales data', () => {
      // Act
      const productSales = calculateProductSales(mockOrders);

      // Assert - sorted by revenue, highest first
      expect(productSales).toHaveLength(5); // 5 unique products

      // Check the top product (Product 5 with $200 revenue)
      expect(productSales[0].productId).toBe('product-5');
      expect(productSales[0].revenue).toBe(200);
      expect(productSales[0].quantity).toBe(2);

      // Check Product 1 (aggregated across orders)
      const product1 = productSales.find(p => p.productId === 'product-1');
      expect(product1?.quantity).toBe(5); // 2 from order-1 + 3 from order-3
      expect(product1?.revenue).toBe(125); // $50 + $75
      expect(product1?.averageUnitPrice).toBe(25); // $125 / 5 units
    });

    it('returns empty array for empty orders array', () => {
      // Act
      const productSales = calculateProductSales([]);

      // Assert
      expect(productSales).toEqual([]);
    });
  });

  describe('calculateTimeSeries', () => {
    it('calculates daily time series data correctly', () => {
      // Arrange
      const dateRange = {
        startDate: new Date('2025-03-14T00:00:00Z'),
        endDate: new Date('2025-03-15T23:59:59Z'),
      };

      // Act
      const timeSeries = calculateTimeSeries(mockOrders, dateRange, 'day');

      // Assert
      expect(timeSeries).toHaveLength(2); // 2 days

      // March 14
      expect(timeSeries[0].date).toBe('2025-03-14');
      expect(timeSeries[0].orders).toBe(1);
      expect(timeSeries[0].revenue).toBe(75);

      // March 15
      expect(timeSeries[1].date).toBe('2025-03-15');
      expect(timeSeries[1].orders).toBe(2);
      expect(timeSeries[1].revenue).toBe(225); // 100 + 125
    });

    it('calculates weekly time series data correctly', () => {
      // Arrange
      const dateRange = {
        startDate: new Date('2025-03-01T00:00:00Z'),
        endDate: new Date('2025-03-15T23:59:59Z'),
      };

      // Act
      const timeSeries = calculateTimeSeries(mockOrders, dateRange, 'week');

      // Assert - 3 weeks in March 1-15
      expect(timeSeries.length).toBeGreaterThan(0);

      // Find the week containing March 15
      const lastWeek = timeSeries.find(
        t =>
          new Date(t.date) <= new Date('2025-03-15') && new Date(t.date) >= new Date('2025-03-09')
      );

      expect(lastWeek).toBeDefined();
      expect(lastWeek?.orders).toBe(3); // 2 on March 15 + 1 on March 14
    });

    it('calculates monthly time series data correctly', () => {
      // Arrange
      const dateRange = {
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-03-31T23:59:59Z'),
      };

      // Act
      const timeSeries = calculateTimeSeries(mockOrders, dateRange, 'month');

      // Assert - 3 months (Jan-Mar)
      expect(timeSeries).toHaveLength(3);

      // January
      expect(timeSeries[0].date).toBe('2025-01');
      expect(timeSeries[0].orders).toBe(1);
      expect(timeSeries[0].revenue).toBe(200);

      // February
      expect(timeSeries[1].date).toBe('2025-02');
      expect(timeSeries[1].orders).toBe(1);
      expect(timeSeries[1].revenue).toBe(150);

      // March
      expect(timeSeries[2].date).toBe('2025-03');
      expect(timeSeries[2].orders).toBe(4); // 4 orders in March
      expect(timeSeries[2].revenue).toBe(350); // 100 + 125 + 75 + 50
    });

    it('returns empty array for empty orders array', () => {
      // Arrange
      const dateRange = {
        startDate: new Date('2025-03-01T00:00:00Z'),
        endDate: new Date('2025-03-31T23:59:59Z'),
      };

      // Act
      const timeSeries = calculateTimeSeries([], dateRange, 'day');

      // Assert
      expect(timeSeries).toEqual([]);
    });
  });

  describe('generateOrderReport', () => {
    it('generates a complete report for the monthly period', () => {
      // Act
      const report = generateOrderReport(mockOrders, 'monthly');

      // Assert
      expect(report.period).toBe('monthly');

      // Date range should be from Feb 15 to Mar 15
      expect(report.dateRange.startDate.toISOString()).toBe('2025-02-15T00:00:00.000Z');
      expect(report.dateRange.endDate.toISOString()).toBe('2025-03-15T23:59:59.999Z');

      // Summary should include orders from Feb 15 to Mar 15 (5 orders)
      expect(report.summary.totalOrders).toBe(5);

      // Status distribution should include statuses for these 5 orders
      expect(report.statusDistribution.length).toBeGreaterThan(0);

      // Top products should be calculated
      expect(report.topProducts.length).toBeGreaterThan(0);

      // Time series should use weekly intervals for monthly report
      expect(report.timeSeries.length).toBeGreaterThan(0);
    });

    it('generates a report with custom date range', () => {
      // Arrange
      const customDateRange = {
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-31T23:59:59Z'),
      };

      // Act
      const report = generateOrderReport(mockOrders, 'custom', customDateRange);

      // Assert
      expect(report.period).toBe('custom');
      expect(report.dateRange).toEqual(customDateRange);

      // Only one order in January
      expect(report.summary.totalOrders).toBe(1);
      expect(report.summary.totalRevenue).toBe(200);
    });

    it('selects appropriate time series interval based on date range', () => {
      // Daily report should use daily intervals
      const dailyReport = generateOrderReport(mockOrders, 'daily');
      expect(dailyReport.timeSeries.length).toBeGreaterThan(0);

      // Yearly report should use monthly intervals
      const yearlyReport = generateOrderReport(mockOrders, 'yearly');
      expect(yearlyReport.timeSeries.length).toBeGreaterThan(0);
    });
  });

  describe('compareOrderPerformance', () => {
    it('calculates correct performance comparison', () => {
      // Arrange
      const currentPeriod = {
        startDate: new Date('2025-03-01T00:00:00Z'),
        endDate: new Date('2025-03-15T23:59:59Z'),
      };

      const previousPeriod = {
        startDate: new Date('2025-02-01T00:00:00Z'),
        endDate: new Date('2025-02-15T23:59:59Z'),
      };

      // Act
      const comparison = compareOrderPerformance(mockOrders, currentPeriod, previousPeriod);

      // Assert
      // Current period has 4 orders with $350 revenue
      expect(comparison.currentSummary.totalOrders).toBe(4);
      expect(comparison.currentSummary.totalRevenue).toBe(350);

      // Previous period has 1 order with $150 revenue
      expect(comparison.previousSummary.totalOrders).toBe(1);
      expect(comparison.previousSummary.totalRevenue).toBe(150);

      // Calculate expected changes
      const expectedOrdersChange = 3; // 4 - 1
      const expectedOrdersChangePercent = 300; // (3 / 1) * 100

      const expectedRevenueChange = 200; // 350 - 150
      const expectedRevenueChangePercent = (200 / 150) * 100;

      // Check changes
      expect(comparison.changes.ordersChange).toBe(expectedOrdersChange);
      expect(comparison.changes.ordersChangePercent).toBeCloseTo(expectedOrdersChangePercent);
      expect(comparison.changes.revenueChange).toBe(expectedRevenueChange);
      expect(comparison.changes.revenueChangePercent).toBeCloseTo(expectedRevenueChangePercent);
    });

    it('handles comparison with empty previous period', () => {
      // Arrange
      const currentPeriod = {
        startDate: new Date('2025-03-01T00:00:00Z'),
        endDate: new Date('2025-03-15T23:59:59Z'),
      };

      const emptyPeriod = {
        startDate: new Date('2024-03-01T00:00:00Z'),
        endDate: new Date('2024-03-15T23:59:59Z'),
      };

      // Act
      const comparison = compareOrderPerformance(mockOrders, currentPeriod, emptyPeriod);

      // Assert
      expect(comparison.previousSummary.totalOrders).toBe(0);
      expect(comparison.previousSummary.totalRevenue).toBe(0);

      // Changes should be equal to current values (division by zero avoided)
      expect(comparison.changes.ordersChange).toBe(comparison.currentSummary.totalOrders);
      expect(comparison.changes.ordersChangePercent).toBe(0); // No previous orders to compare
      expect(comparison.changes.revenueChange).toBe(comparison.currentSummary.totalRevenue);
      expect(comparison.changes.revenueChangePercent).toBe(0); // No previous revenue to compare
    });
  });
});
