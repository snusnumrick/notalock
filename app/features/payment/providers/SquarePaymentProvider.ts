import type { PaymentAmount, PaymentInfo, PaymentOptions, PaymentResult } from '../types';
import type { PaymentProviderInterface } from './PaymentProviderInterface';
import { Client, Environment, ApiError } from 'square';
import { randomUUID } from 'crypto';

/**
 * Square payment provider implementation
 * Integrates with Square API for payment processing
 */
export class SquarePaymentProvider implements PaymentProviderInterface {
  readonly provider = 'square';
  readonly displayName = 'Square';

  // Square API client
  private squareClient: Client | null = null;

  // Configuration properties
  private locationId?: string;
  private applicationId?: string;
  private environment: 'sandbox' | 'production' = 'sandbox';

  /**
   * Initialize Square payment provider with configuration
   */
  async initialize(config: {
    accessToken: string;
    locationId: string;
    applicationId: string;
    environment?: 'sandbox' | 'production';
  }): Promise<boolean> {
    try {
      const { accessToken, locationId, applicationId, environment = 'sandbox' } = config;

      if (!accessToken || !locationId || !applicationId) {
        console.error('Square payment provider missing required configuration');
        return false;
      }

      // Initialize Square client
      this.squareClient = new Client({
        accessToken,
        environment: environment === 'production' ? Environment.Production : Environment.Sandbox,
      });

      this.locationId = locationId;
      this.applicationId = applicationId;
      this.environment = environment;

      // Validate credentials by making a simple API call
      const { result } = await this.squareClient.locationsApi.retrieveLocation(locationId);

      if (!result || !result.location) {
        console.error('Failed to validate Square location ID');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error initializing Square payment provider:', error);
      return false;
    }
  }

  /**
   * Create a Square payment intent/order
   */
  async createPayment(
    amount: PaymentAmount,
    options?: PaymentOptions
  ): Promise<{ clientSecret?: string; paymentIntentId?: string; error?: string }> {
    if (!this.squareClient || !this.locationId) {
      return { error: 'Square payment provider not properly initialized' };
    }

    try {
      const { currency, value, items } = amount;

      // Create a unique idempotency key for this request
      const idempotencyKey = randomUUID();

      // Create an order first (required for most Square integrations)
      const orderRequest = {
        idempotencyKey,
        order: {
          locationId: this.locationId,
          referenceId: options?.orderReference || `order_${Date.now()}`,
          lineItems: items?.map(item => ({
            name: item.name,
            quantity: item.quantity.toString(),
            basePriceMoney: {
              amount: BigInt(Math.round(item.price * 100)),
              currency,
            },
          })) || [
            {
              name: 'Order Total',
              quantity: '1',
              basePriceMoney: {
                amount: BigInt(Math.round(value * 100)),
                currency,
              },
            },
          ],
        },
      };

      // Create the order
      const { result: orderResult } = await this.squareClient.ordersApi.createOrder(orderRequest);

      if (!orderResult || !orderResult.order || !orderResult.order.id) {
        return { error: 'Failed to create Square order' };
      }

      const orderId = orderResult.order.id;

      // Create a payment link/intent for this order
      // Not using this variable currently, but keeping as documentation
      const _createPaymentRequest = {
        idempotencyKey: randomUUID(),
        sourceId: 'PLACEHOLDER', // This will be replaced by client-side card token
        amountMoney: {
          amount: BigInt(Math.round(value * 100)),
          currency,
        },
        orderId,
        locationId: this.locationId,
        customerId: options?.customerId,
        // Optional fields based on options
        ...(options?.description ? { note: options.description } : {}),
        ...(options?.metadata
          ? {
              additionalRecipients: Object.entries(options.metadata).map(([key, value]) => ({
                locationId: this.locationId, // Reusing location ID as required field
                description: `${key}: ${value}`,
                amountMoney: { amount: BigInt(0), currency },
              })),
            }
          : {}),
      };

      // Return the successful payment intent creation
      return {
        clientSecret: `${this.locationId}:${orderId}`,
        paymentIntentId: orderId,
      };
    } catch (error) {
      console.error('Error creating Square payment:', error);
      const errorMessage =
        error instanceof ApiError
          ? error.result?.errors?.[0]?.detail || error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error creating Square payment';

      return { error: errorMessage };
    }
  }

  /**
   * Process a Square payment with the provided payment information
   */
  async processPayment(paymentIntentId: string, paymentInfo: PaymentInfo): Promise<PaymentResult> {
    if (!this.squareClient || !this.locationId) {
      return {
        success: false,
        status: 'failed',
        error: 'Square payment provider not properly initialized',
      };
    }

    try {
      // In a real implementation, the sourceId would come from the client-side tokenization
      // For now, we assume paymentInfo contains a tokenized card or payment method

      if (!paymentInfo.paymentMethodId) {
        return {
          success: false,
          status: 'failed',
          error: 'Missing payment source ID',
        };
      }

      // Create the payment using the order ID and source token
      const paymentRequest = {
        idempotencyKey: randomUUID(),
        sourceId: paymentInfo.paymentMethodId,
        orderId: paymentIntentId,
        locationId: this.locationId,
        // Include customer ID if available
        ...(paymentInfo.customerId ? { customerId: paymentInfo.customerId } : {}),
      };

      const { result } = await this.squareClient.paymentsApi.createPayment(paymentRequest);

      if (!result || !result.payment) {
        return {
          success: false,
          status: 'failed',
          error: 'Failed to process Square payment',
        };
      }

      const payment = result.payment;

      // Map Square status to our internal status
      let status: 'completed' | 'pending' | 'failed' = 'pending';
      if (payment.status === 'COMPLETED') {
        status = 'completed';
      } else if (payment.status === 'FAILED') {
        status = 'failed';
      }

      return {
        success: status !== 'failed',
        paymentId: payment.id,
        paymentIntentId,
        paymentMethodId: paymentInfo.paymentMethodId,
        status,
        providerData: {
          provider: 'square',
          orderId: payment.orderId,
          receiptUrl: payment.receiptUrl,
          squareStatus: payment.status,
        },
      };
    } catch (error) {
      console.error('Error processing Square payment:', error);
      const errorMessage =
        error instanceof ApiError
          ? error.result?.errors?.[0]?.detail || error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error processing Square payment';

      return {
        success: false,
        status: 'failed',
        error: errorMessage,
      };
    }
  }

  /**
   * Verify a Square payment
   */
  async verifyPayment(paymentId: string): Promise<PaymentResult> {
    if (!this.squareClient) {
      return {
        success: false,
        status: 'failed',
        error: 'Square payment provider not properly initialized',
      };
    }

    try {
      const { result } = await this.squareClient.paymentsApi.getPayment(paymentId);

      if (!result || !result.payment) {
        return {
          success: false,
          status: 'failed',
          error: 'Payment not found',
        };
      }

      const payment = result.payment;

      // Map Square status to our internal status
      let status: 'completed' | 'pending' | 'failed' = 'pending';
      if (payment.status === 'COMPLETED') {
        status = 'completed';
      } else if (payment.status === 'FAILED') {
        status = 'failed';
      }

      return {
        success: status !== 'failed',
        paymentId,
        status,
        providerData: {
          provider: 'square',
          orderId: payment.orderId,
          receiptUrl: payment.receiptUrl,
          squareStatus: payment.status,
          cardDetails: payment.cardDetails,
        },
      };
    } catch (error) {
      console.error('Error verifying Square payment:', error);
      const errorMessage =
        error instanceof ApiError
          ? error.result?.errors?.[0]?.detail || error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error verifying Square payment';

      return {
        success: false,
        status: 'failed',
        error: errorMessage,
      };
    }
  }

  /**
   * Cancel a Square payment
   */
  async cancelPayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.squareClient) {
      return {
        success: false,
        error: 'Square payment provider not properly initialized',
      };
    }

