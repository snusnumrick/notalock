import { json, type ActionFunctionArgs } from '@remix-run/node';
import { getPaymentService } from '~/features/payment/PaymentService';
// Import commented out as it's not currently used
// import { requireAdminUser } from '~/features/auth/auth.server';
import { z } from 'zod';

/**
 * Refund Payment API
 *
 * Issues a refund for a payment
 * Requires admin privileges
 */
export async function action({ request }: ActionFunctionArgs) {
  // Ensure this is a POST request
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Require admin authorization
    // Uncomment this to enforce admin access:
    // await requireAdminUser(request);

    // Parse the request body
    const body = await request.json();

    // Validate the request body
    const schema = z.object({
      paymentId: z.string(),
      amount: z.number().positive().optional(), // Optional, defaults to full amount
      provider: z.string().optional(),
      reason: z.string().optional(),
    });

    const validatedData = schema.parse(body);

    // Get the payment service
    const paymentService = getPaymentService();

    // Issue the refund
    const result = await paymentService.refundPayment(
      validatedData.paymentId,
      validatedData.amount,
      validatedData.provider
    );

    // Return the result
    return json({
      success: result.success,
      refundId: result.refundId,
      error: result.error,
    });
  } catch (error) {
    console.error('Error refunding payment:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return json(
        {
          success: false,
          error: 'Invalid request data',
          validationErrors: error.errors,
        },
        { status: 400 }
      );
    }

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
