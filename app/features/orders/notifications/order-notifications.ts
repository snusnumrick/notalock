/**
 * Order Notification Service
 *
 * Handles notifications for order events like creation, status changes, etc.
 */

import type { Order, OrderStatus } from '../types';

/**
 * Notification template types
 */
export type NotificationTemplateType =
  | 'order_created'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_canceled'
  | 'payment_received'
  | 'payment_failed'
  | 'payment_refunded'
  | 'shipping_update';

/**
 * Email notification data interface
 */
export interface OrderEmailData {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  subject: string;
  templateType: NotificationTemplateType;
  data: Record<string, unknown>;
}

/**
 * SMS notification data interface
 */
export interface OrderSmsData {
  phoneNumber: string;
  message: string;
  templateType: NotificationTemplateType;
  data: Record<string, unknown>;
}

/**
 * Send email notification for an order event
 */
export async function sendOrderEmail(emailData: OrderEmailData): Promise<boolean> {
  try {
    console.log(
      `Sending ${emailData.templateType} email to ${emailData.customerEmail} for order ${emailData.orderNumber}`
    );

    // In a real implementation, this would connect to an email service
    // such as SendGrid, Amazon SES, etc.

    // For now, just log the email data
    console.log('Email data:', emailData);

    // Simulate successful email sending
    return true;
  } catch (error) {
    console.error('Error sending order email:', error);
    return false;
  }
}

/**
 * Send SMS notification for an order event
 */
export async function sendOrderSms(smsData: OrderSmsData): Promise<boolean> {
  try {
    console.log(`Sending ${smsData.templateType} SMS to ${smsData.phoneNumber}`);

    // In a real implementation, this would connect to an SMS service
    // such as Twilio, Nexmo, etc.

    // For now, just log the SMS data
    console.log('SMS data:', smsData);

    // Simulate successful SMS sending
    return true;
  } catch (error) {
    console.error('Error sending order SMS:', error);
    return false;
  }
}

/**
 * Generate email data for order status notification
 */
export function generateOrderStatusEmailData(
  order: Order,
  newStatus: OrderStatus,
  oldStatus?: OrderStatus
): OrderEmailData {
  // Determine the template type based on the new status
  let templateType: NotificationTemplateType;
  let subject: string;

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
}

/**
 * Generate SMS data for order status notification
 */
export function generateOrderStatusSmsData(
  order: Order,
  newStatus: OrderStatus
): OrderSmsData | null {
  // Only send SMS if we have a phone number
  if (!order.shippingAddress?.phone) {
    return null;
  }

  // Determine the template type and message based on the new status
  let templateType: NotificationTemplateType;
  let message: string;

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
}

/**
 * Handle order status change notifications
 */
export async function handleOrderStatusChangeNotifications(
  order: Order,
  newStatus: OrderStatus,
  oldStatus: OrderStatus
): Promise<void> {
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
