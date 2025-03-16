import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { getPaymentService } from '~/features/payment/PaymentService';
// import { z } from 'zod'; // Not currently used

/**
 * Verify Payment API
 *
 * Verifies the status of a payment
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Parse query parameters
  const url = new URL(request.url);
  const paymentId = url.searchParams.get('paymentId');
  const provider = url.searchParams.get('provider');

  // Validate required parameters
  if (!paymentId) {
    return json({ error: 'Missing paymentId parameter' }, { status: 400 });
  }

  try {
    // Get the payment service
    const paymentService = getPaymentService();

    // Verify the payment
    const result = await paymentService.verifyPayment(paymentId, provider || undefined);

    // Return the result
    return json({
      success: result.success,
      status: result.status,
      paymentId: result.paymentId,
      error: result.error,
      providerData: result.providerData,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);

    // Handle other errors
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
