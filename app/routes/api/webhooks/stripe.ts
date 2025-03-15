import { type ActionFunctionArgs, json } from '@remix-run/node';
import { loadPaymentConfig } from '~/features/payment/config/paymentConfig.server';
import { getPaymentService } from '~/features/payment/PaymentService';
import { updateOrderStatusFromPayment } from '~/features/orders/api/actions.server';
import { StripePaymentProvider } from '~/features/payment/providers/StripePaymentProvider';

/**
 * Stripe Webhook Handler
 *
 * Processes webhooks from Stripe for payment status updates
 * Configure this webhook in Stripe Dashboard with the URL:
 * https://yourdomain.com/api/webhooks/stripe
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Load the signature and payload
  const signatureHeader = request.headers.get('stripe-signature');
  if (!signatureHeader) {
    console.error('Stripe webhook: Missing signature header');
    return json({ error: 'Invalid request' }, { status: 400 });
  }

  // Get the raw request body
  const payload = await request.text();
  if (!payload) {
    console.error('Stripe webhook: Empty payload');
    return json({ error: 'Empty payload' }, { status: 400 });
  }

  // Load configuration to verify the webhook
  const config = loadPaymentConfig();
  if (!config.stripe?.webhookSecret) {
    console.error('Stripe webhook: Webhook secret not configured');
    return json({ error: 'Webhook not configured' }, { status: 500 });
  }

  try {
    // Get the Stripe provider for webhook verification
    const paymentService = getPaymentService();
    const stripeProvider = paymentService.getProvider('stripe') as StripePaymentProvider;

    if (!stripeProvider || !stripeProvider.verifyWebhookSignature) {
      console.error('Stripe webhook: Unable to get Stripe provider for signature verification');
      return json({ error: 'Configuration error' }, { status: 500 });
    }

    // Verify the webhook signature
    const isValid = stripeProvider.verifyWebhookSignature(payload, signatureHeader);

    if (!isValid) {
      console.error('Stripe webhook: Invalid signature');
      return json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the webhook payload
    const webhookEvent = JSON.parse(payload);
    console.log('Stripe webhook received:', webhookEvent.type);

    // Process different webhook event types
    if (webhookEvent.type === 'payment_intent.succeeded') {
      await handlePaymentIntentSucceeded(webhookEvent.data.object);
    } else if (webhookEvent.type === 'payment_intent.payment_failed') {
      await handlePaymentIntentFailed(webhookEvent.data.object);
    } else if (webhookEvent.type === 'charge.refunded') {
      await handleChargeRefunded(webhookEvent.data.object);
    }

    // Return a 200 response to acknowledge receipt
    return json({ status: 'success' });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handle successful payment intent webhook events
 */
async function handlePaymentIntentSucceeded(paymentIntent: Record<string, unknown>) {
  if (!paymentIntent || !paymentIntent.id) {
    console.error('Invalid payment intent object in webhook');
    return;
  }

  try {
    // Get the payment service
    const paymentService = getPaymentService();

    // Verify the payment status
    const paymentResult = await paymentService.verifyPayment(paymentIntent.id, 'stripe');

    // If the payment verification was successful, update the associated order
    if (paymentResult.success) {
      // Extract order reference from metadata
      const orderReference = paymentIntent.metadata?.orderReference;

      if (orderReference) {
        // Update the order status based on payment status
        await updateOrderStatusFromPayment(orderReference, paymentResult);
      } else {
        console.warn('No order reference found for payment intent:', paymentIntent.id);
      }
    } else {
      console.error('Payment verification failed:', paymentResult.error);
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded webhook:', error);
  }
}

/**
 * Handle failed payment intent webhook events
 */
async function handlePaymentIntentFailed(paymentIntent: Record<string, unknown>) {
  if (!paymentIntent || !paymentIntent.id) {
    console.error('Invalid payment intent object in webhook');
    return;
  }

  try {
    // Get the payment service
    const paymentService = getPaymentService();

    // Verify the payment status
    const paymentResult = await paymentService.verifyPayment(paymentIntent.id, 'stripe');

    // Always update the order status for failed payments
    const orderReference = paymentIntent.metadata?.orderReference;

    if (orderReference) {
      // Update the order status to reflect the failed payment
      await updateOrderStatusFromPayment(orderReference, {
        ...paymentResult,
        success: false,
        status: 'failed',
        error: paymentIntent.last_payment_error?.message || 'Payment failed',
      });
    } else {
      console.warn('No order reference found for failed payment intent:', paymentIntent.id);
    }
  } catch (error) {
    console.error('Error handling payment intent failed webhook:', error);
  }
}

/**
 * Handle charge refunded webhook events
 */
async function handleChargeRefunded(charge: Record<string, unknown>) {
  if (!charge || !charge.payment_intent) {
    console.error('Invalid charge object in webhook');
    return;
  }

  try {
    // Get the payment service
    const paymentService = getPaymentService();

    // Verify the payment status
    const paymentResult = await paymentService.verifyPayment(charge.payment_intent, 'stripe');

    // Update the order with refund information
    const paymentIntent = await paymentService.getPaymentIntent(charge.payment_intent, 'stripe');

    if (paymentIntent && paymentIntent.metadata?.orderReference) {
      await updateOrderStatusFromPayment(paymentIntent.metadata.orderReference, {
        ...paymentResult,
        status: 'refunded',
        refundAmount: charge.amount_refunded / 100, // Convert from cents
        refundReason: charge.refunds?.data?.[0]?.reason || 'Refunded',
        refundDate: new Date().toISOString(),
      });
    } else {
      console.warn('No order reference found for refunded charge:', charge.id);
    }
  } catch (error) {
    console.error('Error handling charge refunded webhook:', error);
  }
}

/**
 * Default export for Remix
 */
export default function StripeWebhookRoute() {
  return null;
}
