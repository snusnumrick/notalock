import { json } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { CheckoutService } from '~/features/checkout/api/checkoutService';

/**
 * API endpoint to update shipping method without page navigation
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
      `API: Processing shipping method update with session ID: ${sessionId} and method: ${shippingMethodId}`
    );

    if (!sessionId || !shippingMethodId) {
      console.log('API: Missing required fields in shipping method update');
      return json({ error: 'Missing required fields' }, { status: 400, headers: response.headers });
    }

    const checkoutService = new CheckoutService(supabase);

    // Get shipping options to find the selected one
    const shippingOptions = await checkoutService.getShippingOptions();
    console.log(
      'API: Found shipping options:',
      shippingOptions.map(o => o.id)
    );

    const selectedOption = shippingOptions.find(option => option.id === shippingMethodId);

    if (!selectedOption) {
      console.log(
        `API: Selected shipping method ${shippingMethodId} not found in available options`
      );
      return json({ error: 'Invalid shipping method' }, { status: 400, headers: response.headers });
    }

    console.log(`API: Selected shipping option: ${selectedOption.id} (${selectedOption.name})`);

    // Update checkout session with shipping method
    console.log(`API: Calling updateShippingMethod for session ${sessionId}`);
    const updatedSession = await checkoutService.updateShippingMethod(
      sessionId,
      selectedOption.method,
      selectedOption
    );

    console.log(`API: Successfully updated shipping method`);

    // Return the updated session data
    return json(
      {
        success: true,
        session: updatedSession,
      },
      { headers: response.headers }
    );
  } catch (error) {
    console.error('Error in updateShippingMethod API:', error);
    return json(
      {
        error: 'An error occurred while updating shipping method',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: response.headers }
    );
  }
}
