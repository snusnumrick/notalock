import { ActionFunctionArgs, json } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { getAnonymousCartId } from '~/features/cart/utils/serverCookie';
import { CART_DATA_STORAGE_KEY } from '~/features/cart/constants';

/**
 * Emergency cart clear API
 * This is a nuclear option that completely bypasses the cart service
 * and directly clears all items for a cart ID
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const response = new Response();
    const supabase = createSupabaseClient(request, response);

    // Get form data to see if a specific item ID was provided
    const formData = await request.formData();
    const specificItemId = (formData.get('itemId') as string) || null;

    // Get the anonymous cart ID from the cookie
    const anonymousCartId = await getAnonymousCartId(request);

    console.log('Emergency cart clear - Using anonymous cart ID:', anonymousCartId);
    if (specificItemId) {
      console.log('Emergency cart clear - For specific item ID:', specificItemId);
    }

    // Get ALL carts associated with this anonymous ID (not just the first one)
    const { data: allCarts, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('anonymous_id', anonymousCartId)
      .eq('status', 'active');

    if (cartError) {
      console.error('Emergency cart clear - Error getting carts:', cartError);
      return json(
        { success: false, error: 'Database error' },
        { status: 500, headers: response.headers }
      );
    }

    if (!allCarts || allCarts.length === 0) {
      console.log('Emergency cart clear - No active carts found');

      // Also clear localStorage cart data if running in browser context
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(CART_DATA_STORAGE_KEY);
          localStorage.removeItem('current_cart_id');
          console.log('Emergency cart clear - Cleared localStorage cart data');
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
      }

      return json(
        { success: true, message: 'No active carts found' },
        { headers: response.headers }
      );
    }

    console.log(`Emergency cart clear - Found ${allCarts.length} active carts`);
    let cleared = 0;

    // If a specific item ID was provided, only remove that item
    if (specificItemId) {
      console.log(`Emergency cart clear - Removing specific item ${specificItemId} from all carts`);

      // Loop through all carts and remove only the specific item
      for (const cart of allCarts) {
        const cartId = cart.id;
        console.log(`Emergency cart clear - Checking cart ${cartId} for item ${specificItemId}`);

        // First check if the item exists in this cart
        const { data: existingItems } = await supabase
          .from('cart_items')
          .select('id')
          .eq('cart_id', cartId)
          .eq('id', specificItemId);

        if (existingItems && existingItems.length > 0) {
          console.log(`Emergency cart clear - Found item ${specificItemId} in cart ${cartId}`);

          // Delete just this specific item
          const { error: deleteError } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', specificItemId);

          if (deleteError) {
            console.error(
              `Emergency cart clear - Error removing item ${specificItemId}:`,
              deleteError
            );
            return json(
              { success: false, error: 'Delete operation failed' },
              { status: 500, headers: response.headers }
            );
          } else {
            console.log(
              `Emergency cart clear - Successfully removed item ${specificItemId} from cart ${cartId}`
            );
            cleared++;
          }
        }
      }

      return json(
        {
          success: cleared > 0,
          message:
            cleared > 0
              ? `Successfully removed item ${specificItemId} from ${cleared} carts`
              : `Item ${specificItemId} not found in any cart`,
        },
        { headers: response.headers }
      );
    }

    // If no specific item ID, clear ALL items from ALL carts
    for (const cart of allCarts) {
      const cartId = cart.id;
      console.log('Emergency cart clear - Clearing cart ID:', cartId);

      // Delete all items for this cart directly
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (deleteError) {
        console.error(
          `Emergency cart clear - Error deleting items for cart ${cartId}:`,
          deleteError
        );
        return json(
          { success: false, error: 'Delete operation failed' },
          { status: 500, headers: response.headers }
        );
      } else {
        console.log(`Emergency cart clear - Successfully cleared all items for cart: ${cartId}`);
        cleared++;
      }
    }

    // Mark all carts as inactive to prevent them from being used again
    if (allCarts.length > 0) {
      const cartIds = allCarts.map(c => c.id);
      const { error: updateError } = await supabase
        .from('carts')
        .update({ status: 'cleared', updated_at: new Date().toISOString() })
        .in('id', cartIds);

      if (updateError) {
        console.error('Error marking carts as cleared:', updateError);
      } else {
        console.log(`Marked ${cartIds.length} carts as cleared`);
      }
    }

    // Also clear localStorage cart data
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CART_DATA_STORAGE_KEY);
        localStorage.removeItem('current_cart_id');
        // Clear any preferred cart reference
        if (anonymousCartId) {
          localStorage.removeItem(`preferred_cart_${anonymousCartId}`);
        }
        console.log('Emergency cart clear - Cleared localStorage cart data');
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
    }

    return json(
      { success: true, message: 'Cart cleared successfully' },
      { headers: response.headers }
    );
  } catch (error) {
    console.error('Emergency cart clear - Unexpected error:', error);

    return json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
