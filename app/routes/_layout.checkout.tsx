import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { ensureConsistentCartId } from '~/features/cart/utils/cartHelper';
import { Outlet, useOutlet } from '@remix-run/react';
import { CartService } from '~/features/cart/api/cartService';

/**
 * Main checkout route - redirects to appropriate step
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log('MAIN CHECKOUT LOADER CALLED', request.url);

  // Create a response to set cookies
  const response = new Response();
  const supabase = createSupabaseClient(request, response);

  // Ensure consistent cart cookie - this prevents confusion with different cart IDs
  const anonymousCartId = await ensureConsistentCartId(request, response, supabase);
  console.log(`MAIN CHECKOUT: Using consistent anonymous cart ID: ${anonymousCartId}`);

  // FIX: Force consistent cart selection by explicitly looking up cart by anonymous ID
  try {
    const { data: cartByAnonymousId } = await supabase
      .from('carts')
      .select('id')
      .eq('anonymous_id', anonymousCartId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (cartByAnonymousId && cartByAnonymousId.length > 0) {
      const cookieCartId = cartByAnonymousId[0].id;
      console.log(`MAIN CHECKOUT: Found cart ${cookieCartId} matching cookie ${anonymousCartId}`);

      // Set a special header to force this cart ID throughout the checkout process
      response.headers.set('X-Preferred-Cart-ID', cookieCartId);
    }
  } catch (error) {
    console.error('Error finding cart for anonymous ID:', error);
    // Continue with normal flow
  }

  try {
    // CART FRESHNESS: Ensure we get fresh cart data by creating a cart service
    // and forcing a refresh of the cart data before checkout starts
    const cartService = new CartService(supabase);
    const cartId = await cartService.getOrCreateCart();
    const cartItems = await cartService.getCartItems();
    console.log(`CHECKOUT PREPARE: Found ${cartItems.length} items for cart ${cartId}`);

    // Log quantities for debugging
    if (cartItems.length > 0) {
      cartItems.forEach(item => {
        console.log(`CHECKOUT PREPARE: Item ${item.product_id} has quantity ${item.quantity}`);
      });
    }

    // Extract the path from the URL to determine which checkout page we're on
    const url = new URL(request.url);
    const path = url.pathname;
    const sessionId = url.searchParams.get('session');

    // AGGRESSIVE LOOP PROTECTION: Always direct base checkout path to information
    if (path === '/checkout') {
      console.log('LOOP PROTECTION: Base checkout path detected, redirecting to information step');
      if (sessionId) {
        return redirect(`/checkout/information?session=${sessionId}`, {
          headers: response.headers,
        });
      } else {
        return redirect('/checkout/information', {
          headers: response.headers,
        });
      }
    }

    // If we're already on a specific checkout page, don't redirect to prevent loops
    if (path !== '/checkout' && path.startsWith('/checkout/')) {
      console.log(
        `LOOP PROTECTION: Already on a specific checkout page (${path}), not redirecting`
      );
      return null; // Let the route component handle the rendering
    }

    // Default: redirect to information step
    console.log('Redirecting to information step');
    return redirect('/checkout/information', {
      headers: response.headers,
    });
  } catch (error) {
    console.error('MAIN CHECKOUT REDIRECT ERROR', error);
    // If there's an error, redirect to the cart
    return redirect('/cart', {
      headers: response.headers,
    });
  }
};

export default function CheckoutPage() {
  // Check if there's an outlet/child route to render
  const outlet = useOutlet();

  // console.log('CHECKOUT PAGE RENDERING, has outlet:', !!outlet);

  // If there's a child route to render, show it
  // Otherwise show a loading message (this should rarely happen due to redirects in loader)
  return (
    <div className="checkout-container">
      {outlet ? (
        <Outlet />
      ) : (
        <div className="p-8 text-center">
          <p className="text-lg">Loading checkout...</p>
        </div>
      )}
    </div>
  );
}