    try {
      // Get the payment first to check if it's in a cancellable state
      const { result: paymentResult } = await this.squareClient.paymentsApi.getPayment(paymentId);

      if (!paymentResult || !paymentResult.payment) {
        return {
          success: false,
          error: 'Payment not found',
        };
      }

      // If payment is already completed, we need to issue a refund instead
      if (paymentResult.payment.status === 'COMPLETED') {
        return {
          success: false,
          error: 'Payment already completed. Use refund instead of cancel.',
        };
      }

      // If payment is still pending, we can cancel it
      if (paymentResult.payment.status === 'PENDING') {
        const { result } = await this.squareClient.paymentsApi.cancelPayment(paymentId);

        return {
          success: !!result.payment,
        };
      }

      // If payment is already failed or canceled
      if (
        paymentResult.payment.status === 'FAILED' ||
        paymentResult.payment.status === 'CANCELED'
      ) {
        return {
          success: true, // Consider it a success since it's already not going to be charged
        };
      }

      return {
        success: false,
        error: `Cannot cancel payment with status: ${paymentResult.payment.status}`,
      };
    } catch (error) {
      console.error('Error canceling Square payment:', error);
      const errorMessage =
        error instanceof ApiError
          ? error.result?.errors?.[0]?.detail || error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error canceling Square payment';

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Refund a Square payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    if (!this.squareClient) {
      return {
        success: false,
        error: 'Square payment provider not properly initialized',
      };
    }

    try {
      // Get the original payment to determine currency and full amount
      const { result: paymentResult } = await this.squareClient.paymentsApi.getPayment(paymentId);

      if (!paymentResult || !paymentResult.payment) {
        return {
          success: false,
          error: 'Payment not found',
        };
      }

      const payment = paymentResult.payment;

      // Check if payment is in a refundable state
      if (payment.status !== 'COMPLETED') {
        return {
          success: false,
          error: `Cannot refund payment with status: ${payment.status}`,
        };
      }

      // Determine refund amount
      const currency = payment.amountMoney?.currency || 'USD';
      const originalAmount = Number(payment.amountMoney?.amount || 0) / 100;
      const refundAmount = amount || originalAmount;

      // Create refund request
      const refundRequest = {
        idempotencyKey: randomUUID(),
        paymentId,
        amountMoney: {
          amount: BigInt(Math.round(refundAmount * 100)),
          currency,
        },
        reason: 'Requested by customer',
      };

      const { result } = await this.squareClient.refundsApi.refundPayment(refundRequest);

      if (!result || !result.refund) {
        return {
          success: false,
          error: 'Failed to create refund',
        };
      }

      return {
        success: true,
        refundId: result.refund.id,
      };
    } catch (error) {
      console.error('Error refunding Square payment:', error);
      const errorMessage =
        error instanceof ApiError
          ? error.result?.errors?.[0]?.detail || error.message
          : error instanceof Error
            ? error.message
            : 'Unknown error refunding Square payment';

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get client configuration for Square Web Payments SDK
   */
  getClientConfig(): Record<string, string | number | boolean> {
    if (!this.applicationId || !this.locationId) {
      throw new Error('Square payment provider not properly initialized');
    }

    return {
      applicationId: this.applicationId,
      locationId: this.locationId,
      environment: this.environment,
    };
  }
}
