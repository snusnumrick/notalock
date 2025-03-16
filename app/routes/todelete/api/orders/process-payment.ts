import { json, type ActionFunctionArgs } from '@remix-run/node';
import { getOrderService } from '~/features/orders/api/orderService';
import { getPaymentService } from '~/features/payment/PaymentService';
import { createOrderFromCheckout } from '~/features/orders/api/integrations/checkoutIntegration';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { CheckoutService } from '~/features/checkout/api/checkoutService';

/**
 * API endpoint for processing payment and creating an order
 * This connects the payment system with the order management system
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
    const { sessionId, paymentIntentId, paymentMethodId, provider } = await request.json();

    if (!sessionId) {
      return json({ error: 'Missing sessionId parameter' }, { status: 400 });
    }

    if (!paymentIntentId) {
      return json({ error: 'Missing paymentIntentId parameter' }, { status: 400 });
    }

    // Get the checkout service
    const checkoutService = new CheckoutService(supabase);

    // Get the checkout session
    const checkoutSession = await checkoutService.getCheckoutSession(sessionId);
    if (!checkoutSession) {
      return json({ error: 'Checkout session not found' }, { status: 404 });
    }

    // Create an order from the checkout session
    let order;
    try {
      order = await createOrderFromCheckout(
        checkoutSession,
        paymentIntentId,
        paymentMethodId,
        provider,
        supabase
      );
    } catch (orderError) {
      console.error('Failed to create order:', orderError);
      return json(
        { error: 'Failed to create order', details: String(orderError) },
        { status: 500 }
      );
    }

    // Verify payment status if payment intent ID is provided
    const paymentService = getPaymentService();
    const paymentResult = await paymentService.verifyPayment(paymentIntentId, provider);

    // Update the order with payment information
    const orderService = await getOrderService();
    await orderService.updateOrderFromPayment(order.id, paymentResult);

    // Clear the cart
    try {
      const { CartService } = await import('~/features/cart/api/cartService');
      const cartService = new CartService(supabase);

      if (checkoutSession.cartId) {
        await cartService.updateCartStatus(checkoutSession.cartId, 'completed');
      }
    } catch (cartError) {
      console.error('Error updating cart status:', cartError);
      // Continue even if this fails since the order was created
    }

    // Return success with order and payment details
    return json(
      {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
        },
        payment: {
          success: paymentResult.success,
          status: paymentResult.status,
          paymentId: paymentResult.paymentId,
        },
      },
      { headers: response.headers }
    );
  } catch (error) {
    console.error('Error processing payment and creating order:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
