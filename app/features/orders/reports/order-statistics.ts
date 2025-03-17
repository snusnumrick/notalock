/**
 * Order Statistics and Reporting Service
 *
 * Provides functions for generating statistics and reports from order data
 */

import type { Order, OrderStatus } from '../types';
import { formatCurrency } from '~/lib/utils';

/**
 * Time period options for reports
 */
export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

/**
 * Report date range
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Sales summary statistics
 */
export interface SalesSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalItems: number;
  totalShipping: number;
  totalTax: number;
}

/**
 * Status distribution statistics
 */
export interface StatusDistribution {
  status: OrderStatus;
  count: number;
  percentage: number;
}

/**
 * Product sales statistics
 */
export interface ProductSales {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  revenue: number;
  averageUnitPrice: number;
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  date: string;
  orders: number;
  revenue: number;
}

/**
 * Complete order report data
 */
export interface OrderReport {
  period: ReportPeriod;
  dateRange: DateRange;
  summary: SalesSummary;
  statusDistribution: StatusDistribution[];
  topProducts: ProductSales[];
  timeSeries: TimeSeriesDataPoint[];
}

/**
 * Get a predefined date range for a report period
 */
export function getDateRangeForPeriod(
  period: ReportPeriod,
  referenceDate: Date = new Date()
): DateRange {
  const endDate = new Date(referenceDate);
  endDate.setHours(23, 59, 59, 999); // Set to end of day

  const startDate = new Date(endDate);

  switch (period) {
    case 'daily':
      startDate.setHours(0, 0, 0, 0); // Start of same day
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 6); // Last 7 days
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'quarterly':
      startDate.setMonth(startDate.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'yearly':
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      // For custom, we return the reference date as both start and end
      // The caller is expected to override these values
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return { startDate, endDate };
}

/**
 * Filter orders by date range
 */
export function filterOrdersByDateRange(orders: Order[], dateRange: DateRange): Order[] {
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
  });
}

/**
 * Calculate sales summary from orders
 */
export function calculateSalesSummary(orders: Order[]): SalesSummary {
  if (orders.length === 0) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalItems: 0,
      totalShipping: 0,
      totalTax: 0,
    };
  }

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const averageOrderValue = totalRevenue / totalOrders;

  const totalItems = orders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);

  const totalShipping = orders.reduce((sum, order) => sum + order.shippingCost, 0);
  const totalTax = orders.reduce((sum, order) => sum + order.taxAmount, 0);

  return {
    totalOrders,
    totalRevenue,
    averageOrderValue,
    totalItems,
    totalShipping,
    totalTax,
  };
}

/**
 * Calculate status distribution from orders
 */
export function calculateStatusDistribution(orders: Order[]): StatusDistribution[] {
  if (orders.length === 0) {
    return [];
  }

  // Count orders by status
  const statusCounts = orders.reduce(
    (counts, order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
      return counts;
    },
    {} as Record<OrderStatus, number>
  );

  // Convert to array with percentages
  const totalOrders = orders.length;
  return Object.entries(statusCounts).map(([status, count]) => ({
    status: status as OrderStatus,
    count,
    percentage: (count / totalOrders) * 100,
  }));
}

/**
 * Calculate product sales from orders
 */
export function calculateProductSales(orders: Order[]): ProductSales[] {
  if (orders.length === 0) {
    return [];
  }

  // Aggregate product data
  const productMap = new Map<string, ProductSales>();

  orders.forEach(order => {
    order.items.forEach(item => {
      const existing = productMap.get(item.productId);

      if (existing) {
        // Update existing product stats
        existing.quantity += item.quantity;
        if (item.totalPrice) {
          existing.revenue += item.totalPrice;
        }
        // Recalculate average unit price
        existing.averageUnitPrice = existing.revenue / existing.quantity;
      } else {
        // Add new product
        productMap.set(item.productId, {
          productId: item.productId,
          name: item.name,
          sku: item.sku || 'SKU-UNKNOWN',
          quantity: item.quantity,
          revenue: item.totalPrice || 0,
          averageUnitPrice: item.unitPrice || 0,
        });
      }
    });
  });

  // Convert to array and sort by revenue (highest first)
  return Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
}

/**
 * Calculate time series data from orders
 */
