import { ActionFunctionArgs, json } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { requireAuth } from '~/server/middleware/auth.server';
import { createOrderFromCheckout } from '~/features/orders/api/integrations/checkoutIntegration';
import { CheckoutService } from '~/features/checkout/api/checkoutService';

/**
 * API route for creating an order from a checkout session
 * This endpoint expects:
 * - checkoutId: ID of the checkout session
 * - paymentIntentId: (optional) ID of the payment intent if payment was processed
 * - paymentMethodId: (optional) ID of the payment method used
 * - paymentProvider: (optional) Name of the payment provider
 */
export async function action({ request }: ActionFunctionArgs) {
  // Create a response that will hold any auth cookies
  const response = new Response();

  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, { status: 405, headers: response.headers });
    }

    // Get form data
    const formData = await request.formData();
    const checkoutId = formData.get('checkoutId')?.toString();
    const paymentIntentId = formData.get('paymentIntentId')?.toString();
    const paymentMethodId = formData.get('paymentMethodId')?.toString();
    const paymentProvider = formData.get('paymentProvider')?.toString() || 'stripe'; // Default to stripe

    // Validate required fields
    if (!checkoutId) {
      return json({ error: 'Missing checkout ID' }, { status: 400, headers: response.headers });
    }

    // Create Supabase client
    const supabase = createSupabaseClient(request, response);

    // Get the checkout service
    const checkoutService = new CheckoutService(supabase);

    // Get the checkout session
    const checkoutSession = await checkoutService.getCheckoutSession(checkoutId);

    // Check if checkout session exists
    if (!checkoutSession) {
      return json({ error: 'Checkout not found' }, { status: 404, headers: response.headers });
    }

    // Check authentication for non-guest checkout
    if (checkoutSession.userId) {
      let authResult;
      try {
        // This will redirect to login if not authenticated
        authResult = await requireAuth(request);
      } catch (authError) {
        // If this is a redirect response from requireAuth, return it
        if (authError instanceof Response) {
          return authError;
        }

        // Otherwise, return a generic error
        return json({ error: 'Authentication failed' }, { status: 401, headers: response.headers });
      }

      // Verify user has access to this checkout
      if (checkoutSession.userId !== authResult.user.id) {
        return json({ error: 'Unauthorized' }, { status: 403, headers: response.headers });
      }
    }

    // Create the order
    const order = await createOrderFromCheckout(
      checkoutSession,
      paymentIntentId,
      paymentMethodId,
      paymentProvider,
      supabase
    );

    // Return success response with order ID
    return json(
      {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      { status: 200, headers: response.headers }
    );
  } catch (error: unknown) {
    console.error('Error in order creation:', error);

    // Convert different error types to appropriate HTTP status codes
    let status = 500;
    let errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    if (
      error instanceof Error &&
      (error.message.includes('not found') || error.message.includes('does not exist'))
    ) {
      status = 404;
      errorMessage = 'Checkout not found';
    } else if (
      error instanceof Error &&
      (error.message.includes('unauthorized') ||
        error.message.includes('access') ||
        error.message.includes('permission'))
    ) {
      status = 403;
      errorMessage = 'Unauthorized';
    }

    // Return appropriate error response
    return json(
      {
        error: errorMessage,
        success: false,
      },
      { status, headers: response.headers }
    );
  }
}
