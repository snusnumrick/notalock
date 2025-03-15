import { json, type ActionFunctionArgs } from '@remix-run/node';
import { getPaymentService } from '~/features/payment/PaymentService';
// Import commented out as it's not currently used
// import { requireAuthenticatedUser } from '~/features/auth/auth.server';
import { z } from 'zod';

/**
 * Create Payment Intent API
 *
 * Creates a payment intent/transaction with the specified payment provider
 * Returns the client secret and payment intent ID for client-side processing
 */
export async function action({ request }: ActionFunctionArgs) {
  // Optional: require authentication for payment creation
  // Uncomment this to require authentication:
  // await requireAuthenticatedUser(request);

  // Ensure this is a POST request
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Parse the request body
    const body = await request.json();

    // Validate the request body
    const schema = z.object({
      amount: z.number().positive(),
      currency: z.string().min(3).max(3),
      provider: z.string().optional(),
      orderReference: z.string().optional(),
      description: z.string().optional(),
      items: z
        .array(
          z.object({
            name: z.string(),
            price: z.number().positive(),
            quantity: z.number().int().positive(),
          })
        )
        .optional(),
      metadata: z.record(z.string(), z.string()).optional(),
    });

    const validatedData = schema.parse(body);

    // Get the payment service
    const paymentService = getPaymentService();

    // Create a payment intent
    const result = await paymentService.createPayment(
      {
        value: validatedData.amount,
        currency: validatedData.currency,
        items: validatedData.items,
      },
      {
        provider: validatedData.provider,
        orderReference: validatedData.orderReference,
        description: validatedData.description,
        metadata: validatedData.metadata,
      }
    );

    // Check for errors
    if (result.error) {
      return json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    // Return the client secret and payment intent ID
    return json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      provider: validatedData.provider || paymentService.getClientConfig().provider,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);

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
