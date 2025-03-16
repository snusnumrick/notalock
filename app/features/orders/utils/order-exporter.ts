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
  // Merge with default options
  const mergedOptions: OrderExportOptions = { ...DEFAULT_OPTIONS, ...options };

  switch (mergedOptions.format) {
    case 'csv':
      return exportOrderToCsv(order, mergedOptions);
    case 'json':
      return exportOrderToJson(order, mergedOptions);
    case 'excel':
      return exportOrderToExcel(order, mergedOptions);
    default:
      throw new Error(`Unsupported export format: ${mergedOptions.format}`);
  }
}

/**
 * Export multiple orders to the specified format
 */
export function exportOrders(
  orders: Order[],
  options: Partial<OrderExportOptions> = {}
): string | Buffer {
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
}

/**
 * Export a single order to CSV format
 */
function exportOrderToCsv(order: Order, options: OrderExportOptions): string {
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
      csv += `${formatDate(history.createdAt, options.dateFormat)},${history.status},${history.notes || ''}\n`;
    });
  }

  return csv;
}

/**
 * Export multiple orders to CSV format
 */
function exportOrdersToCsv(orders: Order[], options: OrderExportOptions): string {
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
  // Create a copy of the order to modify
  const exportOrder = { ...order };

  // Remove sections if not requested
  if (!options.includeItems) {
    exportOrder.items = [];
  }

  if (!options.includeAddresses) {
    delete exportOrder.shippingAddress;
    delete exportOrder.billingAddress;
  }

  if (!options.includePaymentInfo) {
    delete exportOrder.paymentIntentId;
    delete exportOrder.paymentMethodId;
    delete exportOrder.paymentProvider;
  }

  if (!options.includeStatusHistory) {
    delete exportOrder.statusHistory;
  }

  // Return formatted JSON
  return JSON.stringify(exportOrder, null, 2);
}

/**
 * Export multiple orders to JSON format
 */
function exportOrdersToJson(orders: Order[], options: OrderExportOptions): string {
  // Process each order according to the options
  const exportOrders = orders.map(order => {
    const exportOrder = { ...order };

    // Remove sections if not requested
    if (!options.includeItems) {
      exportOrder.items = [];
    }

    if (!options.includeAddresses) {
      delete exportOrder.shippingAddress;
      delete exportOrder.billingAddress;
    }

    if (!options.includePaymentInfo) {
      delete exportOrder.paymentIntentId;
      delete exportOrder.paymentMethodId;
      delete exportOrder.paymentProvider;
    }

    if (!options.includeStatusHistory) {
      delete exportOrder.statusHistory;
    }

    return exportOrder;
  });

  // Return formatted JSON
  return JSON.stringify(exportOrders, null, 2);
}

/**
 * Export a single order to Excel format
 * Note: In a real implementation, this would use a library like ExcelJS
 */
function exportOrderToExcel(order: Order, options: OrderExportOptions): Buffer {
  // This is a placeholder. In a real implementation, you would:
  // 1. Create an Excel workbook with ExcelJS
  // 2. Add worksheets for the order and items
  // 3. Format them nicely
  // 4. Return the workbook as a buffer

  // For simplicity in this example, we'll just convert to JSON and return as buffer
  const json = exportOrderToJson(order, options);
  return Buffer.from(`Excel format not implemented. JSON data:\n${json}`);
}

/**
 * Export multiple orders to Excel format
 * Note: In a real implementation, this would use a library like ExcelJS
 */
function exportOrdersToExcel(orders: Order[], options: OrderExportOptions): Buffer {
  // This is a placeholder. In a real implementation, you would:
  // 1. Create an Excel workbook with ExcelJS
  // 2. Add worksheets for orders and items
  // 3. Format them nicely
  // 4. Return the workbook as a buffer

  // For simplicity in this example, we'll just convert to JSON and return as buffer
  const json = exportOrdersToJson(orders, options);
  return Buffer.from(`Excel format not implemented. JSON data:\n${json}`);
}
