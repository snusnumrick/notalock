/**
 * Stripe Webhook Handler
 *
 * This module handles Stripe webhook events and connects them to the order processing system.
 */

import type Stripe from 'stripe';
import { PaymentResult } from '../types';
import { updateOrderStatusFromPayment } from '~/features/orders/api/actions.server';

/**
 * Process a Stripe webhook event and update the associated order
 */
export async function processStripeWebhookEvent(
  event: Stripe.Event
): Promise<PaymentResult | null> {
  // Extract the event type
  const eventType = event.type;
  console.log(`Processing Stripe webhook event: ${eventType}`);

  try {
    // Process different event types
    switch (eventType) {
      case 'payment_intent.succeeded':
        return handlePaymentIntentSucceeded(event);

      case 'payment_intent.payment_failed':
        return handlePaymentIntentFailed(event);

      case 'payment_intent.canceled':
        return handlePaymentIntentCanceled(event);

      case 'charge.refunded':
        return handleChargeRefunded(event);

      default:
        console.log(`Unhandled event type: ${eventType}`);
        return null;
    }
  } catch (error) {
    console.error('Error processing Stripe webhook event:', error);
    throw error;
  }
}

/**
 * Handle payment_intent.succeeded event
 */
function handlePaymentIntentSucceeded(event: Stripe.Event): PaymentResult {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  // Extract order reference from metadata
  const orderReference = paymentIntent.metadata?.orderReference;

  // Create payment result
  return {
    success: true,
    paymentId: paymentIntent.latest_charge as string,
    paymentIntentId: paymentIntent.id,
    paymentMethodId: paymentIntent.payment_method as string,
    status: 'paid',
    orderReference,
    providerData: {
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentMethodTypes: paymentIntent.payment_method_types,
    },
  };
}

/**
 * Handle payment_intent.payment_failed event
 */
function handlePaymentIntentFailed(event: Stripe.Event): PaymentResult {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  // Extract error message
  const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

  // Extract order reference from metadata
  const orderReference = paymentIntent.metadata?.orderReference;

  // Create payment result
  const paymentResult: PaymentResult = {
    success: false,
    paymentIntentId: paymentIntent.id,
    paymentMethodId: paymentIntent.payment_method as string,
    status: 'failed',
    error: errorMessage,
    orderReference,
    providerData: {
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      lastPaymentError: paymentIntent.last_payment_error,
    },
  };

  return paymentResult;
}

/**
 * Handle payment_intent.canceled event
 */
function handlePaymentIntentCanceled(event: Stripe.Event): PaymentResult {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  // Extract order reference from metadata
  const orderReference = paymentIntent.metadata?.orderReference;

  // Create payment result
  const paymentResult: PaymentResult = {
    success: false,
    paymentIntentId: paymentIntent.id,
    status: 'cancelled',
    error: 'Payment was canceled',
    orderReference,
    providerData: {
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      canceledAt: paymentIntent.canceled_at,
      cancellationReason: paymentIntent.cancellation_reason,
    },
  };

  return paymentResult;
}

/**
 * Handle charge.refunded event
 */
function handleChargeRefunded(event: Stripe.Event): PaymentResult {
  const charge = event.data.object as Stripe.Charge;

  // Get payment intent ID
  const paymentIntentId = charge.payment_intent as string;

  // Extract order reference from metadata
  const orderReference = charge.metadata?.orderReference;

  // Check if fully or partially refunded
  const isFullyRefunded = charge.amount_refunded === charge.amount;

  // Create payment result
  const paymentResult: PaymentResult = {
    success: true, // The refund operation was successful
    paymentId: charge.id,
    paymentIntentId,
    status: 'refunded',
    orderReference,
    refundAmount: charge.amount_refunded / 100, // Convert from cents to dollars
    refundReason: charge.refunds?.data[0]?.reason || undefined,
    refundDate: new Date().toISOString(),
    providerData: {
      amount: charge.amount,
      amountRefunded: charge.amount_refunded,
      currency: charge.currency,
      isFullyRefunded,
    },
  };

  return paymentResult;
}

/**
 * Update order status based on Stripe webhook event
 */
export async function handleStripeWebhookForOrder(event: Stripe.Event): Promise<void> {
  // Process the event to get a payment result
  const paymentResult = await processStripeWebhookEvent(event);

  // If we have a payment result with an order reference, update the order
  if (paymentResult && paymentResult.orderReference) {
    await updateOrderStatusFromPayment(paymentResult.orderReference, paymentResult);
  }
}
