import type { PaymentAmount, PaymentInfo, PaymentOptions, PaymentResult } from '../types';
import type { PaymentProviderInterface } from '~/features/payment';
import Stripe from 'stripe';

/**
 * Stripe payment provider implementation
 * Integrates with Stripe API for payment processing
 */
export class StripePaymentProvider implements PaymentProviderInterface {
  readonly provider = 'stripe';
  readonly displayName = 'Stripe';

  // Stripe API client
  private stripeClient: Stripe | null = null;
  private publishableKey?: string;
  private webhookSecret?: string;

  /**
   * Initialize Stripe payment provider with configuration
   */
  async initialize(config: {
    secretKey: string;
    publishableKey: string;
    webhookSecret?: string;
  }): Promise<boolean> {
    try {
      const { secretKey, publishableKey, webhookSecret } = config;

      if (!secretKey || !publishableKey) {
        console.error('Stripe payment provider missing required configuration');
        return false;
      }

      // Initialize Stripe client
      this.stripeClient = new Stripe(secretKey, {
        apiVersion: '2025-02-24.acacia', // Use compatible API version
      });

      this.publishableKey = publishableKey;
      this.webhookSecret = webhookSecret;

      // Validate credentials by making a simple API call
      await this.stripeClient.paymentMethods.list({
        limit: 1,
      });

      return true;
    } catch (error) {
      console.error('Error initializing Stripe payment provider:', error);
      return false;
    }
  }

  /**
   * Create a Stripe payment intent
   */
  async createPayment(
    amount: PaymentAmount,
    options?: PaymentOptions
  ): Promise<{ clientSecret?: string; paymentIntentId?: string; error?: string }> {
    if (!this.stripeClient) {
      return { error: 'Stripe payment provider not properly initialized' };
    }

    try {
      const { currency, value, items } = amount;

      // Create a payment intent
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(value * 100), // Convert to cents
        currency: currency.toLowerCase(),
        // Optionally include metadata for the order
        metadata: {
          ...(options?.orderReference ? { orderReference: options.orderReference } : {}),
          ...(options?.metadata || {}),
        },
        // Add optional customer and description if provided
        ...(options?.customerId ? { customer: options.customerId } : {}),
        ...(options?.description ? { description: options.description } : {}),
      };

      // Add line items to metadata if available
      if (items && items.length > 0) {
        items.forEach((item, index) => {
          if (paymentIntentParams.metadata) {
            paymentIntentParams.metadata[`item_${index}_name`] = item.name;
            paymentIntentParams.metadata[`item_${index}_price`] = item.price.toString();
            paymentIntentParams.metadata[`item_${index}_quantity`] = item.quantity.toString();
          }
        });
      }

      const paymentIntent = await this.stripeClient.paymentIntents.create(paymentIntentParams);

      return {
        clientSecret: paymentIntent.client_secret || undefined,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Error creating Stripe payment intent:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error creating Stripe payment intent';

      return { error: errorMessage };
    }
  }

  /**
   * Process a Stripe payment with the provided payment information
   */
  async processPayment(paymentIntentId: string, paymentInfo: PaymentInfo): Promise<PaymentResult> {
    if (!this.stripeClient) {
      return {
        success: false,
        status: 'failed',
        error: 'Stripe payment provider not properly initialized',
      };
    }

    try {
      // For Stripe, the payment process is largely client-side
      // Here we check and potentially confirm the payment intent

      const paymentIntent = await this.stripeClient.paymentIntents.retrieve(paymentIntentId);

      // If we already have a payment method attached, we can confirm the intent
      if (paymentIntent.status === 'requires_confirmation') {
        await this.stripeClient.paymentIntents.confirm(paymentIntentId);

        // Retrieve the updated payment intent
        const updatedIntent = await this.stripeClient.paymentIntents.retrieve(paymentIntentId);

        // Map Stripe status to our internal status
        let status: 'paid' | 'pending' | 'failed' = 'pending';

        if (updatedIntent.status === 'succeeded') {
          status = 'paid';
        } else if (
          [
            'requires_payment_method',
            'requires_action',
            'requires_confirmation',
            'processing',
          ].includes(updatedIntent.status)
        ) {
          status = 'pending';
        } else {
          status = 'failed';
        }

        return {
          success: status !== 'failed',
          paymentId: updatedIntent.id,
          paymentIntentId,
          paymentMethodId: paymentInfo.paymentMethodId,
          status,
          providerData: {
            provider: 'stripe',
            stripeStatus: updatedIntent.status,
            paymentMethodType: updatedIntent.payment_method_types[0],
          },
        };
      }

      // If the intent is already in a terminal state, just return its status
      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentId: paymentIntent.id,
          paymentIntentId,
          paymentMethodId: paymentInfo.paymentMethodId,
          status: 'paid',
          providerData: {
            provider: 'stripe',
            stripeStatus: paymentIntent.status,
            paymentMethodType: paymentIntent.payment_method_types[0],
          },
        };
      }

