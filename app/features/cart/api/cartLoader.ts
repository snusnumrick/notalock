import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { CartServiceRPC } from './cartServiceRPC';
import type { CartItem } from '../types/cart.types';
import { getAnonymousCartId, setAnonymousCartId } from '../utils/serverCookie';
import { ensureCartConsistency } from './cartSession';

interface CartLoaderData {
  initialCartItems: CartItem[];
}

/**
 * Shared loader function for cart data
 * Uses CartServiceRPC to ensure consistency with the RPC implementation
 */
export const cartLoader: LoaderFunction = async ({ request }) => {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);

  // Get or create anonymous cart ID using cookie
  let anonymousCartId = await getAnonymousCartId(request);
  console.log('cartLoader: Using anonymous cart ID from cookie:', anonymousCartId);

  // Ensure cart consistency between old and new cookie formats
  anonymousCartId = await ensureCartConsistency(supabase, anonymousCartId);
  console.log('cartLoader: Using final cart ID after consistency check:', anonymousCartId);

  // Set cookie for future requests
  await setAnonymousCartId(response, anonymousCartId);

  // Check if we need to reactivate a cleared cart
  try {
    const { data: activeCarts } = await supabase
      .from('carts')
      .select('id')
      .eq('anonymous_id', anonymousCartId)
      .eq('status', 'active')
      .limit(1);

    // If no active carts found, check for the most recent cleared cart to reactivate
    if (!activeCarts || activeCarts.length === 0) {
      const { data: latestCart } = await supabase
        .from('carts')
        .select('id, status')
        .eq('anonymous_id', anonymousCartId)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (latestCart && latestCart.length > 0) {
        // If the latest cart was cleared, reactivate it
        if (latestCart[0].status === 'cleared') {
          console.log(`Reactivating most recent cart: ${latestCart[0].id}`);

          const { error: reactivateError } = await supabase
            .from('carts')
            .update({
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', latestCart[0].id);

          if (!reactivateError) {
            console.log(`Successfully reactivated cart: ${latestCart[0].id}`);
          } else {
            console.error('Error reactivating cart:', reactivateError);
          }
        }
      }
    }
  } catch (e) {
    console.error('Error checking for carts to reactivate:', e);
  }

  // Get cart items using the RPC service implementation with the anonymous cart ID
  const cartService = new CartServiceRPC(supabase, anonymousCartId);
  const cartItems = await cartService.getCartItems();

  // Log cart items for debugging
  console.log(
    `cartLoader: Loaded ${cartItems.length} cart items for anonymous ID ${anonymousCartId}`
  );

  return json<CartLoaderData>(
    {
      initialCartItems: cartItems,
    },
    {
      headers: response.headers,
    }
  );
};
