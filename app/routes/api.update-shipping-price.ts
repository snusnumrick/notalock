import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { CheckoutService } from '~/features/checkout/api/checkoutService';

/**
 * API endpoint to update shipping price without advancing the checkout flow
 */
export async function action({ request }: ActionFunctionArgs) {
  const response = new Response();
  const formData = await request.formData();
  const supabase = createSupabaseClient(request, response);

  try {
    // Get session ID and shipping method
    const sessionId = formData.get('sessionId')?.toString();
    const shippingMethodId = formData.get('shippingMethod')?.toString();

    console.log(
      `API Price Update: Processing shipping method price update with session ID: ${sessionId} and method: ${shippingMethodId}`
    );

    if (!sessionId || !shippingMethodId) {
      console.log('API Price Update: Missing required fields in shipping method update');
      return json({ error: 'Missing required fields' }, { status: 400, headers: response.headers });
    }

    const checkoutService = new CheckoutService(supabase);

    // Get shipping options to find the selected one
    const shippingOptions = await checkoutService.getShippingOptions();
    const selectedOption = shippingOptions.find(option => option.id === shippingMethodId);

    if (!selectedOption) {
      console.log(
        `API Price Update: Selected shipping method ${shippingMethodId} not found in available options`
      );
      return json({ error: 'Invalid shipping method' }, { status: 400, headers: response.headers });
    }

    console.log(
      `API Price Update: Selected shipping option: ${selectedOption.id} (${selectedOption.name})`
    );

    // Get the current checkout session
    const currentSession = await checkoutService.getCheckoutSession(sessionId);

    // Calculate updated pricing without changing the current step
    const shippingCost = selectedOption.price;
    const taxRate = 0.08; // 8% tax rate
    const subtotal = currentSession.subtotal || 0;
    const tax = Math.round((subtotal + shippingCost) * taxRate * 100) / 100;
    const total = subtotal + shippingCost + tax;

    // Return a virtual session with the updated pricing
    const updatedSession = {
      ...currentSession,
      shippingOption: selectedOption,
      shippingCost,
      tax,
      total,
    };

    console.log(
      `API Price Update: Calculated updated pricing - shipping: ${shippingCost}, tax: ${tax}, total: ${total}`
    );

    // Return the updated session data without persisting changes to the DB
    return json(
      {
        success: true,
        session: updatedSession,
      },
      { headers: response.headers }
    );
  } catch (error) {
    console.error('Error in updateShippingPrice API:', error);
    return json(
      {
        error: 'An error occurred while updating shipping price',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: response.headers }
    );
  }
}
