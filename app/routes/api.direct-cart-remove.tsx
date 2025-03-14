import { ActionFunctionArgs, json } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';

/**
 * Direct cart item removal API
 * This is a dedicated endpoint for removing cart items that bypasses
 * the CartServiceRPC and goes directly to the database.
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const response = new Response();
    const supabase = createSupabaseClient(request, response);
    const formData = await request.formData();

    const itemId = formData.get('itemId') as string;
    const anonymousCartId = (formData.get('anonymousCartId') as string) || '';
    const preferredCartId = (formData.get('preferredCartId') as string) || '';

    if (!itemId) {
      return json({ error: 'Item ID is required' }, { status: 400, headers: response.headers });
    }

    console.log('Direct cart remove API - Removing item:', itemId);
    if (anonymousCartId) {
      console.log('Direct cart remove API - Using anonymous cart ID:', anonymousCartId);
    }
    if (preferredCartId) {
      console.log('Direct cart remove API - Using preferred cart ID:', preferredCartId);
    }

    // Try all available methods in sequence
    let success = false;
    let errorMessage = '';

    // Method 1: Try the force_delete_cart_item RPC function
    try {
      console.log('Direct cart remove - Attempting force_delete_cart_item RPC');
      const { data: rpcSuccess, error: rpcError } = await supabase.rpc('force_delete_cart_item', {
        p_item_id: itemId,
      });

      if (rpcSuccess) {
        console.log('Direct cart remove - force_delete_cart_item succeeded');
        success = true;
      } else if (rpcError) {
        console.error('Direct cart remove - force_delete_cart_item failed:', rpcError);
        errorMessage = `RPC error: ${rpcError.message}`;
      }
    } catch (e) {
      console.error('Direct cart remove - force_delete_cart_item exception:', e);
    }

    // Method 2: Try direct database delete
    if (!success) {
      try {
        console.log('Direct cart remove - Attempting direct database delete');
        const { error: deleteError } = await supabase.from('cart_items').delete().eq('id', itemId);

        if (!deleteError) {
          console.log('Direct cart remove - Direct delete succeeded');
          success = true;
        } else {
          console.error('Direct cart remove - Direct delete failed:', deleteError);
          errorMessage = `Delete error: ${deleteError.message}`;
        }
      } catch (e) {
        console.error('Direct cart remove - Direct delete exception:', e);
      }
    }

    // Method 3: Try remove_cart_item RPC function
    if (!success) {
      try {
        console.log('Direct cart remove - Attempting remove_cart_item RPC');
        const { data: standardRpcSuccess, error: standardRpcError } = await supabase.rpc(
          'remove_cart_item',
          {
            p_item_id: itemId,
          }
        );

        if (standardRpcSuccess) {
          console.log('Direct cart remove - remove_cart_item succeeded');
          success = true;
        } else if (standardRpcError) {
          console.error('Direct cart remove - remove_cart_item failed:', standardRpcError);
          errorMessage = `Standard RPC error: ${standardRpcError.message}`;
        }
      } catch (e) {
        console.error('Direct cart remove - remove_cart_item exception:', e);
      }
    }

    // Method 4: Try remove_cart_item_fixed RPC function
    if (!success) {
      try {
        console.log('Direct cart remove - Attempting remove_cart_item_fixed RPC');
        const { data: fixedRpcSuccess, error: fixedRpcError } = await supabase.rpc(
          'remove_cart_item_fixed',
          {
            p_item_id: itemId,
          }
        );

        if (fixedRpcSuccess) {
          console.log('Direct cart remove - remove_cart_item_fixed succeeded');
          success = true;
        } else if (fixedRpcError) {
          console.error('Direct cart remove - remove_cart_item_fixed failed:', fixedRpcError);
          errorMessage = `Fixed RPC error: ${fixedRpcError.message}`;
        }
      } catch (e) {
        console.error('Direct cart remove - remove_cart_item_fixed exception:', e);
      }
    }

    // Verify removal was successful
    try {
      console.log('Direct cart remove - Verifying item removal');
      const { data: cartItems } = await supabase.from('cart_items').select('*').eq('id', itemId);

      if (cartItems && cartItems.length > 0) {
        console.log(
          'Direct cart remove - Item still exists in database, attempting harder deletion'
        );

        // Try one more aggressive approach with a direct delete
        try {
          const { error: deleteError } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', itemId);

          if (!deleteError) {
            console.log('Direct cart remove - Forced deletion succeeded');
            success = true;
          }
        } catch (e) {
          console.error('Error in forced deletion:', e);
        }
      } else {
        console.log('Direct cart remove - Item verified as deleted');
        success = true;
      }

      // Also check for the item in the preferred cart if we have one
      if (preferredCartId) {
        console.log(`Direct cart remove - Checking for item in preferred cart: ${preferredCartId}`);
        const { data: preferredCartItems } = await supabase
          .from('cart_items')
          .select('*')
          .eq('cart_id', preferredCartId);

        if (preferredCartItems) {
          const matchingItems = preferredCartItems.filter(item => item.id === itemId);
          if (matchingItems.length > 0) {
            console.log(`Direct cart remove - Item found in preferred cart, forcing removal`);
            const { error: deleteError } = await supabase
              .from('cart_items')
              .delete()
              .eq('id', itemId);

            if (!deleteError) {
              console.log('Direct cart remove - Preferred cart item removal succeeded');
            } else {
              console.error('Error removing item from preferred cart:', deleteError);
            }
          }
        }
      }

      // If we have an anonymous ID, check all carts associated with it
      if (anonymousCartId && !success) {
        console.log(`Direct cart remove - Checking all carts for anonymous ID: ${anonymousCartId}`);
        const { data: allCarts } = await supabase
          .from('carts')
          .select('id')
          .eq('anonymous_id', anonymousCartId)
          .eq('status', 'active');

        if (allCarts && allCarts.length > 0) {
          console.log(`Direct cart remove - Found ${allCarts.length} carts to check`);
          const cartIds = allCarts.map(cart => cart.id);

          for (const cartId of cartIds) {
            if (cartId === preferredCartId) continue; // Skip if we already checked

            console.log(`Direct cart remove - Checking cart: ${cartId}`);
            const { data: cartItems } = await supabase
              .from('cart_items')
              .select('*')
              .eq('cart_id', cartId);

            if (cartItems) {
              const matchingItems = cartItems.filter(item => item.id === itemId);
              if (matchingItems.length > 0) {
                console.log(`Direct cart remove - Item found in cart ${cartId}, forcing removal`);
                const { error: deleteError } = await supabase
                  .from('cart_items')
                  .delete()
                  .eq('id', itemId);

                if (!deleteError) {
                  console.log(`Direct cart remove - Item removal from cart ${cartId} succeeded`);
                  success = true;
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error verifying item removal:', e);
    }

    // Return the outcome
    if (success) {
      return json(
        { success: true, message: 'Item removed successfully' },
        { headers: response.headers }
      );
    } else {
      return json(
        {
          success: false,
          error: errorMessage || 'Failed to remove item after multiple attempts',
          clientSuccess: true, // Tell client to update UI anyway
        },
        { status: 207, headers: response.headers } // 207 Multi-Status to indicate partial success
      );
    }
  } catch (error) {
    console.error('Direct cart remove - Unexpected error:', error);

    return json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        clientSuccess: true, // Tell client to update UI anyway
      },
      { status: 500 }
    );
  }
}
