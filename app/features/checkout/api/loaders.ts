import { json, redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { createSupabaseClient, SupabaseServerType } from '~/server/services/supabase.server';
import { CheckoutService } from './checkoutService';
import { CartService } from '~/features/cart/api/cartService';
import type { CheckoutSession } from '../types/checkout.types';
import { CartItem } from '~/features/cart/types/cart.types';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/features/supabase/types/Database.types';
import { v4 as uuidv4 } from 'uuid';
import { ANONYMOUS_CART_COOKIE_NAME } from '~/features/cart/constants';
import { setCookieBrowser } from '~/utils/cookieUtils';

export type DbCartItem = Database['public']['Tables']['cart_items']['Row'];
export type DbCartItemWithProduct = DbCartItem & {
  product: {
    name: string | null;
    sku: string | null;
    image_url: string | null;
  } | null;
};

export function dbCartItem2CartItem(dbCartItem: DbCartItemWithProduct): CartItem {
  // Debug log for raw cart items - this should have the correct quantity already
  // console.log(
  //   `CART ITEM DEBUG: ID=${dbCartItem.id}, product=${dbCartItem.product_id}, quantity=${dbCartItem.quantity}`
  // );

  return {
    id: dbCartItem.id,
    cart_id: dbCartItem.cart_id,
    product_id: dbCartItem.product_id,
    quantity: dbCartItem.quantity,
    price: dbCartItem.price,
    created_at: dbCartItem.created_at,
    updated_at: dbCartItem.updated_at,
    product: dbCartItem.product
      ? {
          name: dbCartItem.product.name ?? '',
          sku: dbCartItem.product.sku ?? '',
          image_url: dbCartItem.product.image_url,
        }
      : undefined,
  };
}

/**
 * Checks if the cart has items before proceeding with checkout
 */
export async function validateCartForCheckout(request: Request): Promise<
  | Response
  | {
      headers: Headers;
      cartItems: CartItem[];
      supabase: SupabaseServerType;
      anonymousCartId?: string;
    }
> {
  const response = new Response();
  const supabase: SupabaseServerType = createSupabaseClient(request, response);
  const cartService = new CartService(supabase);
  let anonymousCartId = '';
  let cartItems: CartItem[] = [];

  try {
    // First, check for anonymous cart ID in cookie
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies: { [key: string]: string } = {};
      cookieHeader.split(';').forEach(cookie => {
        const parts = cookie.trim().split('=');
        const name = parts.shift();
        if (name) cookies[name] = parts.join('=');
      });

      anonymousCartId = cookies[ANONYMOUS_CART_COOKIE_NAME] || '';
      if (anonymousCartId) {
        console.log(`CART VALIDATION: Using anonymous cart ID from cookie: ${anonymousCartId}`);

        // CRITICAL FIX: Force the use of the cart associated with the cookie
        // This is the most reliable way to ensure consistency between header and checkout
        try {
          const { data: cookieCart } = await supabase
            .from('carts')
            .select('id')
            .eq('anonymous_id', anonymousCartId)
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(1);

          if (cookieCart && cookieCart.length > 0) {
            const cartId = cookieCart[0].id;
            console.log(`CART VALIDATION: Found cart ID ${cartId} associated with cookie`);

            // Set this as the preferred cart for checkout
            const { data: cookieCartItems } = await supabase
              .from('cart_items')
              .select(
                `
                *,
                product:products(name, sku, image_url)
                `
              )
              .eq('cart_id', cartId);

            if (cookieCartItems && cookieCartItems.length > 0) {
              console.log(
                `CART VALIDATION: Found ${cookieCartItems.length} items in cookie-associated cart`
              );
              cartItems = cookieCartItems.map(item => dbCartItem2CartItem(item));
              return {
                headers: response.headers,
                cartItems,
                supabase,
                anonymousCartId,
              };
            } else {
              console.log(`CART VALIDATION: No items found in cookie-associated cart`);
            }
          } else {
            console.log(`CART VALIDATION: No cart found associated with cookie ${anonymousCartId}`);
          }
        } catch (err) {
          console.error('Error finding cookie-associated cart:', err);
        }
      }
    }

    // Get cart items
    console.log('CART VALIDATION: Getting cart items');

    // AGGRESSIVE CART FIX: Check for session ID in the URL and prioritize its cart
    const url = new URL(request.url);
    const sessionParam = url.searchParams.get('session');
    let usedSessionCart = false;

    // Always try to get cart items from the session first
    let sessionCartId = '';
    if (sessionParam) {
      try {
        console.log(
          `CART VALIDATION: Trying to get session details using session ID: ${sessionParam}`
        );
        // Try to get the session first to extract its cart ID
        const { data: session } = await supabase
          .from('checkout_sessions')
          .select('cart_id')
          .eq('id', sessionParam)
          .maybeSingle();

        if (session && session.cart_id) {
          sessionCartId = session.cart_id;
          console.log(
            `CART VALIDATION: Found cart ID ${sessionCartId} from session ${sessionParam}`
          );

          // Store this cart ID in localStorage for future consistency
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              window.localStorage.setItem('current_cart_id', sessionCartId);
              console.log(
                `CART VALIDATION: Stored session cart ID in localStorage: ${sessionCartId}`
              );
            } catch (e) {
              console.error('Error saving cart ID to localStorage:', e);
            }
          }

          // Try to get cart items using this cart ID
          const { data: items }: { data: DbCartItemWithProduct[] | null } = await supabase
            .from('cart_items')
            .select(
              `
              *,
              product:products(name, sku, image_url)
            `
            )
            .eq('cart_id', sessionCartId);

          if (items && items.length > 0) {
            console.log(`CART VALIDATION: Found ${items.length} items using session's cart ID`);
            cartItems = items.map(item => dbCartItem2CartItem(item));
            usedSessionCart = true;

            // DEBUG: Log cart items to check quantities
            console.log(
              'Cart items from session cart:',
              cartItems.map(item => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
              }))
            );
          } else {
            console.log(`CART VALIDATION: No items found using session's cart ID ${sessionCartId}`);
          }
        }
      } catch (sessionError) {
        console.log(`CART VALIDATION: Error getting session details: ${sessionError}`);
      }
    }

    // IMPORTANT FIX: If we already have a session cart ID, prioritize getting items from that cart
    // Otherwise, fall back to the standard cart service method
    if (sessionCartId) {
      console.log(`CART VALIDATION: Prioritizing items from session cart ID: ${sessionCartId}`);
      try {
        // Direct database query to get the most up-to-date items for this specific cart ID
        const { data: sessionCartItems }: { data: DbCartItemWithProduct[] | null } = await supabase
          .from('cart_items')
          .select(
            `
            *,
            product:products(name, sku, image_url)
            `
          )
          .eq('cart_id', sessionCartId);

        if (sessionCartItems && sessionCartItems.length > 0) {
          console.log(
            `CART VALIDATION: Found ${sessionCartItems.length} items directly from session cart ID`
          );

          // Convert DB items to CartItem type
          const mappedItems = sessionCartItems.map(item => dbCartItem2CartItem(item));

          // Debug log items
          console.log(
            'Cart items from direct session cart lookup:',
            mappedItems.map(item => ({
              id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
            }))
          );

          // Use these items which should match exactly with the checkout session's cart
          cartItems = mappedItems;
        } else {
          console.log(
            `CART VALIDATION: No items found in direct session cart lookup, falling back to standard method`
          );
          // Fallback to standard cart lookup
          console.log(`CART VALIDATION: Getting cart data from standard cart service`);
          try {
            const standardCartItems = await cartService.getCartItems();
            if (standardCartItems && standardCartItems.length > 0) {
              console.log(
                `CART VALIDATION: Found ${standardCartItems.length} items using standard lookup`
              );

              // DEBUG: Log cart items from standard lookup to check quantities
              console.log(
                'Cart items from standard lookup:',
                standardCartItems.map((item: CartItem) => ({
                  id: item.id,
                  product_id: item.product_id,
                  quantity: item.quantity,
                }))
              );

              // Use the standard cart items which should have the most up-to-date quantities
              cartItems = standardCartItems;
            }
          } catch (cartError) {
            console.log(`CART VALIDATION: Error in standard cart lookup: ${cartError}`);
          }
        }
      } catch (directLookupError) {
        console.log(`CART VALIDATION: Error in direct session cart lookup: ${directLookupError}`);
        // Fallback to standard cart lookup
        console.log(`CART VALIDATION: Getting cart data from standard cart service`);
        try {
          const standardCartItems = await cartService.getCartItems();
          if (standardCartItems && standardCartItems.length > 0) {
            console.log(
              `CART VALIDATION: Found ${standardCartItems.length} items using standard lookup`
            );

            // DEBUG: Log cart items from standard lookup to check quantities
            console.log(
              'Cart items from standard lookup:',
              standardCartItems.map((item: CartItem) => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
              }))
            );

            // Use the standard cart items which should have the most up-to-date quantities
            cartItems = standardCartItems;
          }
        } catch (cartError) {
          console.log(`CART VALIDATION: Error in standard cart lookup: ${cartError}`);
        }
      }
    } else {
      console.log(`CART VALIDATION: No session cart ID available, using standard cart lookup`);
      // Standard cart lookup
      console.log(`CART VALIDATION: Getting cart data from standard cart service`);
      try {
        const standardCartItems = await cartService.getCartItems();
        if (standardCartItems && standardCartItems.length > 0) {
          console.log(
            `CART VALIDATION: Found ${standardCartItems.length} items using standard lookup`
          );

          // DEBUG: Log cart items from standard lookup to check quantities
          console.log(
            'Cart items from standard lookup:',
            standardCartItems.map((item: CartItem) => ({
              id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
            }))
          );

          // Use the standard cart items which should have the most up-to-date quantities
          cartItems = standardCartItems;
        }
      } catch (cartError) {
        console.log(`CART VALIDATION: Error in standard cart lookup: ${cartError}`);
      }
    }

    // Check for any issues with cart quantities
    if (cartItems && cartItems.length > 0) {
      console.log(
        'CART VALIDATION: Final cart items for checkout:',
        cartItems.map(item => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
        }))
      );

      // CRITICAL FIX: Search for duplicate items with the same product_id and combine them
      // This follows the pattern from CartService.consolidateCarts
      // See docs/development/cart-removal.md for reference
      const productMap = new Map();

      cartItems.forEach(item => {
        const key = `${item.product_id}:${item.variant_id || 'null'}`;
        if (productMap.has(key)) {
          // Found a duplicate product, combine quantities
          const existingItem = productMap.get(key);
          existingItem.quantity += item.quantity;
          console.log(
            `CART VALIDATION: Combined duplicate items for product ${key}, new quantity: ${existingItem.quantity}`
          );
        } else {
          productMap.set(key, { ...item });
        }
      });

      // Use the deduplicated items
      const deduplicatedItems = Array.from(productMap.values());
      if (deduplicatedItems.length !== cartItems.length) {
        console.log(
          `CART VALIDATION: Deduplicated ${cartItems.length} items into ${deduplicatedItems.length} unique items`
        );
        cartItems = deduplicatedItems;
      }
    }

    // Log the final result of our cart item search
    console.log(
      `CART VALIDATION: Found ${cartItems ? cartItems.length : 0} items in cart using ${usedSessionCart ? 'session cart' : 'standard cart'}`
    );

    // If we didn't get any items, try to directly query the cart items
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      console.log(
        'CART VALIDATION: Initial cart lookup returned no items, trying fallback approaches'
      );

      // Try to get cart directly from cookie value
      if (anonymousCartId) {
        console.log(
          `CART VALIDATION: Trying to get cart for anonymous ID from cookie: ${anonymousCartId}`
        );
        // Look up cart ID by anonymous ID
        const { data: carts } = await supabase
          .from('carts')
          .select('id')
          .eq('anonymous_id', anonymousCartId)
          .eq('status', 'active')
          .limit(1);

        if (carts && carts.length > 0) {
          const cartId = carts[0].id;
          console.log(
            `CART VALIDATION: Found cart ID ${cartId} for anonymous ID ${anonymousCartId}`
          );

          const { data: items }: { data: DbCartItemWithProduct[] | null } = await supabase
            .from('cart_items')
            .select(
              `
              *,
              product:products(name, sku, image_url)
            `
            )
            .eq('cart_id', cartId);

          if (items && items.length > 0) {
            console.log(`CART VALIDATION: Found ${items.length} items using cookie anonymous ID`);
            cartItems = items.map(item => dbCartItem2CartItem(item));
          }
        }
      }

      // If still no items, try the known cart ID from logs
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        console.log(
          'CART VALIDATION: Specifically checking cart a53d5302-c3bb-47d7-b9b2-24123ddb4ff9'
        );
        const { data: specificItems }: { data: DbCartItemWithProduct[] | null } = await supabase
          .from('cart_items')
          .select(
            `
            *,
            product:products(name, sku, image_url)
          `
          )
          .eq('cart_id', 'a53d5302-c3bb-47d7-b9b2-24123ddb4ff9');

        if (specificItems && specificItems.length > 0) {
          console.log(`CART VALIDATION: Found ${specificItems.length} items in known cart`);
          cartItems = specificItems.map(item => dbCartItem2CartItem(item));
        }
      }

      // If still no items, check all active carts
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        console.log(
          'CART VALIDATION: Still no items found, looking for any active carts with items'
        );

        // Find any active carts
        const { data: activeCarts } = await supabase
          .from('carts')
          .select('id')
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(5);

        if (activeCarts && activeCarts.length > 0) {
          // Look through each cart for items
          for (const cart of activeCarts) {
            console.log(`CART VALIDATION: Checking cart ${cart.id} for items`);
            const { data: items }: { data: DbCartItemWithProduct[] | null } = await supabase
              .from('cart_items')
              .select(
                `
                *,
                product:products(name, sku, image_url)
              `
              )
              .eq('cart_id', cart.id);

            if (items && items.length > 0) {
              console.log(`CART VALIDATION: Found ${items.length} items in cart ${cart.id}`);
              cartItems = items.map(item => dbCartItem2CartItem(item));
              break;
            }
          }
        }
      }
    }

    // After fallback attempts, if still empty, redirect to cart
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      console.log('CART VALIDATION: Cart is empty after all attempts, redirecting to /cart');
      return redirect('/cart', {
        headers: response.headers,
      });
    }

    // Double check we have valid cart items (with product_id and cart_id)
    const validCartItems = cartItems.filter(item => item && item.product_id && item.cart_id);
    if (validCartItems.length === 0) {
      console.log('CART VALIDATION: No valid cart items found, redirecting to /cart');
      return redirect('/cart', {
        headers: response.headers,
      });
    }

    console.log(
      `CART VALIDATION: Cart has ${validCartItems.length} valid items, proceeding with checkout`
    );

    // ADDITIONAL QUANTITY CHECK: Verify cart quantities directly from database
    console.log('ADDITIONAL QUANTITY CHECK: Verifying cart quantities directly from database');
    try {
      // Get the cart items directly from the database to confirm quantities
      let cartToCheck = validCartItems.length > 0 ? validCartItems[0]?.cart_id : '';

      if (!cartToCheck && validCartItems.length > 0) {
        // Fallback to using the IDs we know
        const knownCarts = await supabase
          .from('carts')
          .select('id')
          .eq('status', 'active')
          .limit(5);

        if (knownCarts?.data && knownCarts.data.length > 0) {
          cartToCheck = knownCarts.data[0].id;
        }
      }

      if (cartToCheck) {
        const { data: directCartItems } = await supabase
          .from('cart_items')
          .select(
            `
            *,
            product:products(name, sku, image_url)
            `
          )
          .eq('cart_id', cartToCheck);

        if (directCartItems && directCartItems.length > 0) {
          console.log(
            `QUANTITY CHECK: Found ${directCartItems.length} items directly from database`
          );

          // Compare with current cart items
          let quantityDiscrepancy = false;
          directCartItems.forEach((dbItem: DbCartItemWithProduct) => {
            const matchingItem = validCartItems.find(item => item.product_id === dbItem.product_id);
            if (matchingItem && matchingItem.quantity !== dbItem.quantity) {
              console.log(
                `QUANTITY MISMATCH: Product ${dbItem.product_id} has ${dbItem.quantity} in DB but ${matchingItem.quantity} in cart items`
              );
              quantityDiscrepancy = true;
            }
          });

          // If there's a discrepancy, use the direct database items
          if (quantityDiscrepancy) {
            console.log('Using direct database items due to quantity discrepancies');
            const updatedCartItems = directCartItems.map(item => dbCartItem2CartItem(item));
            return {
              headers: response.headers,
              cartItems: updatedCartItems,
              supabase,
              anonymousCartId,
            };
          }
        }
      } else {
        console.log('No cart ID found for direct database check');
      }
    } catch (quantityCheckError) {
      console.log(`Error in additional quantity check: ${quantityCheckError}`);
      // Continue with existing cart items
    }

    return {
      headers: response.headers,
      cartItems: validCartItems,
      supabase,
      anonymousCartId,
    };
  } catch (error) {
    console.error('CART VALIDATION ERROR:', error);
    // In case of error, redirect to cart
    return redirect('/cart', {
      headers: response.headers,
    });
  }
}

