/**
 * Order Exporter Utility
 *
 * Exports orders to various formats (CSV, JSON, Excel)
 */

import type { Order } from '../types';
import { formatDate } from '~/lib/utils';

/**
 * Available export formats
 */
export type ExportFormat = 'csv' | 'json' | 'excel';

/**
 * Export options interface
 */
export interface OrderExportOptions {
  format: ExportFormat;
  includeItems?: boolean;
  includeAddresses?: boolean;
  includePaymentInfo?: boolean;
  includeStatusHistory?: boolean;
  dateFormat?: string;
  fileName?: string;
}

/**
 * Default export options
 */
const DEFAULT_OPTIONS: OrderExportOptions = {
  format: 'csv',
  includeItems: true,
  includeAddresses: true,
  includePaymentInfo: true,
  includeStatusHistory: false,
  dateFormat: 'yyyy-MM-dd HH:mm:ss',
  fileName: 'orders-export',
};

/**
 * Export a single order to the specified format
 */
export function exportOrder(
  order: Order,
  options: Partial<OrderExportOptions> = {}
): string | Buffer {
  if (!order) {
    throw new Error('Order cannot be null or undefined');
  }

  try {
    // Merge with default options
    const mergedOptions: OrderExportOptions = { ...DEFAULT_OPTIONS, ...options };
    console.log('exportOrder called with format:', mergedOptions.format);

    // For JSON format, use direct JSON exporter for maximum reliability
    if (mergedOptions.format === 'json') {
      return exportOrderDirectToJson(order, mergedOptions);
    }

    switch (mergedOptions.format) {
      case 'csv':
        return exportOrderToCsv(order, mergedOptions);
      case 'excel':
        return exportOrderToExcel(order, mergedOptions);
      default:
        throw new Error(`Unsupported export format: ${mergedOptions.format}`);
    }
  } catch (error) {
    console.error('Error in exportOrder:', error);
    console.error('Order:', order ? `ID: ${order.id}, Type: ${typeof order}` : 'null');
    console.error('Options:', options);
    throw new Error(
      `Failed to export order: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Export multiple orders to the specified format
 */
export function exportOrders(
  orders: Order[],
  options: Partial<OrderExportOptions> = {}
): string | Buffer {
  if (!orders || !Array.isArray(orders)) {
    throw new Error('Orders must be a valid array');
  }

  try {
    // Merge with default options
    const mergedOptions: OrderExportOptions = { ...DEFAULT_OPTIONS, ...options };

    switch (mergedOptions.format) {
      case 'csv':
        return exportOrdersToCsv(orders, mergedOptions);
      case 'json':
        return exportOrdersToJson(orders, mergedOptions);
      case 'excel':
        return exportOrdersToExcel(orders, mergedOptions);
      default:
        throw new Error(`Unsupported export format: ${mergedOptions.format}`);
    }
  } catch (error) {
    console.error('Error in exportOrders:', error);
    console.error('Orders count:', orders ? orders.length : 'null');
    console.error('Options:', options);
    throw new Error(
      `Failed to export orders: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Export an order directly to JSON
 * This is a simpler, focused implementation for the JSON export case
 */
export function exportOrderDirectToJson(
  order: Order,
  options: Partial<OrderExportOptions> = { includeStatusHistory: true }
): string {
  if (!order) {
    throw new Error('Order cannot be null or undefined');
  }

  try {
    // Merge with default options
    const mergedOptions: OrderExportOptions = { ...DEFAULT_OPTIONS, ...options };

    // Create a clean copy with all fields
    const cleanOrder: Record<string, string | number | boolean | object | undefined> = {
      id: order.id,
      orderNumber: order.orderNumber,
      email: order.email,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      subtotalAmount: order.subtotalAmount,
      taxAmount: order.taxAmount,
      shippingCost: order.shippingCost,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      notes: order.notes,
    };

    // Include items based on options
    if (mergedOptions.includeItems !== false && order.items && Array.isArray(order.items)) {
      cleanOrder.items = order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        sku: item.sku,
        orderId: item.orderId,
      }));
    }

    // Include addresses based on options
    if (mergedOptions.includeAddresses !== false) {
      if (order.shippingAddress) {
        cleanOrder.shippingAddress = { ...order.shippingAddress };
      }

      if (order.billingAddress) {
        cleanOrder.billingAddress = { ...order.billingAddress };
      }
    }

    // Include payment info based on options
    if (mergedOptions.includePaymentInfo !== false) {
      if (order.paymentIntentId) cleanOrder.paymentIntentId = order.paymentIntentId;
      if (order.paymentMethodId) cleanOrder.paymentMethodId = order.paymentMethodId;
      if (order.paymentProvider) cleanOrder.paymentProvider = order.paymentProvider;
    }

    // Include status history based on options
    if (
      mergedOptions.includeStatusHistory !== false &&
      order.statusHistory &&
      Array.isArray(order.statusHistory)
    ) {
      cleanOrder.statusHistory = order.statusHistory.map(history => ({
        id: history.id,
        orderId: history.orderId,
        status: history.status,
        notes: history.notes,
        createdAt: history.createdAt,
      }));
    }

    // Include other relevant fields
    if (order.userId) cleanOrder.userId = order.userId;
    if (order.shippingMethod) cleanOrder.shippingMethod = order.shippingMethod;
    if (order.checkoutSessionId) cleanOrder.checkoutSessionId = order.checkoutSessionId;
    if (order.cartId) cleanOrder.cartId = order.cartId;

    // Simple JSON stringification without risking circular references
    return JSON.stringify(cleanOrder, null, 2);
  } catch (error) {
    console.error('Error in exportOrderDirectToJson:', error);
    throw new Error(
      `Failed to export order to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Export a single order to CSV format
 */
function exportOrderToCsv(order: Order, options: OrderExportOptions): string {
  if (!order) {
    throw new Error('Order cannot be null or undefined');
  }
  // For a single order, we'll create a CSV with two sections:
  // 1. Order header data
  // 2. Order items (if includeItems is true)

  // Start with the header row and data for the order
  let csv =
    'Order ID,Order Number,Customer Email,Status,Payment Status,Subtotal,Shipping,Tax,Total,Created Date\n';

  // Add the order row
  csv += `${order.id},${order.orderNumber},${order.email},${order.status},${order.paymentStatus},`;
  csv += `${order.subtotalAmount},${order.shippingCost},${order.taxAmount},${order.totalAmount},`;
  csv += `${formatDate(order.createdAt, options.dateFormat)}\n\n`;

  // Add shipping and billing address if requested
  if (options.includeAddresses) {
    csv += 'SHIPPING ADDRESS\n';
    if (order.shippingAddress) {
      csv += `Name,${order.shippingAddress.firstName} ${order.shippingAddress.lastName}\n`;
      csv += `Address,${order.shippingAddress.address1}\n`;
      if (order.shippingAddress.address2) {
        csv += `Address 2,${order.shippingAddress.address2}\n`;
      }
      csv += `City,${order.shippingAddress.city}\n`;
      csv += `State,${order.shippingAddress.state}\n`;
      csv += `Postal Code,${order.shippingAddress.postalCode}\n`;
      csv += `Country,${order.shippingAddress.country}\n`;
      if (order.shippingAddress.phone) {
        csv += `Phone,${order.shippingAddress.phone}\n`;
      }
    } else {
      csv += 'No shipping address provided\n';
    }

    csv += '\nBILLING ADDRESS\n';
    if (order.billingAddress) {
      csv += `Name,${order.billingAddress.firstName} ${order.billingAddress.lastName}\n`;
      csv += `Address,${order.billingAddress.address1}\n`;
      if (order.billingAddress.address2) {
        csv += `Address 2,${order.billingAddress.address2}\n`;
      }
      csv += `City,${order.billingAddress.city}\n`;
      csv += `State,${order.billingAddress.state}\n`;
      csv += `Postal Code,${order.billingAddress.postalCode}\n`;
      csv += `Country,${order.billingAddress.country}\n`;
      if (order.billingAddress.phone) {
        csv += `Phone,${order.billingAddress.phone}\n`;
      }
    } else {
      csv += 'No billing address provided\n';
    }

    csv += '\n';
  }

  // Add payment info if requested
  if (options.includePaymentInfo && (order.paymentIntentId || order.paymentMethodId)) {
    csv += 'PAYMENT INFORMATION\n';
    if (order.paymentIntentId) {
      csv += `Payment Intent ID,${order.paymentIntentId}\n`;
    }
    if (order.paymentMethodId) {
      csv += `Payment Method ID,${order.paymentMethodId}\n`;
    }
    if (order.paymentProvider) {
      csv += `Payment Provider,${order.paymentProvider}\n`;
    }
    csv += '\n';
  }

  // Add order items if requested
  if (options.includeItems && order.items.length > 0) {
    csv += 'ORDER ITEMS\n';
    csv += 'Item ID,Product ID,SKU,Name,Quantity,Unit Price,Total Price\n';

    order.items.forEach(item => {
      csv += `${item.id},${item.productId},${item.sku},${item.name},${item.quantity},${item.unitPrice},${item.totalPrice}\n`;
    });

    csv += '\n';
  }

  // Add status history if requested
  if (options.includeStatusHistory && order.statusHistory && order.statusHistory.length > 0) {
    csv += 'STATUS HISTORY\n';
    csv += 'Date,Status,Notes\n';

    order.statusHistory.forEach(history => {
      // Use date or createdAt (or fallback to current date)
      const dateToUse = history.createdAt || new Date().toISOString();
      const notesToUse = history.notes || '';
      csv += `${formatDate(dateToUse, options.dateFormat)},${history.status},${notesToUse}\n`;
    });
  }

  return csv;
}

/**
 * Export multiple orders to CSV format
 */
function exportOrdersToCsv(orders: Order[], options: OrderExportOptions): string {
  if (!orders || !Array.isArray(orders)) {
    throw new Error('Orders must be a valid array');
  }
  // For multiple orders, we'll create a more tabular format
  // with one row per order and optionally additional rows for items

  // Start with the header row for orders
  let csv =
    'Order ID,Order Number,Customer Email,Status,Payment Status,Subtotal,Shipping,Tax,Total,Created Date';

  // Add address fields if requested
  if (options.includeAddresses) {
    csv +=
      ',Shipping Name,Shipping Address,Shipping City,Shipping State,Shipping Postal Code,Shipping Country';
    csv +=
      ',Billing Name,Billing Address,Billing City,Billing State,Billing Postal Code,Billing Country';
  }

  // Add payment fields if requested
  if (options.includePaymentInfo) {
    csv += ',Payment Intent ID,Payment Method ID,Payment Provider';
  }

  csv += '\n';

  // Add a row for each order
  orders.forEach(order => {
    csv += `${order.id},${order.orderNumber},${order.email},${order.status},${order.paymentStatus},`;
    csv += `${order.subtotalAmount},${order.shippingCost},${order.taxAmount},${order.totalAmount},`;
    csv += `${formatDate(order.createdAt, options.dateFormat)}`;

    // Add address fields if requested
    if (options.includeAddresses) {
      if (order.shippingAddress) {
        csv += `,${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`;
        csv += `,${order.shippingAddress.address1}${order.shippingAddress.address2 ? ', ' + order.shippingAddress.address2 : ''}`;
        csv += `,${order.shippingAddress.city}`;
        csv += `,${order.shippingAddress.state}`;
        csv += `,${order.shippingAddress.postalCode}`;
        csv += `,${order.shippingAddress.country}`;
      } else {
        csv += ',,,,,';
      }

      if (order.billingAddress) {
        csv += `,${order.billingAddress.firstName} ${order.billingAddress.lastName}`;
        csv += `,${order.billingAddress.address1}${order.billingAddress.address2 ? ', ' + order.billingAddress.address2 : ''}`;
        csv += `,${order.billingAddress.city}`;
        csv += `,${order.billingAddress.state}`;
        csv += `,${order.billingAddress.postalCode}`;
        csv += `,${order.billingAddress.country}`;
      } else {
        csv += ',,,,,';
      }
    }

    // Add payment fields if requested
    if (options.includePaymentInfo) {
      csv += `,${order.paymentIntentId || ''}`;
      csv += `,${order.paymentMethodId || ''}`;
      csv += `,${order.paymentProvider || ''}`;
    }

    csv += '\n';
  });

  // If items are requested, add them in a separate section
  if (options.includeItems) {
    csv += '\nORDER ITEMS\n';
    csv += 'Order ID,Order Number,Item ID,Product ID,SKU,Name,Quantity,Unit Price,Total Price\n';

    orders.forEach(order => {
      order.items.forEach(item => {
        csv += `${order.id},${order.orderNumber},${item.id},${item.productId},${item.sku},${item.name},${item.quantity},${item.unitPrice},${item.totalPrice}\n`;
      });
    });
  }

  return csv;
}

/**
 * Export a single order to JSON format
 */
function exportOrderToJson(order: Order, options: OrderExportOptions): string {
  if (!order) {
    throw new Error('Order cannot be null or undefined');
  }

  try {
    console.log('exportOrderToJson called with format:', options.format);
    console.log('includeStatusHistory option:', options.includeStatusHistory);

    // Create a clean copy without potential circular references
    const cleanOrder: Record<string, unknown> = {
      id: order.id,
      orderNumber: order.orderNumber,
      email: order.email,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      subtotalAmount: order.subtotalAmount,
      taxAmount: order.taxAmount,
      shippingCost: order.shippingCost,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    // Include additional fields based on options
    if (options.includeItems !== false && order.items && Array.isArray(order.items)) {
      cleanOrder.items = order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        sku: item.sku,
        orderId: item.orderId,
      }));
    }

    if (options.includeAddresses !== false) {
      if (order.shippingAddress) {
        cleanOrder.shippingAddress = { ...order.shippingAddress };
      }

      if (order.billingAddress) {
        cleanOrder.billingAddress = { ...order.billingAddress };
      }
    }

    if (options.includePaymentInfo !== false) {
      if (order.paymentIntentId) cleanOrder.paymentIntentId = order.paymentIntentId;
      if (order.paymentMethodId) cleanOrder.paymentMethodId = order.paymentMethodId;
      if (order.paymentProvider) cleanOrder.paymentProvider = order.paymentProvider;
    }

    // For JSON format, include status history by default unless explicitly disabled
    if (
      (options.format === 'json'
        ? options.includeStatusHistory !== false
        : options.includeStatusHistory === true) &&
      order.statusHistory &&
      Array.isArray(order.statusHistory)
    ) {
      cleanOrder.statusHistory = order.statusHistory.map(history => ({
        id: history.id,
        orderId: history.orderId,
        status: history.status,
        notes: history.notes,
        createdAt: history.createdAt,
      }));
    }

    // Simple JSON stringification without risking circular references
    return JSON.stringify(cleanOrder, null, 2);
  } catch (error) {
    console.error('Error processing order for JSON export:', error);
    console.error('Order type:', typeof order);
    console.error('Order ID:', order.id);
    throw new Error(
      `Failed to export order to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Export multiple orders to JSON format
 */
function exportOrdersToJson(orders: Order[], options: OrderExportOptions): string {
  if (!orders || !Array.isArray(orders)) {
    throw new Error('Orders must be a valid array');
  }

  try {
    // Process each order into a clean format without circular references
    const cleanOrders = orders.map(order => {
      if (!order) {
        throw new Error('Order in the array cannot be null or undefined');
      }

      // Create a clean object for each order
      const cleanOrder: Record<string, unknown> = {
        id: order.id,
        orderNumber: order.orderNumber,
        email: order.email,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        subtotalAmount: order.subtotalAmount,
        taxAmount: order.taxAmount,
        shippingCost: order.shippingCost,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };

      // Include additional fields based on options
      if (options.includeItems !== false && order.items && Array.isArray(order.items)) {
        cleanOrder.items = order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          sku: item.sku,
          orderId: item.orderId,
        }));
      }

      if (options.includeAddresses !== false) {
        if (order.shippingAddress) {
          cleanOrder.shippingAddress = { ...order.shippingAddress };
        }

        if (order.billingAddress) {
          cleanOrder.billingAddress = { ...order.billingAddress };
        }
      }

      if (options.includePaymentInfo !== false) {
        if (order.paymentIntentId) cleanOrder.paymentIntentId = order.paymentIntentId;
        if (order.paymentMethodId) cleanOrder.paymentMethodId = order.paymentMethodId;
        if (order.paymentProvider) cleanOrder.paymentProvider = order.paymentProvider;
      }

      // For JSON format, include status history by default unless explicitly disabled
      if (
        (options.format === 'json'
          ? options.includeStatusHistory !== false
          : options.includeStatusHistory === true) &&
        order.statusHistory &&
        Array.isArray(order.statusHistory)
      ) {
        cleanOrder.statusHistory = order.statusHistory.map(history => ({
          id: history.id,
          orderId: history.orderId,
          status: history.status,
          notes: history.notes,
          createdAt: history.createdAt,
        }));
      }

      return cleanOrder;
    });

    // Simple JSON stringification
    return JSON.stringify(cleanOrders, null, 2);
  } catch (error) {
    console.error('Error processing orders for JSON export:', error);
    console.error('Orders type:', typeof orders);
    console.error('Orders length:', orders ? orders.length : 'null');
    throw new Error(
      `Failed to export orders to JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Export a single order to Excel format
 * Note: In a real implementation, this would use a library like ExcelJS
 */
function exportOrderToExcel(order: Order, options: OrderExportOptions): Buffer {
  if (!order) {
    throw new Error('Order cannot be null or undefined');
  }

  try {
    // This is a placeholder. In a real implementation, you would:
    // 1. Create an Excel workbook with ExcelJS
    // 2. Add worksheets for the order and items
    // 3. Format them nicely
    // 4. Return the workbook as a buffer

    // For simplicity in this example, we'll just convert to JSON and return as buffer
    const json = exportOrderToJson(order, options);
    return Buffer.from(`Excel format not implemented. JSON data:\n${json}`);
  } catch (error) {
    console.error('Error creating Excel export for order:', error);
    return Buffer.from(
      `Error creating Excel export: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Export multiple orders to Excel format
 * Note: In a real implementation, this would use a library like ExcelJS
 */
function exportOrdersToExcel(orders: Order[], options: OrderExportOptions): Buffer {
  if (!orders || !Array.isArray(orders)) {
    throw new Error('Orders must be a valid array');
  }

  try {
    // This is a placeholder. In a real implementation, you would:
    // 1. Create an Excel workbook with ExcelJS
    // 2. Add worksheets for orders and items
    // 3. Format them nicely
    // 4. Return the workbook as a buffer

    // For simplicity in this example, we'll just convert to JSON and return as buffer
    const json = exportOrdersToJson(orders, options);
    return Buffer.from(`Excel format not implemented. JSON data:\n${json}`);
  } catch (error) {
    console.error('Error creating Excel export for orders:', error);
    return Buffer.from(
      `Error creating Excel export: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