      // Handle failed or canceled payment intents
      if (['canceled', 'requires_payment_method'].includes(paymentIntent.status)) {
        return {
          success: false,
          paymentId: paymentIntent.id,
          paymentIntentId,
          status: 'failed',
          error: paymentIntent.last_payment_error?.message || 'Payment failed or was canceled',
          providerData: {
            provider: 'stripe',
            stripeStatus: paymentIntent.status,
          },
        };
      }

      // For all other statuses, consider it pending
      return {
        success: true,
        paymentId: paymentIntent.id,
        paymentIntentId,
        paymentMethodId: paymentInfo.paymentMethodId,
        status: 'pending',
        providerData: {
          provider: 'stripe',
          stripeStatus: paymentIntent.status,
          paymentMethodType: paymentIntent.payment_method_types[0],
        },
      };
    } catch (error) {
      console.error('Error processing Stripe payment:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error processing Stripe payment';

      return {
        success: false,
        status: 'failed',
        error: errorMessage,
      };
    }
  }

  /**
   * Verify a Stripe payment
   */
  async verifyPayment(paymentId: string): Promise<PaymentResult> {
    if (!this.stripeClient) {
      return {
        success: false,
        status: 'failed',
        error: 'Stripe payment provider not properly initialized',
      };
    }

    try {
      const paymentIntent = await this.stripeClient.paymentIntents.retrieve(paymentId);

      // Map Stripe status to our internal status
      let status: 'paid' | 'pending' | 'failed' = 'pending';

      if (paymentIntent.status === 'succeeded') {
        status = 'paid';
      } else if (
        [
          'requires_payment_method',
          'requires_action',
          'requires_confirmation',
          'processing',
        ].includes(paymentIntent.status)
      ) {
        status = 'pending';
      } else {
        status = 'failed';
      }

      return {
        success: status !== 'failed',
        paymentId,
        status,
        providerData: {
          provider: 'stripe',
          stripeStatus: paymentIntent.status,
          paymentMethodType: paymentIntent.payment_method_types[0],
          amount: paymentIntent.amount / 100, // Convert back from cents
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata,
        },
      };
    } catch (error) {
      console.error('Error verifying Stripe payment:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error verifying Stripe payment';

      return {
        success: false,
        status: 'failed',
        error: errorMessage,
      };
    }
  }

  /**
   * Cancel a Stripe payment
   */
  async cancelPayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.stripeClient) {
      return {
        success: false,
        error: 'Stripe payment provider not properly initialized',
      };
    }

    try {
      // Get current status of the payment intent
      const paymentIntent = await this.stripeClient.paymentIntents.retrieve(paymentId);

      // If payment is already succeeded, we can't cancel it (would need a refund)
      if (paymentIntent.status === 'succeeded') {
        return {
          success: false,
          error: 'Payment already completed. Use refund instead of cancel.',
        };
      }

      // If payment is already canceled
      if (paymentIntent.status === 'canceled') {
        return {
          success: true, // Already canceled
        };
      }

      // Cancel the payment intent
      await this.stripeClient.paymentIntents.cancel(paymentId);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error canceling Stripe payment:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error canceling Stripe payment';

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Refund a Stripe payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    if (!this.stripeClient) {
      return {
        success: false,
        error: 'Stripe payment provider not properly initialized',
      };
    }

    try {
      // Get the payment intent to verify it's in a refundable state
      const paymentIntent = await this.stripeClient.paymentIntents.retrieve(paymentId);

      // Verify the payment is in a refundable state
      if (paymentIntent.status !== 'succeeded') {
        return {
          success: false,
          error: `Cannot refund payment with status: ${paymentIntent.status}`,
        };
      }

      // Create the refund
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentId,
        // If a specific amount is provided, include it
        ...(amount ? { amount: Math.round(amount * 100) } : {}),
      };

      const refund = await this.stripeClient.refunds.create(refundParams);

      return {
        success: true,
        refundId: refund.id,
      };
    } catch (error) {
      console.error('Error refunding Stripe payment:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error refunding Stripe payment';

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verify a Stripe webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.stripeClient || !this.webhookSecret) {
      console.error('Stripe webhook verification failed: Missing configuration');
      return false;
    }

    try {
      // Verify and construct the event
      this.stripeClient.webhooks.constructEvent(payload, signature, this.webhookSecret);

      return true;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get client configuration for Stripe Elements
   */
  /**
   * Get payment intent details
   * Used primarily for webhook processing
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    if (!this.stripeClient) {
      throw new Error('Stripe payment provider not properly initialized');
    }

    try {
      return await this.stripeClient.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error('Error retrieving Stripe payment intent:', error);
      throw error;
    }
  }

  getClientConfig(): Record<string, string | number | boolean> {
    if (!this.publishableKey) {
      throw new Error('Stripe payment provider not properly initialized');
    }

    return {
      publishableKey: this.publishableKey,
    };
  }
}