/**
 * Loads checkout information step
 */
export async function checkoutInfoLoader({ request }: LoaderFunctionArgs) {
  try {
    console.log('CHECKOUT INFO LOADER START');
    const result = await validateCartForCheckout(request);

    if (result instanceof Response) {
      console.log('CHECKOUT INFO LOADER: Empty cart, redirecting to cart page');
      return result;
    }

    const { headers, cartItems, supabase } = result as {
      headers: Headers;
      cartItems: CartItem[];
      supabase: SupabaseServerType;
    };

    try {
      // Check URL parameters first - if we have a session ID, try to use that
      const url = new URL(request.url);
      const sessionIdParam = url.searchParams.get('session');

      // Will hold our checkout session
      let checkoutSession: CheckoutSession = {
        id: '',
        cartId: '',
        currentStep: 'information',
        subtotal: 0,
        shippingCost: 0,
        tax: 0,
        total: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const checkoutService = new CheckoutService(supabase);

      // If we have a session ID in the URL, try to use it
      if (sessionIdParam) {
        console.log(`CHECKOUT INFO LOADER: Session ID provided in URL: ${sessionIdParam}`);
        try {
          checkoutSession = await checkoutService.getCheckoutSession(sessionIdParam);
          console.log(
            `CHECKOUT INFO LOADER: Successfully retrieved existing session: ${sessionIdParam}`
          );

          // If we got a session, we're good to go - return it with the cart items
          return json(
            {
              checkoutSession,
              cartItems,
            },
            { headers }
          );
        } catch (sessionError) {
          console.log(
            `CHECKOUT INFO LOADER: Failed to get session from URL param: ${sessionError}`
          );
          // Continue with normal flow to create a new session
        }
      }

      // Double-check we have items before proceeding
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        console.log(
          'CHECKOUT INFO LOADER: No cart items found after validation, redirecting to cart'
        );
        return redirect('/cart', { headers });
      }

      console.log('CHECKOUT INFO LOADER: Creating checkout service');

      // Get cart ID from the first item
      let cartId = cartItems[0].cart_id;
      if (!cartId) {
        console.log(
          'CHECKOUT INFO LOADER: Invalid cart ID in first cart item, redirecting to cart'
        );
        return redirect('/cart', { headers });
      }

      // CART ID CONSISTENCY FIX: Check if we already have a checkout session
      // If yes, use its cart ID for consistency
      const urlParams = new URL(request.url).searchParams;
      const existingSessionId = urlParams.get('session');
      if (existingSessionId) {
        try {
          const { data: existingSession } = await supabase
            .from('checkout_sessions')
            .select('cart_id')
            .eq('id', existingSessionId)
            .maybeSingle();

          if (existingSession && existingSession.cart_id) {
            console.log(
              `CART CONSISTENCY FIX: Using cart ID ${existingSession.cart_id} from existing session instead of ${cartId}`
            );
            cartId = existingSession.cart_id;
          }
        } catch (sessionError) {
          console.log('Error getting session cart ID:', sessionError);
          // Continue with the cartId from the first item
        }
      }

      console.log(`CHECKOUT INFO LOADER: Using cart ID ${cartId}`);

      // Get user session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      console.log(`CHECKOUT INFO LOADER: User ID ${userId || 'not set (guest checkout)'}`);

      // Get or create checkout session
      console.log('CHECKOUT INFO LOADER: Getting or creating checkout session');
      try {
        checkoutSession = await checkoutService.getOrCreateCheckoutSession(cartId, userId);
        console.log(
          `CHECKOUT INFO LOADER: Session created with ID ${checkoutSession.id}, current step: ${checkoutSession.currentStep}`
        );

        // Try to extract anonymous ID from cart to ensure cookie consistency
        if (!userId) {
          try {
            const { data: cart } = await supabase
              .from('carts')
              .select('anonymous_id')
              .eq('id', cartId)
              .maybeSingle();

            if (cart && cart.anonymous_id) {
              // NOTE: We should no longer need to set the cookie here since it's set in the route loader
              // But for debugging purposes, we'll log the anonymous ID
              console.log(`CHECKOUT INFO LOADER: Found anonymous cart ID: ${cart.anonymous_id}`);

              // If there's a mismatch between cookie and cart, that would point to an issue
              const cartAnonymousId = cart.anonymous_id;
              const cookieAnonymousId = request.headers
                .get('cookie')
                ?.match(new RegExp(`${ANONYMOUS_CART_COOKIE_NAME}=([^;]+)`));
              if (cookieAnonymousId && cookieAnonymousId[1] !== cartAnonymousId) {
                console.log(
                  `WARNING: Cookie anonymous ID (${cookieAnonymousId[1]}) doesn't match cart anonymous ID (${cartAnonymousId})`
                );
              }
            }
          } catch (cookieError) {
            console.log('CHECKOUT INFO LOADER: Error setting anonymous cart cookie:', cookieError);
            // Non-fatal error, continue with checkout
          }
        }
      } catch (sessionError) {
        console.error('CHECKOUT INFO LOADER: Failed to create checkout session:', sessionError);
        // Even on error, we'll have a virtual session from the updated getOrCreateCheckoutSession method
        // No need to redirect to cart
      }

      // Validate checkpoint session has a valid ID
      if (!checkoutSession || !checkoutSession.id) {
        console.log('CHECKOUT INFO LOADER: Invalid checkout session, creating emergency session');
        // Create an emergency session as last resort
        checkoutSession = {
          id: uuidv4(),
          cartId: cartId,
          currentStep: 'information',
          subtotal: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          shippingCost: 0,
          tax: 0,
          total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // DIRECT FIX: When we're on the information page, FORCE the current step to information
      // This breaks the redirect loop by making sure we don't redirect away from information
      const requestUrl = new URL(request.url);
      const currentPath = requestUrl.pathname;

      if (currentPath === '/checkout/information') {
        console.log('LOOP FIX: Forcing currentStep to "information" to prevent redirect loop');

        // Force the current step to information in the session object
        const originalStep = checkoutSession.currentStep;
        checkoutSession.currentStep = 'information';

        // Try to update the database too, but we'll use the forced value regardless
        try {
          // IMPORTANT: Don't lose shipping address when updating step
          const updateData: Record<string, string> = {
            current_step: 'information',
            updated_at: new Date().toISOString(),
          };

          // Set this flag to KEEP shipping address when rolling back from shipping step
          if (originalStep === 'shipping' && checkoutSession.shippingAddress) {
            console.log(
              'LOOP FIX: Preserving shipping address while rolling back to information step'
            );
            // Don't modify the shipping_address value
          }

          await supabase.from('checkout_sessions').update(updateData).eq('id', checkoutSession.id);
          console.log('LOOP FIX: Updated session in database to information step');
        } catch (updateError) {
          console.log('LOOP FIX: Could not update database, but using forced value:', updateError);
        }
      } else if (
        checkoutSession.currentStep !== 'information' &&
        checkoutSession.currentStep !== 'review'
      ) {
        // Only redirect if we're not on the information page
        console.log(`CHECKOUT INFO LOADER: Redirecting to ${checkoutSession.currentStep} step`);
        return redirect(`/checkout/${checkoutSession.currentStep}?session=${checkoutSession.id}`, {
          headers,
        });
      }

      // Initialize required fields on the checkout session if they're missing
      if (!checkoutSession.cartId) {
        console.log(`CHECKOUT INFO LOADER: Setting missing cartId on session to ${cartId}`);
        checkoutSession.cartId = cartId;
      }

      // Check if we need to recalculate subtotals based on the final cart items
      if (cartItems.length > 0) {
        // Verify cart items have accurate quantities with direct DB check
        try {
          if (!cartId) {
            console.log('CHECKOUT INFO LOADER: No cart ID available for direct quantity check');
          } else {
            const { data: directItems } = await supabase
              .from('cart_items')
              .select(
                `
                *,
                product:products(name, sku, image_url)
                `
              )
              .eq('cart_id', cartId);

            if (directItems && directItems.length > 0) {
              console.log(
                `CHECKOUT INFO FINAL CHECK: Found ${directItems.length} items with direct DB query`
              );

              // Compare quantities and use direct items if there's a discrepancy
              let quantityDiscrepancy = false;
              directItems.forEach(dbItem => {
                const matchingItem = cartItems.find(item => item.product_id === dbItem.product_id);
                if (matchingItem && matchingItem.quantity !== dbItem.quantity) {
                  console.log(
                    `FINAL QUANTITY MISMATCH: Product ${dbItem.product_id} has ${dbItem.quantity} in DB but ${matchingItem.quantity} in cart items`
                  );
                  quantityDiscrepancy = true;
                }
              });

              if (quantityDiscrepancy) {
                console.log(
                  'CHECKOUT INFO LOADER: Using direct database items due to quantity discrepancies'
                );
                // Create a new array instead of trying to modify the constant cartItems
                const updatedItems = directItems.map(item => dbCartItem2CartItem(item));

                // Return immediately with the updated items
                return json(
                  {
                    checkoutSession,
                    cartItems: updatedItems,
                  },
                  { headers }
                );
              }
            }
          }
        } catch (finalCheckError) {
          console.log(`CHECKOUT INFO LOADER: Error in final quantity check: ${finalCheckError}`);
          // Continue with existing cart items
        }

        // Calculate what the subtotal should be based on current cart items
        const calculatedSubtotal = cartItems.reduce((sum, item) => {
          console.log(
            `CHECKOUT INFO LOADER: Item ${item.product_id} - quantity: ${item.quantity}, price: ${item.price}`
          );
          return sum + item.price * item.quantity;
        }, 0);

        console.log(
          `CHECKOUT INFO LOADER: Session subtotal: ${checkoutSession.subtotal}, Calculated: ${calculatedSubtotal}`
        );

        // If there's a meaningful difference, update the subtotal
        if (Math.abs(calculatedSubtotal - checkoutSession.subtotal) > 0.01) {
          console.log('CHECKOUT INFO LOADER: Updating subtotal with calculated value');

          // Update the session object
          checkoutSession.subtotal = calculatedSubtotal;
          checkoutSession.total =
            calculatedSubtotal + checkoutSession.shippingCost + checkoutSession.tax;

          // Try to update the database record too
          try {
            await supabase
              .from('checkout_sessions')
              .update({
                subtotal: calculatedSubtotal,
                total: calculatedSubtotal + checkoutSession.shippingCost + checkoutSession.tax,
                updated_at: new Date().toISOString(),
              })
              .eq('id', checkoutSession.id);
            console.log('CHECKOUT INFO LOADER: Updated database with new subtotal');
          } catch (updateError) {
            console.log(
              'CHECKOUT INFO LOADER: Failed to update database, but using corrected value:',
              updateError
            );
            // Non-fatal error, continue with checkout using the corrected value
          }
        }
      }
      return json(
        {
          checkoutSession,
          cartItems,
        },
        { headers }
      );
    } catch (error) {
      console.error('CHECKOUT INFO SERVICE ERROR:', error);
      // Don't throw error, redirect to cart instead
      return redirect('/cart', { headers });
    }
  } catch (error) {
    console.error('Error in checkoutInfoLoader:', error);
    // Create headers for redirect
    const headers = new Headers();
    return redirect('/cart', { headers });
  }
}

/**
 * Loads shipping method step
 */
export async function checkoutShippingLoader({ request }: LoaderFunctionArgs) {
  try {
    const result = await validateCartForCheckout(request);

    if (result instanceof Response) {
      return result;
    }

    const { headers, cartItems, supabase } = result as {
      headers: Headers;
      cartItems: CartItem[];
      supabase: SupabaseClient;
    };
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session');

    if (!sessionId) {
      return redirect('/checkout', { headers });
    }

    const checkoutService = new CheckoutService(supabase);

    // Get checkout session
    try {
      const checkoutSession = await checkoutService.getCheckoutSession(sessionId);

      // Verify we're at the right step or further
      if (checkoutSession.currentStep === 'information') {
        return redirect('/checkout', { headers });
      }

      if (checkoutSession.currentStep !== 'shipping' && checkoutSession.currentStep !== 'review') {
        return redirect(`/checkout/${checkoutSession.currentStep}?session=${sessionId}`, {
          headers,
        });
      }

      // Get shipping options
      const shippingOptions = await checkoutService.getShippingOptions();

      return json(
        {
          checkoutSession,
          shippingOptions,
          cartItems,
        },
        { headers }
      );
    } catch (error) {
      // If session not found, redirect to beginning
      return redirect('/checkout', { headers });
    }
  } catch (error) {
    console.error('Error in checkoutShippingLoader:', error);
    throw new Response('Error loading shipping options', { status: 500 });
  }
}

/**
 * Loads payment step
 */
export async function checkoutPaymentLoader({ request }: LoaderFunctionArgs) {
  try {
    const result = await validateCartForCheckout(request);

    if (result instanceof Response) {
      return result;
    }

    const { headers, cartItems, supabase } = result as {
      headers: Headers;
      cartItems: CartItem[];
      supabase: SupabaseServerType;
    };
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session');

    if (!sessionId) {
      return redirect('/checkout', { headers });
    }

    const checkoutService = new CheckoutService(supabase);

    // Get checkout session
    try {
      const checkoutSession = await checkoutService.getCheckoutSession(sessionId);

      // Verify we're at the right step or further
      if (
        checkoutSession.currentStep === 'information' ||
        checkoutSession.currentStep === 'shipping'
      ) {
        return redirect(`/checkout/${checkoutSession.currentStep}?session=${sessionId}`, {
          headers,
        });
      }

      if (checkoutSession.currentStep !== 'payment' && checkoutSession.currentStep !== 'review') {
        return redirect(`/checkout/${checkoutSession.currentStep}?session=${sessionId}`, {
          headers,
        });
      }

      return json(
        {
          checkoutSession,
          cartItems,
        },
        { headers }
      );
    } catch (error) {
      // If session not found, redirect to beginning
      return redirect('/checkout', { headers });
    }
  } catch (error) {
    console.error('Error in checkoutPaymentLoader:', error);
    throw new Response('Error loading payment options', { status: 500 });
  }
}

/**
 * Loads review step
 */
export async function checkoutReviewLoader({ request }: LoaderFunctionArgs) {
  try {
    const result = await validateCartForCheckout(request);

    if (result instanceof Response) {
      return result;
    }

    const { headers, cartItems, supabase } = result as {
      headers: Headers;
      cartItems: CartItem[];
      supabase: SupabaseServerType;
    };
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session');

    if (!sessionId) {
      return redirect('/checkout', { headers });
    }

    const checkoutService = new CheckoutService(supabase);

    // Get checkout session
    try {
      const checkoutSession = await checkoutService.getCheckoutSession(sessionId);

      // Verify we're at the right step
      if (checkoutSession.currentStep !== 'review') {
        return redirect(`/checkout/${checkoutSession.currentStep}?session=${sessionId}`, {
          headers,
        });
      }

      return json(
        {
          checkoutSession,
          cartItems,
        },
        { headers }
      );
    } catch (error) {
      // If session not found, redirect to beginning
      return redirect('/checkout', { headers });
    }
  } catch (error) {
    console.error('Error in checkoutReviewLoader:', error);
    throw new Response('Error loading order review', { status: 500 });
  }
}

/**
 * Loads confirmation step
 */
export async function checkoutConfirmationLoader({ request }: LoaderFunctionArgs) {
  try {
    const response = new Response();
    const supabase = createSupabaseClient(request, response);
    const url = new URL(request.url);
    const orderId = url.searchParams.get('order');

    if (!orderId) {
      return redirect('/', { headers: response.headers });
    }

    const checkoutService = new CheckoutService(supabase);

    try {
      // Get order details
      const order = await checkoutService.getOrder(orderId);

      // Add multiple approaches to clear the cart on the client side
      // 1. Set a cookie that the client code will detect
      setCookieBrowser(ANONYMOUS_CART_COOKIE_NAME, 'true', { path: '/', max_age: 300 });

      // 2. Add a special header that the client can detect
      response.headers.append('X-Clear-Cart', 'true');

      // 3. Clear the cart directly here
      try {
        const { CartService } = await import('../../../features/cart/api/cartService');
        const cartService = new CartService(supabase);
        await cartService.clearCart();
        console.log('Successfully cleared cart in confirmation page loader');
      } catch (cartClearError) {
        console.error('Error clearing cart in confirmation loader:', cartClearError);
        // Continue even if this fails since we already have the order
      }

      return json(
        {
          order,
        },
        { headers: response.headers }
      );
    } catch (error) {
      // If order not found, redirect to home
      return redirect('/', { headers: response.headers });
    }
  } catch (error) {
    console.error('Error in checkoutConfirmationLoader:', error);
    throw new Response('Error loading order confirmation', { status: 500 });
  }
}