export function calculateTimeSeries(
  orders: Order[],
  dateRange: DateRange,
  interval: 'day' | 'week' | 'month' = 'day'
): TimeSeriesDataPoint[] {
  if (orders.length === 0) {
    return [];
  }

  // Group orders by the appropriate date interval
  const getIntervalKey = (date: Date): string => {
    switch (interval) {
      case 'day':
        return date.toISOString().substring(0, 10); // YYYY-MM-DD
      case 'week': {
        // Get the week start date (Sunday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().substring(0, 10);
      }
      case 'month':
        return date.toISOString().substring(0, 7); // YYYY-MM
      default:
        return date.toISOString().substring(0, 10);
    }
  };

  // Create map to store data by interval key
  const dataByInterval = new Map<string, { orders: number; revenue: number }>();

  // Group orders by interval
  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    const key = getIntervalKey(orderDate);

    const existing = dataByInterval.get(key) || { orders: 0, revenue: 0 };
    existing.orders += 1;
    existing.revenue += order.totalAmount;

    dataByInterval.set(key, existing);
  });

  // Generate complete sequence of intervals in the date range
  const result: TimeSeriesDataPoint[] = [];
  const currentDate = new Date(dateRange.startDate);

  while (currentDate <= dateRange.endDate) {
    const key = getIntervalKey(currentDate);
    const data = dataByInterval.get(key) || { orders: 0, revenue: 0 };

    result.push({
      date: key,
      orders: data.orders,
      revenue: data.revenue,
    });

    // Increment date based on interval
    switch (interval) {
      case 'day':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'week':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'month':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return result;
}

/**
 * Generate a complete order report
 */
export function generateOrderReport(
  orders: Order[],
  period: ReportPeriod = 'monthly',
  customDateRange?: DateRange
): OrderReport {
  // Determine date range
  const dateRange = customDateRange || getDateRangeForPeriod(period);

  // Filter orders by date range
  const filteredOrders = filterOrdersByDateRange(orders, dateRange);

  // Calculate various statistics
  const summary = calculateSalesSummary(filteredOrders);
  const statusDistribution = calculateStatusDistribution(filteredOrders);
  const topProducts = calculateProductSales(filteredOrders);

  // Determine appropriate interval for time series
  let interval: 'day' | 'week' | 'month';
  switch (period) {
    case 'daily':
    case 'weekly':
      interval = 'day';
      break;
    case 'monthly':
    case 'quarterly':
      interval = 'week';
      break;
    case 'yearly':
      interval = 'month';
      break;
    default: {
      // For custom ranges, select interval based on date range span
      const daysDiff = Math.ceil(
        (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 31) {
        interval = 'day';
      } else if (daysDiff <= 120) {
        interval = 'week';
      } else {
        interval = 'month';
      }
    }
  }

  const timeSeries = calculateTimeSeries(filteredOrders, dateRange, interval);

  // Return complete report
  return {
    period,
    dateRange,
    summary,
    statusDistribution,
    topProducts,
    timeSeries,
  };
}

/**
 * Format sales summary as a string
 */
export function formatSalesSummary(summary: SalesSummary): string {
  return `
Sales Summary:
--------------
Total Orders: ${summary.totalOrders}
Total Revenue: ${formatCurrency(summary.totalRevenue)}
Average Order Value: ${formatCurrency(summary.averageOrderValue)}
Total Items Sold: ${summary.totalItems}
Total Shipping: ${formatCurrency(summary.totalShipping)}
Total Tax: ${formatCurrency(summary.totalTax)}
`;
}

/**
 * Generate an order performance comparison between two periods
 */
export function compareOrderPerformance(
  orders: Order[],
  currentPeriod: DateRange,
  previousPeriod: DateRange
): {
  currentSummary: SalesSummary;
  previousSummary: SalesSummary;
  changes: {
    ordersChange: number;
    ordersChangePercent: number;
    revenueChange: number;
    revenueChangePercent: number;
    aovChange: number;
    aovChangePercent: number;
  };
} {
  // Filter orders for each period
  const currentOrders = filterOrdersByDateRange(orders, currentPeriod);
  const previousOrders = filterOrdersByDateRange(orders, previousPeriod);

  // Calculate summaries
  const currentSummary = calculateSalesSummary(currentOrders);
  const previousSummary = calculateSalesSummary(previousOrders);

  // Calculate changes
  const ordersChange = currentSummary.totalOrders - previousSummary.totalOrders;
  const ordersChangePercent = previousSummary.totalOrders
    ? (ordersChange / previousSummary.totalOrders) * 100
    : 0;

  const revenueChange = currentSummary.totalRevenue - previousSummary.totalRevenue;
  const revenueChangePercent = previousSummary.totalRevenue
    ? (revenueChange / previousSummary.totalRevenue) * 100
    : 0;

  const aovChange = currentSummary.averageOrderValue - previousSummary.averageOrderValue;
  const aovChangePercent = previousSummary.averageOrderValue
    ? (aovChange / previousSummary.averageOrderValue) * 100
    : 0;

  return {
    currentSummary,
    previousSummary,
    changes: {
      ordersChange,
      ordersChangePercent,
      revenueChange,
      revenueChangePercent,
      aovChange,
      aovChangePercent,
    },
  };
}
