import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processStripeWebhookEvent, handleStripeWebhookForOrder } from '../stripe-webhook-handler';
import { updateOrderStatusFromPayment } from '~/features/orders/api/actions.server';

// Mock dependencies
vi.mock('~/features/orders/api/actions.server', () => ({
  updateOrderStatusFromPayment: vi.fn().mockResolvedValue(undefined),
}));

describe('Stripe Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processStripeWebhookEvent', () => {
    it('handles payment_intent.succeeded event correctly', async () => {
      // Arrange
      const mockEvent: any = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123456',
            amount: 11850, // In cents (118.50)
            currency: 'usd',
            payment_method: 'pm_123456',
            latest_charge: 'ch_123456',
            payment_method_types: ['card'],
            metadata: {
              orderReference: 'NO-20250315-ABCD',
            },
          },
        },
      };

      // Act
      const result = await processStripeWebhookEvent(mockEvent);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual({
        success: true,
        paymentId: 'ch_123456',
        paymentIntentId: 'pi_123456',
        paymentMethodId: 'pm_123456',
        status: 'completed',
        orderReference: 'NO-20250315-ABCD',
        providerData: {
          amount: 11850,
          currency: 'usd',
          paymentMethodTypes: ['card'],
        },
      });
    });

    it('handles payment_intent.payment_failed event correctly', async () => {
      // Arrange
      const mockEvent: any = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_123456',
            amount: 11850,
            currency: 'usd',
            payment_method: 'pm_123456',
            last_payment_error: {
              message: 'Your card was declined',
              code: 'card_declined',
            },
            metadata: {
              orderReference: 'NO-20250315-ABCD',
            },
          },
        },
      };

      // Act
      const result = await processStripeWebhookEvent(mockEvent);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual({
        success: false,
        paymentIntentId: 'pi_123456',
        paymentMethodId: 'pm_123456',
        status: 'failed',
        error: 'Your card was declined',
        orderReference: 'NO-20250315-ABCD',
        providerData: {
          amount: 11850,
          currency: 'usd',
          lastPaymentError: {
            message: 'Your card was declined',
            code: 'card_declined',
          },
        },
      });
    });

    it('handles payment_intent.canceled event correctly', async () => {
      // Arrange
      const mockEvent: any = {
        type: 'payment_intent.canceled',
        data: {
          object: {
            id: 'pi_123456',
            amount: 11850,
            currency: 'usd',
            canceled_at: 1615845600, // Unix timestamp
            cancellation_reason: 'abandoned',
            metadata: {
              orderReference: 'NO-20250315-ABCD',
            },
          },
        },
      };

      // Act
      const result = await processStripeWebhookEvent(mockEvent);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual({
        success: false,
        paymentIntentId: 'pi_123456',
        status: 'canceled',
        error: 'Payment was canceled',
        orderReference: 'NO-20250315-ABCD',
        providerData: {
          amount: 11850,
          currency: 'usd',
          canceledAt: 1615845600,
          cancellationReason: 'abandoned',
        },
      });
    });

    it('handles charge.refunded event correctly', async () => {
      // Arrange
      const mockEvent: any = {
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_123456',
            payment_intent: 'pi_123456',
            amount: 11850,
            amount_refunded: 11850, // Full refund
            currency: 'usd',
            refunds: {
              data: [
                {
                  id: 're_123456',
                  reason: 'requested_by_customer',
                },
              ],
            },
            metadata: {
              orderReference: 'NO-20250315-ABCD',
            },
          },
        },
      };

      // Mock Date.now for consistent testing
      const mockDate = new Date('2025-03-15T13:00:00Z');
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

      // Act
      const result = await processStripeWebhookEvent(mockEvent);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual({
        success: true,
        paymentId: 'ch_123456',
        paymentIntentId: 'pi_123456',
        status: 'refunded',
        orderReference: 'NO-20250315-ABCD',
        refundAmount: 118.5, // Converted to dollars
        refundReason: 'requested_by_customer',
        refundDate: '2025-03-15T13:00:00.000Z',
        providerData: {
          amount: 11850,
          amountRefunded: 11850,
          currency: 'usd',
          isFullyRefunded: true,
        },
      });
    });

    it('returns null for unhandled event types', async () => {
      // Arrange
      const mockEvent: any = {
        type: 'unhandled.event.type',
        data: {
          object: {
            id: 'obj_123456',
          },
        },
      };

      // Act
      const result = await processStripeWebhookEvent(mockEvent);

      // Assert
      expect(result).toBeNull();
    });

    it('handles events without order reference', async () => {
      // Arrange
      const mockEvent: any = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123456',
            amount: 11850,
            currency: 'usd',
            payment_method: 'pm_123456',
            latest_charge: 'ch_123456',
            metadata: {}, // No order reference
          },
        },
      };

      // Act
      const result = await processStripeWebhookEvent(mockEvent);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.orderReference).toBeUndefined();
    });
  });

  describe('handleStripeWebhookForOrder', () => {
    it('updates order status when webhook has order reference', async () => {
      // Arrange
      const mockEvent: any = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123456',
            amount: 11850,
            currency: 'usd',
            payment_method: 'pm_123456',
            latest_charge: 'ch_123456',
            metadata: {
              orderReference: 'NO-20250315-ABCD',
            },
          },
        },
      };

      // Act
      await handleStripeWebhookForOrder(mockEvent);

      // Assert
      expect(updateOrderStatusFromPayment).toHaveBeenCalledWith(
        'NO-20250315-ABCD',
        expect.objectContaining({
          success: true,
          paymentIntentId: 'pi_123456',
          status: 'completed',
        })
      );
    });

    it('does not call updateOrderStatusFromPayment when no order reference exists', async () => {
      // Arrange
      const mockEvent: any = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123456',
            amount: 11850,
            currency: 'usd',
            payment_method: 'pm_123456',
            latest_charge: 'ch_123456',
            metadata: {}, // No order reference
          },
        },
      };

      // Act
      await handleStripeWebhookForOrder(mockEvent);

      // Assert
      expect(updateOrderStatusFromPayment).not.toHaveBeenCalled();
    });

    it('does not call updateOrderStatusFromPayment for unhandled event types', async () => {
      // Arrange
      const mockEvent: any = {
        type: 'unhandled.event.type',
        data: {
          object: {
            id: 'obj_123456',
            metadata: {
              orderReference: 'NO-20250315-ABCD',
            },
          },
        },
      };

      // Act
      await handleStripeWebhookForOrder(mockEvent);

      // Assert
      expect(updateOrderStatusFromPayment).not.toHaveBeenCalled();
    });

    it('passes correct payment result to order update for failed payments', async () => {
      // Arrange
      const mockEvent: any = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_123456',
            amount: 11850,
            currency: 'usd',
            payment_method: 'pm_123456',
            last_payment_error: {
              message: 'Your card was declined',
            },
            metadata: {
              orderReference: 'NO-20250315-ABCD',
            },
          },
        },
      };

      // Act
      await handleStripeWebhookForOrder(mockEvent);

      // Assert
      expect(updateOrderStatusFromPayment).toHaveBeenCalledWith(
        'NO-20250315-ABCD',
        expect.objectContaining({
          success: false,
          paymentIntentId: 'pi_123456',
          status: 'failed',
          error: 'Your card was declined',
        })
      );
    });
  });
});
