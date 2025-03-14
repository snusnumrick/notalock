import { SupabaseClient } from '@supabase/supabase-js';
import { ANONYMOUS_CART_COOKIE_NAME } from '~/features/cart/constants';

/**
 * Ensures that cart data is consistent between old and new cookie formats
 * This function should be called whenever we need to validate cart data
 * @param supabase The Supabase client instance
 * @param anonymousCartId The current anonymous cart ID
 */
export async function ensureCartConsistency(
  supabase: SupabaseClient,
  anonymousCartId: string
): Promise<string> {
  try {
    // First, check if we have legacy cart data in localStorage
    let oldAnonymousCartId = '';

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        oldAnonymousCartId = window.localStorage.getItem('anonymousCartId') || '';
      } catch (e) {
        console.error('Error reading old anonymous cart ID from localStorage:', e);
      }
    }

    // If there's no old ID, or it's the same as current, nothing to do
    if (!oldAnonymousCartId || oldAnonymousCartId === anonymousCartId) {
      return anonymousCartId;
    }

    console.log('Found different cart IDs:', {
      new: anonymousCartId,
      old: oldAnonymousCartId,
    });

    // Check if there are carts for both IDs
    const { data: newCarts } = await supabase
      .from('carts')
      .select('id, anonymous_id')
      .eq('anonymous_id', anonymousCartId)
      .eq('status', 'active');

    const { data: oldCarts } = await supabase
      .from('carts')
      .select('id, anonymous_id')
      .eq('anonymous_id', oldAnonymousCartId)
      .eq('status', 'active');

    // If no carts with new ID but we have carts with old ID
    if ((!newCarts || newCarts.length === 0) && oldCarts && oldCarts.length > 0) {
      console.log('Using old cart ID as primary since it has active carts');

      // Update localStorage to use the old ID as the primary one
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(ANONYMOUS_CART_COOKIE_NAME, oldAnonymousCartId);
        } catch (e) {
          console.error('Error updating localStorage with old cart ID:', e);
        }
      }

      return oldAnonymousCartId;
    }

    // If we have carts with both IDs, we need to consolidate them
    if (newCarts && newCarts.length > 0 && oldCarts && oldCarts.length > 0) {
      console.log('Found carts with both old and new IDs, consolidating...');

      // Determine which cart is the primary one based on which has more items
      // Get items for new carts
      let primaryCartId = '';
      let primaryAnonymousId = '';

      const { data: newItems } = await supabase
        .from('cart_items')
        .select('id, cart_id')
        .in(
          'cart_id',
          newCarts.map(c => c.id)
        );

      const { data: oldItems } = await supabase
        .from('cart_items')
        .select('id, cart_id')
        .in(
          'cart_id',
          oldCarts.map(c => c.id)
        );

      const newItemCount = newItems?.length || 0;
      const oldItemCount = oldItems?.length || 0;

      console.log(`Cart items: new=${newItemCount}, old=${oldItemCount}`);

      if (oldItemCount > newItemCount) {
        // Old cart has more items, use it as primary
        primaryCartId = oldCarts[0].id;
        primaryAnonymousId = oldAnonymousCartId;
      } else {
        // New cart has more or equal items, use it as primary
        primaryCartId = newCarts[0].id;
        primaryAnonymousId = anonymousCartId;
      }

      console.log(
        `Selected primary cart: ${primaryCartId} with anonymous ID: ${primaryAnonymousId}`
      );

      // Save the primary anonymous ID to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(ANONYMOUS_CART_COOKIE_NAME, primaryAnonymousId);
          console.log(`Updated localStorage with primary anonymous ID: ${primaryAnonymousId}`);
        } catch (e) {
          console.error('Error updating localStorage with primary cart ID:', e);
        }
      }

      return primaryAnonymousId;
    }

    // Default: return the current anonymous ID
    return anonymousCartId;
  } catch (e) {
    console.error('Error in ensureCartConsistency:', e);
    return anonymousCartId;
  }
}
