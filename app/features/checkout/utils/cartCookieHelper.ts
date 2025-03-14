/**
 * Helper functions to ensure cart cookie consistency in checkout
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { ANONYMOUS_CART_COOKIE_NAME } from '~/features/cart/constants';

/**
 * Ensures that the correct cart cookie is used during checkout
 * @param request The incoming request
 * @returns The anonymous cart ID from the standardized cookie
 */
export async function getCheckoutCartCookie(request: Request): Promise<string> {
  try {
    const cookieHeader = request.headers.get('cookie');
    let anonymousCartId = '';

    if (cookieHeader) {
      const cookies: { [key: string]: string } = {};
      cookieHeader.split(';').forEach(cookie => {
        const parts = cookie.trim().split('=');
        const name = parts.shift();
        if (name) cookies[name] = parts.join('=');
      });

      // Check for the standard cookie first
      anonymousCartId = cookies[ANONYMOUS_CART_COOKIE_NAME] || '';

      // If not found, check for old cookie name as fallback
      if (!anonymousCartId) {
        anonymousCartId = cookies['anonymousCartId'] || '';
      }

      console.log(`Using cart cookie: ${anonymousCartId || 'none'}`);
    }

    // If no cookie was found, generate a new ID
    if (!anonymousCartId) {
      anonymousCartId = crypto.randomUUID();
      console.log(`No cart cookie found, generated new ID: ${anonymousCartId}`);
    }

    return anonymousCartId;
  } catch (error) {
    console.error('Error getting checkout cart cookie:', error);
    // Return a new ID as fallback
    return crypto.randomUUID();
  }
}

/**
 * Sets the standardized cart cookie in the response
 * @param response The response object
 * @param anonymousCartId The anonymous cart ID to set
 */
export function setCheckoutCartCookie(response: Response, anonymousCartId: string): void {
  try {
    if (!response.headers) {
      console.error('Response headers not available');
      return;
    }

    // Set expiration for 30 days
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    // Set the cookie with both names for backward compatibility during transition
    const cookieValue = `notalock_anonymous_cart=${anonymousCartId}; Path=/; Expires=${expires.toUTCString()}; SameSite=Lax`;
    response.headers.append('Set-Cookie', cookieValue);

    console.log(`Set checkout cart cookie: ${anonymousCartId}`);
  } catch (error) {
    console.error('Error setting checkout cart cookie:', error);
  }
}

/**
 * Ensures cart consistency during checkout - use this if inconsistencies are detected
 * @param supabase Supabase client
 * @param request Request object
 * @param response Response object
 * @returns Array of cart items from the consistent cart
 */
export async function ensureCheckoutCartConsistency(
  supabase: SupabaseClient,
  request: Request,
  response: Response
): Promise<string> {
  // Get the cookie from the request
  const anonymousCartId = await getCheckoutCartCookie(request);

  // Check for carts with this anonymous ID
  const { data: carts } = await supabase
    .from('carts')
    .select('id')
    .eq('anonymous_id', anonymousCartId)
    .eq('status', 'active');

  // If no carts found, create a new one
  if (!carts || carts.length === 0) {
    console.log(`No active carts found for anonymous ID: ${anonymousCartId}`);
    // The cart will be created later in the normal flow
  } else {
    console.log(`Found ${carts.length} active carts for anonymous ID: ${anonymousCartId}`);
  }

  // Set the cookie in the response
  setCheckoutCartCookie(response, anonymousCartId);

  return anonymousCartId;
}
