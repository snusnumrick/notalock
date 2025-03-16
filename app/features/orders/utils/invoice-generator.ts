/**
 * Invoice Generator Utility
 *
 * Generates PDF invoices for orders
 */

import type { Order } from '../types';
import { formatDate, formatCurrency } from '~/lib/utils';

/**
 * Options for invoice generation
 */
export interface InvoiceOptions {
  includeCompanyLogo?: boolean;
  includeTaxId?: boolean;
  includeBillingAddress?: boolean;
  includeShippingAddress?: boolean;
  includePaymentInfo?: boolean;
  includeOrderNotes?: boolean;
  includeFooter?: boolean;
}

/**
 * Generate HTML for an order invoice
 */
export function generateInvoiceHtml(order: Order, options: InvoiceOptions = {}): string {
  // Set default options
  const defaultOptions: InvoiceOptions = {
    includeCompanyLogo: true,
    includeTaxId: true,
    includeBillingAddress: true,
    includeShippingAddress: true,
    includePaymentInfo: true,
    includeOrderNotes: true,
    includeFooter: true,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Get company information from environment or config
  const companyName = process.env.COMPANY_NAME || 'Notalock Commerce';
  const companyAddress = process.env.COMPANY_ADDRESS || '123 Main Street, City, Country';
  const companyTaxId = process.env.COMPANY_TAX_ID || 'TAX-ID-123456';
  const companyLogo = process.env.COMPANY_LOGO_URL || '/images/logo.png';

  // Format billing and shipping addresses
  const billingAddress = order.billingAddress
    ? `${order.billingAddress.firstName} ${order.billingAddress.lastName}<br>
    ${order.billingAddress.address1}<br>
    ${order.billingAddress.address2 ? order.billingAddress.address2 + '<br>' : ''}
    ${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.postalCode}<br>
    ${order.billingAddress.country}`
    : 'Not provided';

  const shippingAddress = order.shippingAddress
    ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
    ${order.shippingAddress.address1}<br>
    ${order.shippingAddress.address2 ? order.shippingAddress.address2 + '<br>' : ''}
    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
    ${order.shippingAddress.country}`
    : 'Not provided';

  // Generate line items HTML
  const lineItemsHtml = order.items
    .map(
      item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.sku}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.unitPrice)}</td>
      <td>${formatCurrency(item.totalPrice)}</td>
    </tr>
  `
    )
    .join('');

  // Generate the complete HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice #${order.orderNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .logo {
          max-width: 200px;
          max-height: 80px;
        }
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .invoice-number {
          font-size: 16px;
          color: #666;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .address-container {
          display: flex;
          justify-content: space-between;
        }
        .address {
          width: 48%;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #f2f2f2;
          text-align: left;
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        .summary {
          float: right;
          width: 300px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        .summary-row.total {
          font-weight: bold;
          font-size: 18px;
          border-top: 2px solid #333;
          padding-top: 10px;
        }
        .notes {
          margin-top: 40px;
          padding: 10px;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
        }
        .footer {
          margin-top: 40px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <div>
          ${mergedOptions.includeCompanyLogo ? `<img src="${companyLogo}" alt="${companyName}" class="logo">` : ''}
          <div>${companyName}</div>
          <div>${companyAddress}</div>
          ${mergedOptions.includeTaxId ? `<div>Tax ID: ${companyTaxId}</div>` : ''}
        </div>
        <div>
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-number">Invoice #${order.orderNumber}</div>
          <div>Date: ${formatDate(order.createdAt)}</div>
          ${order.paymentStatus ? `<div>Payment Status: ${order.paymentStatus.toUpperCase()}</div>` : ''}
        </div>
      </div>
      
      <div class="section">
        <div class="address-container">
          ${
            mergedOptions.includeBillingAddress
              ? `
            <div class="address">
              <div class="section-title">Bill To:</div>
              <div>${billingAddress}</div>
              <div>Email: ${order.email}</div>
            </div>
          `
              : ''
          }
          
          ${
            mergedOptions.includeShippingAddress
              ? `
            <div class="address">
              <div class="section-title">Ship To:</div>
              <div>${shippingAddress}</div>
            </div>
          `
              : ''
          }
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Order Details</div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
        </table>
      </div>
      
      <div class="summary">
        <div class="summary-row">
          <div>Subtotal:</div>
          <div>${formatCurrency(order.subtotalAmount)}</div>
        </div>
        <div class="summary-row">
          <div>Shipping:</div>
          <div>${formatCurrency(order.shippingCost)}</div>
        </div>
        <div class="summary-row">
          <div>Tax:</div>
          <div>${formatCurrency(order.taxAmount)}</div>
        </div>
        <div class="summary-row total">
          <div>Total:</div>
          <div>${formatCurrency(order.totalAmount)}</div>
        </div>
      </div>
      
      <div style="clear: both;"></div>
      
      ${
        mergedOptions.includePaymentInfo && order.paymentMethodId
          ? `
        <div class="section">
          <div class="section-title">Payment Information</div>
          <div>Payment Method: ${order.paymentProvider || 'Credit Card'}</div>
          <div>Payment ID: ${order.paymentIntentId || 'N/A'}</div>
          <div>Date: ${formatDate(order.updatedAt)}</div>
        </div>
      `
          : ''
      }
      
      ${
        mergedOptions.includeOrderNotes && order.notes
          ? `
        <div class="notes">
          <div class="section-title">Notes</div>
          <div>${order.notes}</div>
        </div>
      `
          : ''
      }
      
      ${
        mergedOptions.includeFooter
          ? `
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>${companyName} - ${companyAddress}</p>
        </div>
      `
          : ''
      }
    </body>
    </html>
  `;

  return html;
}

/**
 * Generate PDF buffer from invoice HTML
 * Note: In a real implementation, this would use a PDF generation library
 * like Puppeteer, headless-chrome, or a PDF service.
 */
export async function generateInvoicePdf(
  order: Order,
  options: InvoiceOptions = {}
): Promise<Buffer> {
  // This is a placeholder. In a real implementation, you would:
  // 1. Generate the HTML using the function above
  // 2. Use a PDF library to convert the HTML to PDF
  // 3. Return the PDF as a Buffer

  const html = generateInvoiceHtml(order, options);

  // Placeholder - in a real implementation, use a PDF library
  // For example with Puppeteer:
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // await page.setContent(html);
  // const pdfBuffer = await page.pdf({ format: 'A4' });
  // await browser.close();
  // return pdfBuffer;

  // For now, just return a buffer with the HTML
  return Buffer.from(html);
}
