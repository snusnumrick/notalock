import { type ActionFunctionArgs, json } from '@remix-run/node';
import { loadPaymentConfig } from '~/features/payment/config/paymentConfig.server';
import { getPaymentService } from '~/features/payment/PaymentService';
import { updateOrderStatusFromPayment } from '~/features/orders/api/actions.server';
import crypto from 'crypto';

/**
 * Square Webhook Handler
 *
 * Processes webhooks from Square for payment status updates
 * Configure this webhook in Square Dashboard with the URL:
 * https://yourdomain.com/api/webhooks/square
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Load the signature and payload
  const signatureHeader = request.headers.get('x-square-hmacsha256-signature');
  if (!signatureHeader) {
    console.error('Square webhook: Missing signature header');
    return json({ error: 'Invalid request' }, { status: 400 });
  }

  // Get the raw request body
  const payload = await request.text();
  if (!payload) {
    console.error('Square webhook: Empty payload');
    return json({ error: 'Empty payload' }, { status: 400 });
  }

  // Load configuration to verify the webhook
  const config = loadPaymentConfig();
  if (!config.square?.webhookSignatureKey) {
    console.error('Square webhook: Webhook signature key not configured');
    return json({ error: 'Webhook not configured' }, { status: 500 });
  }

  try {
    // Verify the webhook signature
    // Square uses HMAC SHA-256 for webhook signatures
    // Using imported crypto module from the top
    const hmac = crypto.createHmac('sha256', config.square.webhookSignatureKey);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('base64');

    if (calculatedSignature !== signatureHeader) {
      console.error('Square webhook: Invalid signature');
      return json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the webhook payload
    const webhookEvent = JSON.parse(payload);
    console.log('Square webhook received:', webhookEvent.type);

    // Process different webhook event types
    if (webhookEvent.type === 'payment.updated') {
      await handlePaymentUpdate(webhookEvent.data.object);
    }

    // Return a 200 response to acknowledge receipt
    return json({ status: 'success' });
  } catch (error) {
    console.error('Error processing Square webhook:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handle payment update webhook events
 */
async function handlePaymentUpdate(payment: Record<string, unknown>) {
  if (!payment || !payment.id) {
    console.error('Invalid payment object in webhook');
    return;
  }

  try {
    // Get the payment service
    const paymentService = getPaymentService();

    // Verify the payment status
    const paymentResult = await paymentService.verifyPayment(payment.id, 'square');

    // If the payment verification was successful, update the associated order
    if (paymentResult.success) {
      // Extract order reference from metadata or orderId
      const orderReference =
        payment.orderId || (payment.metadata && payment.metadata.orderReference);

      if (orderReference) {
        // Update the order status based on payment status
        await updateOrderStatusFromPayment(orderReference, paymentResult);
      } else {
        console.warn('No order reference found for payment:', payment.id);
      }
    } else {
      console.error('Payment verification failed:', paymentResult.error);
    }
  } catch (error) {
    console.error('Error handling payment update webhook:', error);
  }
}

/**
 * Default export for Remix
 */
export default function SquareWebhookRoute() {
  return null;
}
