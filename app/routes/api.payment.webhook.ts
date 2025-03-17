import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { updateOrderStatusFromPayment } from '~/features/orders/api/actions.server';
import { verifyStripeWebhook, processStripeEvent } from '~/features/payment/providers/stripe';

/**
 * Payment provider webhook handler
 *
 * POST /api/payment/webhook?provider=stripe - Handle Stripe webhook events
 */
export async function action({ request }: ActionFunctionArgs) {
  // Get the payment provider from query params
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') || 'stripe';

  try {
    // Handle different payment providers
    if (provider === 'stripe') {
      // Get the raw request body text and signature header
      const rawBody = await request.text();
      const signature = request.headers.get('stripe-signature') || '';

      // Verify the webhook signature
      const event = await verifyStripeWebhook(rawBody, signature);

      // Process the event and get payment result
      const paymentResult = await processStripeEvent(event);

      // If the payment result has an order reference, update the order status
      if (paymentResult && paymentResult.orderReference) {
        await updateOrderStatusFromPayment(paymentResult.orderReference, paymentResult);
      }

      return json({ received: true });
    } else {
      // Unsupported payment provider
      return json({ error: 'Unsupported payment provider' }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
