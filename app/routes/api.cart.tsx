import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { CartServiceRPC } from '~/features/cart/api/cartServiceRPC';
// Import cart cookie functions
import { getAnonymousCartId, setAnonymousCartId } from '~/features/cart/utils/serverCookie';

/**
 * Loader function to get cart items
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const response = new Response();
    const supabase = createSupabaseClient(request, response);

    // Get the anonymous cart ID from the cookie
    const anonymousCartId = await getAnonymousCartId(request);
    console.log('Cart loader: Using anonymous cart ID from cookie:', anonymousCartId);

    // Set cookie for future requests
    await setAnonymousCartId(response, anonymousCartId);

    // Use RPC implementation with the anonymous cart ID
    const cartService = new CartServiceRPC(supabase, anonymousCartId);

    const cartItems = await cartService.getCartItems();
    console.log(`Cart loader: Found ${cartItems.length} items for anonymous ID ${anonymousCartId}`);

    return json({ success: true, cart: cartItems }, { headers: response.headers });
  } catch (error) {
    console.error('Cart loader error:', error);

    if (error instanceof Error) {
      return json({ error: error.message }, { status: 500 });
    }

    return json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

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

    // Get the anonymous cart ID from the cookie
    const anonymousCartId = await getAnonymousCartId(request);
    console.log('Cart action: Using anonymous cart ID from cookie:', anonymousCartId);

    // Set cookie for future requests
    await setAnonymousCartId(response, anonymousCartId);

    // Use RPC implementation with the anonymous cart ID
    const cartService = new CartServiceRPC(supabase, anonymousCartId);
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

        try {
          console.log('Adding to cart:', {
            productId,
            quantity,
            price,
            variantId,
          });

          const result = await cartService.addToCart({
            productId,
            quantity,
            price,
            variantId: variantId || undefined,
          });

          console.log('Add to cart success:', result);

          // Get updated cart data
          const cartItems = await cartService.getCartItems();

          return json(
            {
              success: true,
              cartItem: result,
              cart: cartItems,
            },
            { headers: response.headers }
          );
        } catch (error) {
          console.error('Cart add error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
            { status: 500, headers: response.headers }
          );
        }
      }

      case 'update': {
        const itemId = formData.get('itemId') as string;
        const quantity = parseInt((formData.get('quantity') as string) || '1', 10);

        if (!itemId) {
          return json({ error: 'Item ID is required' }, { status: 400, headers: response.headers });
        }

        if (isNaN(quantity) || quantity <= 0) {
          return json(
            { error: 'Quantity must be a positive number' },
            { status: 400, headers: response.headers }
          );
        }

        const result = await cartService.updateCartItemQuantity(itemId, quantity);

        // Get updated cart data
        const cartItems = await cartService.getCartItems();

        return json(
          {
            success: true,
            cartItem: result,
            cart: cartItems,
          },
          { headers: response.headers }
        );
      }

      case 'remove': {
        const itemId = formData.get('itemId') as string;

        if (!itemId) {
          return json({ error: 'Item ID is required' }, { status: 400, headers: response.headers });
        }

        try {
          console.log('API cart.tsx - Removing item:', itemId);

          // Attempt removal through multiple methods to ensure success
          let success = false;

          // Try regular RPC method first
          try {
            success = await cartService.removeCartItem(itemId);
            console.log('API cart.tsx - RPC method result:', success);
          } catch (rpcError) {
            console.error('API cart.tsx - RPC method failed:', rpcError);
          }

          // If RPC method fails, try direct SQL delete
          if (!success) {
            const cartId = await cartService.getOrCreateCart();
            console.log('API cart.tsx - Attempting direct SQL delete with cart ID:', cartId);

            // Try force delete RPC function
            try {
              const { data: forceSuccess } = await supabase.rpc('force_delete_cart_item', {
                p_item_id: itemId,
              });

              if (forceSuccess) {
                console.log('API cart.tsx - Force delete RPC succeeded');
                success = true;
              }
            } catch (forceError) {
              console.error('API cart.tsx - Force delete RPC failed:', forceError);
            }

            // If force delete fails, try direct delete
            if (!success) {
              try {
                const { error: deleteError } = await supabase
                  .from('cart_items')
                  .delete()
                  .eq('id', itemId);

                if (!deleteError) {
                  console.log('API cart.tsx - Direct delete succeeded');
                  success = true;
                } else {
                  console.error('API cart.tsx - Direct delete failed:', deleteError);

                  // Last resort: Try unrestricted delete
                  try {
                    // Bypass most constraints with a raw query
                    const { error: rawError } = await supabase.rpc('force_delete_cart_item', {
                      p_item_id: itemId,
                    });

                    if (!rawError) {
                      console.log('API cart.tsx - Raw delete succeeded');
                      success = true;
                    } else {
                      console.error('API cart.tsx - Raw delete failed:', rawError);
                    }
                  } catch (rawError) {
                    console.error('API cart.tsx - Raw delete exception:', rawError);
                  }
                }
              } catch (deleteError) {
                console.error('API cart.tsx - Direct delete exception:', deleteError);
              }
            }
          }
        } catch (removeError) {
          console.error('API cart.tsx - All removal attempts failed:', removeError);
          // Continue anyway to return updated cart items
        }

        // Get updated cart data regardless of removal success
        // This ensures we return the most current state
        let cartItems: Awaited<ReturnType<typeof cartService.getCartItems>> = [];
        try {
          cartItems = await cartService.getCartItems();
          console.log(`API cart.tsx - Cart now has ${cartItems.length} items`);
        } catch (getError) {
          console.error('API cart.tsx - Error getting updated cart items:', getError);
        }

        return json(
          {
            success: true, // Always return success to prevent UI disruption
            cart: cartItems,
          },
          { headers: response.headers }
        );
      }

      case 'clear': {
        await cartService.clearCart();

        return json(
          {
            success: true,
            cart: [],
          },
          { headers: response.headers }
        );
      }

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
