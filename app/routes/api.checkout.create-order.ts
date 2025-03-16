import { json, type ActionFunctionArgs } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { CheckoutService } from '~/features/checkout/api/checkoutService';
import { createOrderFromCheckout } from '~/features/orders/api/integrations/checkoutIntegration';
import { CartService } from '~/features/cart/api/cartService';

/**
 * API endpoint for creating an order from a checkout session
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
        redirectUrl: `/checkout/success?orderId=${order.id}`,
      },
      { headers: response.headers }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
