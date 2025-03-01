import { ActionFunctionArgs, json } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { CartService } from '~/features/cart/api/cartService';

/**
 * API route for cart operations
 *
 * Supports adding items to cart, updating quantities, removing items, and clearing cart
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const response = new Response();
    const supabase = createSupabaseClient(request, response);
    const formData = await request.formData();

    const cartService = new CartService(supabase);
    const action = formData.get('action') as string;

    switch (action) {
      case 'add': {
        const productId = formData.get('productId') as string;
        const quantity = parseInt((formData.get('quantity') as string) || '1', 10);
        const price = parseFloat((formData.get('price') as string) || '0');
        const variantId = (formData.get('variantId') as string) || undefined;

        if (!productId) {
          return json(
            { error: 'Product ID is required' },
            { status: 400, headers: response.headers }
          );
        }

        if (isNaN(quantity) || quantity <= 0) {
          return json(
            { error: 'Quantity must be a positive number' },
            { status: 400, headers: response.headers }
          );
        }

        const result = await cartService.addToCart({
          productId,
          quantity,
          price,
          variantId: variantId || undefined,
        });

        return json({ success: true, cartItem: result }, { headers: response.headers });
      }

      // Future implementation:
      // - case 'update': for updating cart item quantities
      // - case 'remove': for removing items from cart
      // - case 'clear': for clearing the entire cart

      default:
        return json({ error: 'Invalid action' }, { status: 400, headers: response.headers });
    }
  } catch (error) {
    console.error('Cart action error:', error);

    // Handle known error types
    if (error instanceof Error) {
      return json({ error: error.message }, { status: 500 });
    }

    // For unexpected errors
    return json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
