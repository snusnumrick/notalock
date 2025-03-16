import { json, type ActionFunctionArgs } from '@remix-run/node';
import { getPaymentService } from '~/features/payment/PaymentService';
import { z } from 'zod';

/**
 * Process Payment API
 *
 * Processes a payment with the specified payment provider
 * Takes a payment intent ID and payment method ID
 */
export async function action({ request }: ActionFunctionArgs) {
  // Ensure this is a POST request
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Parse the request body
    const body = await request.json();

    // Validate the request body
    const schema = z.object({
      paymentIntentId: z.string(),
      paymentMethodId: z.string(),
      provider: z.string(),
      type: z.string(),
      customerId: z.string().optional(),
      billingInfo: z
        .object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          address: z
            .object({
              line1: z.string().optional(),
              line2: z.string().optional(),
              city: z.string().optional(),
              state: z.string().optional(),
              postalCode: z.string().optional(),
              country: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
      savePaymentMethod: z.boolean().optional(),
    });

    const validatedData = schema.parse(body);

    // Get the payment service
    const paymentService = getPaymentService();

    // Process the payment
    const result = await paymentService.processPayment(validatedData.paymentIntentId, {
      paymentMethodId: validatedData.paymentMethodId,
      provider: validatedData.provider,
      type: validatedData.type,
      customerId: validatedData.customerId,
      billingInfo: validatedData.billingInfo,
      savePaymentMethod: validatedData.savePaymentMethod,
    });

    // Return the result
    return json({
      success: result.success,
      paymentId: result.paymentId,
      status: result.status,
      error: result.error,
    });
  } catch (error) {
    console.error('Error processing payment:', error);

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
