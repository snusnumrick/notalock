import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { ReceiptGenerator } from '~/features/payment/receipts/ReceiptGenerator';
import { getPaymentService } from '~/features/payment/PaymentService';
import { getOrderById } from '~/features/orders/api/queries.server';

/**
 * Payment Receipt API
 *
 * Generates and returns a receipt for a payment
 * Format can be specified as 'html' or 'pdf'
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Parse query parameters
  const url = new URL(request.url);
  const paymentId = url.searchParams.get('paymentId');
  const provider = url.searchParams.get('provider');
  const orderId = url.searchParams.get('orderId');
  const format = url.searchParams.get('format') || 'html';

  // Validate required parameters
  if (!paymentId || !orderId) {
    return json(
      { error: 'Missing required parameters - paymentId and orderId are required' },
      { status: 400 }
    );
  }

  try {
    // Get the payment service
    const paymentService = getPaymentService();

    // Verify the payment
    const paymentResult = await paymentService.verifyPayment(paymentId, provider || undefined);

    if (!paymentResult.success) {
      return json({ error: paymentResult.error || 'Failed to verify payment' }, { status: 400 });
    }

    // Get the order data
    const order = await getOrderById(orderId);

    if (!order) {
      return json({ error: 'Order not found' }, { status: 404 });
    }

    // Generate receipt data
    const receiptData = ReceiptGenerator.generateReceiptData(paymentResult, order);

    // Generate receipt in requested format
    if (format === 'html') {
      // Generate HTML receipt
      const htmlReceipt = ReceiptGenerator.generateHtmlReceipt(receiptData);

      // Return HTML content
      return new Response(htmlReceipt, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="receipt-${receiptData.receiptNumber}.html"`,
        },
      });
    } else if (format === 'pdf') {
      // Generate PDF receipt
      const pdfReceipt = await ReceiptGenerator.generatePdfReceipt(receiptData);

      // Return PDF content
      return new Response(pdfReceipt, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="receipt-${receiptData.receiptNumber}.pdf"`,
        },
      });
    } else {
      // Invalid format requested
      return json({ error: 'Invalid format requested. Use "html" or "pdf".' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error generating receipt:', error);

    // Handle other errors
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
