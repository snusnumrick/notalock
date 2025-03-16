import { json, type ActionFunctionArgs } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { CheckoutService } from '~/features/checkout/api/checkoutService';
import { getPaymentService } from '~/features/payment/PaymentService';
import { createOrderFromCheckout } from '~/features/orders/api/integrations/checkoutIntegration';
import { CartService } from '~/features/cart/api/cartService';

/**
 * API endpoint for placing an order and processing payment
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Create a response and Supabase client
    const response = new Response();
    const supabase = createSupabaseClient(request, response);

    // Parse the request body
    const { sessionId, paymentIntentId, paymentMethodId, paymentProvider } = await request.json();

    if (!sessionId) {
      return json({ error: 'Missing sessionId parameter' }, { status: 400 });
    }

    // Get the checkout service
    const checkoutService = new CheckoutService(supabase);

    // Get the checkout session
    const checkoutSession = await checkoutService.getCheckoutSession(sessionId);
    if (!checkoutSession) {
      return json({ error: 'Checkout session not found' }, { status: 404 });
    }

    // Get the payment service if payment is provided
    let paymentResult = null;
    if (paymentIntentId) {
      const paymentService = getPaymentService();
      paymentResult = await paymentService.verifyPayment(paymentIntentId, paymentProvider);

      if (!paymentResult.success) {
        return json(
          {
            success: false,
            error: 'Payment verification failed',
            paymentStatus: paymentResult.status,
            paymentError: paymentResult.error,
          },
          { status: 400 }
        );
      }
    }

    // Create an order from the checkout session
    const order = await createOrderFromCheckout(
      checkoutSession,
      paymentIntentId,
      paymentMethodId,
      paymentProvider,
      supabase
    );

    // Update checkout session to confirmation step
    await checkoutService.updateCheckoutSessionStep(sessionId, 'confirmation');

    // Clear the cart
    const cartService = new CartService(supabase);
    if (checkoutSession.cartId) {
      await cartService.updateCartStatus(checkoutSession.cartId, 'completed');
    }

    // Return success response
    return json(
      {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
        },
        payment: paymentResult
          ? {
              success: paymentResult.success,
              status: paymentResult.status,
              paymentId: paymentResult.paymentId,
            }
          : null,
        sessionId,
      },
      { headers: response.headers }
    );
  } catch (error) {
    console.error('Error placing order:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
