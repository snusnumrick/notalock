import type { PaymentResult } from '../types';
import type { Order } from '~/features/orders/types';

/**
 * Payment receipt template data
 */
export interface ReceiptData {
  receiptNumber: string;
  paymentId: string;
  paymentDate: string;
  paymentMethod: string;
  paymentProvider: string;
  customerName?: string;
  customerEmail?: string;
  billingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  orderReference?: string;
  orderStatus?: string;
  storeInfo: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
    logoUrl?: string;
  };
}

/**
 * Receipt generator service for creating and formatting payment receipts
 */
export class ReceiptGenerator {
  /**
   * Generate a receipt from payment and order data
   */
  static generateReceiptData(payment: PaymentResult, order: Order): ReceiptData {
    // Generate a receipt number based on payment ID
    const receiptNumber = `R-${payment.paymentId?.slice(-8).toUpperCase() || 'UNKNOWN'}`;

    // Extract payment provider from provider data
    const paymentProvider = payment.providerData?.provider?.toUpperCase() || 'UNKNOWN';

    // Format payment date
    const paymentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Map payment method type to display name
    const paymentMethodMap: Record<string, string> = {
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      paypal: 'PayPal',
      apple_pay: 'Apple Pay',
      google_pay: 'Google Pay',
    };

    const paymentMethod =
      paymentMethodMap[payment.providerData?.paymentMethodType || ''] || 'Credit Card';

    // Map order items
    const items = order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
    }));

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const shipping = order.shippingCost || 0;
    const tax = order.taxAmount || 0;
    const total = subtotal + shipping + tax;

    // Create receipt data
    return {
      receiptNumber,
      paymentId: payment.paymentId || 'UNKNOWN',
      paymentDate,
      paymentMethod,
      paymentProvider,
      customerName: order.customer?.name,
      customerEmail: order.customer?.email,
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      items,
      subtotal,
      shipping,
      tax,
      total,
      currency: order.currency || 'USD',
      orderReference: order.reference,
      orderStatus: order.status,
      storeInfo: {
        name: 'Notalock - European Door Hardware',
        address: '123 Main Street, Amsterdam, Netherlands',
        phone: '+31 20 123 4567',
        email: 'support@notalock.com',
        website: 'https://notalock.com',
      },
    };
  }

  /**
   * Generate HTML receipt content from receipt data
   */
  static generateHtmlReceipt(data: ReceiptData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Receipt #${data.receiptNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .receipt {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #eee;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .info-box {
            width: 48%;
          }
          .info-box h3 {
            margin-top: 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          th {
            background-color: #f8f8f8;
          }
          .item-table th:last-child,
          .item-table td:last-child,
          .total-table td:last-child {
            text-align: right;
          }
          .total-table {
            width: 300px;
            margin-left: auto;
          }
          .total-table td {
            padding: 5px 10px;
          }
          .total-table tr:last-child {
            font-weight: bold;
            font-size: 1.1em;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #777;
            font-size: 0.9em;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>Payment Receipt</h1>
            <p>Receipt #: ${data.receiptNumber}</p>
            <p>Date: ${data.paymentDate}</p>
          </div>
          
          <div class="info-section">
            <div class="info-box">
              <h3>Payment Information</h3>
              <p>Payment ID: ${data.paymentId}</p>
              <p>Payment Method: ${data.paymentMethod}</p>
              <p>Payment Provider: ${data.paymentProvider}</p>
              ${data.orderReference ? `<p>Order Reference: ${data.orderReference}</p>` : ''}
            </div>
            
            <div class="info-box">
              <h3>Customer Information</h3>
              ${data.customerName ? `<p>Name: ${data.customerName}</p>` : ''}
              ${data.customerEmail ? `<p>Email: ${data.customerEmail}</p>` : ''}
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-box">
              <h3>Billing Address</h3>
              ${
                data.billingAddress
                  ? `
                <p>${data.billingAddress.line1 || ''}</p>
                ${data.billingAddress.line2 ? `<p>${data.billingAddress.line2}</p>` : ''}
                <p>${data.billingAddress.city || ''}, ${data.billingAddress.state || ''} ${data.billingAddress.postalCode || ''}</p>
                <p>${data.billingAddress.country || ''}</p>
              `
                  : '<p>Not provided</p>'
              }
            </div>
            
            <div class="info-box">
              <h3>Shipping Address</h3>
              ${
                data.shippingAddress
                  ? `
                <p>${data.shippingAddress.line1 || ''}</p>
                ${data.shippingAddress.line2 ? `<p>${data.shippingAddress.line2}</p>` : ''}
                <p>${data.shippingAddress.city || ''}, ${data.shippingAddress.state || ''} ${data.shippingAddress.postalCode || ''}</p>
                <p>${data.shippingAddress.country || ''}</p>
              `
                  : '<p>Not provided</p>'
              }
            </div>
          </div>
          
          <h3>Order Details</h3>
          <table class="item-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items
                .map(
                  item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${data.currency} ${item.price.toFixed(2)}</td>
                  <td>${data.currency} ${item.total.toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          
          <table class="total-table">
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td>${data.currency} ${data.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Shipping:</td>
                <td>${data.currency} ${data.shipping.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Tax:</td>
                <td>${data.currency} ${data.tax.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Total:</td>
                <td>${data.currency} ${data.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>
              <strong>${data.storeInfo.name}</strong><br>
              ${data.storeInfo.address}<br>
              ${data.storeInfo.phone ? `Phone: ${data.storeInfo.phone}<br>` : ''}
              ${data.storeInfo.email ? `Email: ${data.storeInfo.email}<br>` : ''}
              ${data.storeInfo.website ? `Website: ${data.storeInfo.website}` : ''}
            </p>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate a PDF receipt from receipt data
   * This would typically use a PDF generation library
   */
  static async generatePdfReceipt(data: ReceiptData): Promise<Buffer> {
    // In a real implementation, we would use a PDF generation library
    // For now, we'll just simulate PDF generation

    // Convert HTML receipt to PDF
    const htmlReceipt = this.generateHtmlReceipt(data);

    // This is a placeholder - in a real implementation, we'd use a library like puppeteer,
    // jsPDF, or similar to generate an actual PDF
    console.log('Generating PDF receipt for payment:', data.paymentId);

    // Return a dummy buffer (in a real implementation, this would be the PDF content)
    return Buffer.from(htmlReceipt);
  }
}
