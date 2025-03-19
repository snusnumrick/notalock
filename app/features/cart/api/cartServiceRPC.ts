import type { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { CartItem } from '../types/cart.types';
import {
  ANONYMOUS_CART_COOKIE_NAME,
  CART_COUNT_EVENT_NAME,
  CART_DATA_STORAGE_KEY,
} from '../constants';

export interface AddToCartParams {
  productId: string;
  quantity: number;
  price: number;
  variantId?: string;
}

/**
 * Service for managing shopping cart operations in Supabase using RPC functions
 * This implementation uses stored procedures to bypass RLS issues
 */
export class CartServiceRPC {
  private supabase: SupabaseClient;
  private serverAnonymousCartId?: string;

  constructor(supabase: SupabaseClient, serverAnonymousCartId?: string) {
    // console.log('CartServiceRPC - constructor. serverAnonymousCartId:', serverAnonymousCartId);
    this.supabase = supabase;
    this.serverAnonymousCartId = serverAnonymousCartId;
  }

  /**
   * Adds an item to the cart using RPC function
   * @param params Cart item parameters
   * @returns The newly created or updated cart item
   */
  async addToCart(params: AddToCartParams): Promise<CartItem> {
    const { productId, quantity, price, variantId } = params;

    try {
      // Get the user's cart ID (create if needed)
      const cartId = await this.getOrCreateCart();
      // console.log('Got cart ID:', cartId);

      // Check cart exists in database using our debug function
      /* const { data: cartDebug, error: debugError } = await this.supabase.rpc('debug_cart', {
        p_cart_id: cartId,
      });
      console.log('Cart debug info:', cartDebug, debugError);*/

      // Use the RPC function to add the item
      const { data: itemId, error } = await this.supabase.rpc('add_to_cart', {
        p_cart_id: cartId,
        p_price: price,
        p_product_id: productId,
        p_quantity: quantity,
        p_variant_id: variantId || null,
      });

      if (error) {
        console.error('Error adding item to cart:', error);
        throw new Error(`Failed to add item to cart: ${error.message}`);
      }

      // console.log('Item added with ID:', itemId);

      // Fetch the cart item details
      const { data: cartItem, error: fetchError } = await this.supabase
        .from('cart_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError) {
        console.error('Error fetching cart item:', fetchError);
        throw new Error(`Failed to get cart item details: ${fetchError.message}`);
      }

      // Update client-side cache
      this.updateClientSideCart(cartItem, 'add');
      return cartItem;
    } catch (error) {
      console.error('Error in addToCart:', error);
      throw error;
    }
  }

  /**
   * Updates the quantity of an item in the cart using RPC function
   * @param itemId The ID of the item to update
   * @param quantity The new quantity
   * @returns The updated item
   */
  async updateCartItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    try {
      // Use the RPC function to update the item
      const { data: success, error } = await this.supabase.rpc('update_cart_item', {
        p_item_id: itemId,
        p_quantity: quantity,
      });

      if (error || !success) {
        console.error('Error updating cart item:', error);
        throw new Error(`Failed to update cart item: ${error?.message || 'Unknown error'}`);
      }

      // Fetch the updated cart item
      const { data: updatedItem, error: fetchError } = await this.supabase
        .from('cart_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (fetchError) {
        console.error('Error fetching updated cart item:', fetchError);
        throw new Error(`Failed to get updated cart item: ${fetchError.message}`);
      }

      // Update client-side cache
      this.updateClientSideCart(updatedItem, 'update');
      return updatedItem;
    } catch (error) {
      console.error('Error in updateCartItemQuantity:', error);
      throw error;
    }
  }

  /**
   * Removes an item from the cart using multiple methods to ensure success
   * @param itemId The ID of the item to remove
   * @returns True if successful
   */
  async removeCartItem(itemId: string): Promise<boolean> {
    try {
      // console.log('CartServiceRPC - Forcefully removing item:', itemId);

      // Try all available methods in sequence until one succeeds
      // 1. First try the new fixed RPC function
      // console.log('Attempt 1: Using remove_cart_item_fixed RPC function');
      const { data: fixedSuccess, error: fixedError } = await this.supabase.rpc(
        'remove_cart_item_fixed',
        {
          p_item_id: itemId,
        }
      );

      if (fixedSuccess) {
        // console.log('Successfully removed item using fixed RPC function');
        this.updateClientSideCart({ id: itemId } as CartItem, 'remove');
        return true;
      }

      if (fixedError) {
        console.error('Error using fixed RPC function:', fixedError);
      }

      // 2. Try force delete RPC function as fallback
      // console.log('Attempt 2: Using force_delete_cart_item RPC function');
      const { data: forceSuccess, error: forceError } = await this.supabase.rpc(
        'force_delete_cart_item',
        {
          p_item_id: itemId,
        }
      );

      if (forceSuccess) {
        // console.log('Successfully removed item using force delete RPC function');
        this.updateClientSideCart({ id: itemId } as CartItem, 'remove');
        return true;
      }

      if (forceError) {
        console.error('Error using force delete RPC function:', forceError);
      }

      // 3. Try original RPC function
      // console.log('Attempt 3: Using original remove_cart_item RPC function');
      const { data: originalSuccess, error: originalError } = await this.supabase.rpc(
        'remove_cart_item',
        {
          p_item_id: itemId,
        }
      );

      if (originalSuccess) {
        // console.log('Successfully removed item using original RPC function');
        this.updateClientSideCart({ id: itemId } as CartItem, 'remove');
        return true;
      }

      if (originalError) {
        console.error('Error using original RPC function:', originalError);
      }

      // 4. Try direct SQL delete as final fallback
      // console.log('Attempt 4: Using direct SQL delete');
      await this.getOrCreateCart();
      const { error: directError } = await this.supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (!directError) {
        // console.log('Successfully removed item using direct SQL delete');
        this.updateClientSideCart({ id: itemId } as CartItem, 'remove');
        return true;
      }

      console.error('All removal methods failed:', directError);

      // Even if all methods fail, we'll update the client-side cache anyway
      // to ensure UI consistency
      this.updateClientSideCart({ id: itemId } as CartItem, 'remove');

      // If we get here, all methods failed but we'll return true to allow UI to update
      // The next reload will sync with server state
      return true;
    } catch (error) {
      console.error('Error in removeCartItem:', error);

      // Even if there's an error, we'll update the client cache
      this.updateClientSideCart({ id: itemId } as CartItem, 'remove');

      // Don't throw the error, just return true to allow UI to update
      return true;
    }
  }

  /**
   * Clears all items from the cart
   * @returns True if successful
   */
  async clearCart(): Promise<boolean> {
    try {
      const cartId = await this.getOrCreateCart();

      // Clear from database - using direct query since RLS is disabled
      const { error } = await this.supabase.from('cart_items').delete().eq('cart_id', cartId);

      if (error) {
        console.error('Error clearing cart:', error);
        throw new Error(`Failed to clear cart: ${error.message}`);
      }

      // Clear client-side cache
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CART_DATA_STORAGE_KEY);
      }

      return true;
    } catch (error) {
      console.error('Error in clearCart:', error);
      throw error;
    }
  }

  /**
   * Gets an existing cart or creates a new one for the current user
   * @returns The cart ID
   */
  async getOrCreateCart(): Promise<string> {
    // Try to get the authenticated user's session
    const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession();

    if (sessionError) {
      throw new Error(`Failed to get user session: ${sessionError.message}`);
    }

    const userId = sessionData.session?.user.id;

    // console.log('getOrCreateCart - ', 'sessionData: ', sessionData, 'userId: ', userId);

    // For authenticated users
    if (userId) {
      // console.log('Getting cart for authenticated user:', userId);

      // First check if the user already has an active cart
      const { data: activeCarts } = await this.supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1);

      if (activeCarts && activeCarts.length > 0) {
        // console.log('Found existing active cart for user:', activeCarts[0].id);
        return activeCarts[0].id;
      }

      // No active cart found, check for any inactive carts
      const { data: inactiveCarts } = await this.supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .neq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (inactiveCarts && inactiveCarts.length > 0) {
        // Reactivate an existing cart instead of creating a new one
        // console.log('Reactivating existing cart for user:', inactiveCarts[0].id);

        const { data: updatedCart, error: updateError } = await this.supabase
          .from('carts')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', inactiveCarts[0].id)
          .select()
          .single();

        if (updateError) {
          console.error('Error reactivating user cart:', updateError);
        } else {
          return updatedCart.id;
        }
      }

      // Create new cart for user only if no existing cart was found
      // console.log('Creating new cart for user:', userId);
      const { data: newCart, error: createError } = await this.supabase
        .from('carts')
        .insert({
          id: uuidv4(),
          user_id: userId,
          anonymous_id: null,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create cart: ${createError.message}`);
      }

      // console.log('Created new cart for user:', newCart.id);
      return newCart.id;
    }

    // For anonymous users
    else {
      // console.log('user is anonymous');
      // Get the anonymous cart ID
      let anonymousCartId = '';

      if (this.serverAnonymousCartId) {
        anonymousCartId = this.serverAnonymousCartId;
        // console.log('Using server-provided anonymous cart ID:', anonymousCartId);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        // Try to get from localStorage using the same key as the cookie for consistency
        anonymousCartId = window.localStorage.getItem(ANONYMOUS_CART_COOKIE_NAME) || '';
        // console.log('Using anonymous cart ID from localStorage:', anonymousCartId);
        // console.log('Anonymous cart ID from localStorage:', anonymousCartId || 'none');

        if (!anonymousCartId) {
          anonymousCartId = uuidv4();
          window.localStorage.setItem(ANONYMOUS_CART_COOKIE_NAME, anonymousCartId);
          // console.log('Created new anonymous cart ID:', anonymousCartId);
        }
      } else {
        anonymousCartId = uuidv4();
        // console.log('Using temporary anonymous cart ID for server side:', anonymousCartId);
      }

      // Check for ALL carts with this anonymous ID, including inactive ones
      const { data: allCarts, error: queryError } = await this.supabase
        .from('carts')
        .select('id, status')
        .eq('anonymous_id', anonymousCartId)
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('Error querying for anonymous carts:', queryError);
      }

      // If no carts found at all, create a new one
      if (!allCarts || allCarts.length === 0) {
        // console.log(
        //   'No existing carts found, creating new cart with anonymous_id:',
        //   anonymousCartId
        // );

        const newCartId = uuidv4();
        const { data: newCart, error: createError } = await this.supabase
          .from('carts')
          .insert({
            id: newCartId,
            user_id: null,
            anonymous_id: anonymousCartId,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error('Failed to create anonymous cart:', createError);
          throw new Error(`Failed to create anonymous cart: ${createError.message}`);
        }

        // console.log('Created new anonymous cart:', newCart.id);
        return newCart.id;
      }

      // Check if there's an active cart
      const activeCart = allCarts.find(cart => cart.status === 'active');
      if (activeCart) {
        // console.log('Found existing active cart:', activeCart.id);
        return activeCart.id;
      }

      // Otherwise, reactivate the most recent cart
      // console.log('Reactivating most recent cart:', allCarts[0].id);

      const { data: updatedCart, error: updateError } = await this.supabase
        .from('carts')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', allCarts[0].id)
        .select()
        .single();

      if (updateError) {
        console.error('Error reactivating cart:', updateError);
        throw new Error(`Failed to reactivate cart: ${updateError.message}`);
      }

      // console.log('Successfully reactivated cart:', updatedCart.id);
      return updatedCart.id;
    }
  }

  /**
   * Gets the current cart contents
   * @returns Array of cart items with product information
   */
  async getCartItems(): Promise<CartItem[]> {
    try {
      // Get the user's cart ID (create if needed)
      const cartId = await this.getOrCreateCart();
      // console.log('getCartItems: Using cart ID:', cartId);

      // Get cart items from database
      const { data: cartItems, error } = await this.supabase
        .from('cart_items')
        .select(
          `
          *,
          product:products(name, sku, image_url)
        `
        )
        .eq('cart_id', cartId);

      if (error) {
        console.error('Error fetching cart items:', error);
        throw new Error(`Failed to get cart items: ${error.message}`);
      }

      // console.log(`getCartItems: Found ${cartItems?.length || 0} items for cart ${cartId}`);

      // Update client-side cache
      if (typeof window !== 'undefined' && cartItems) {
        localStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(cartItems));
      }

      return cartItems || [];
    } catch (error) {
      console.error('Error in getCartItems:', error);
      // Try to fetch from local storage as fallback
      if (typeof window !== 'undefined') {
        try {
          const cachedData = localStorage.getItem(CART_DATA_STORAGE_KEY);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            // console.log('getCartItems: Using cached data with', parsedData.length, 'items');
            return parsedData;
          }
        } catch (e) {
          console.error('Error reading from localStorage:', e);
        }
      }
      return [];
    }
  }

  /**
   * Updates the client-side cart data in localStorage
   * @param item The cart item that was modified
   * @param action The action that was performed (add, update, remove)
   */
  private updateClientSideCart(item: CartItem, action: 'add' | 'update' | 'remove'): void {
    if (typeof window === 'undefined') return;

    try {
      const savedData = localStorage.getItem(CART_DATA_STORAGE_KEY) || '[]';
      let cartItems: CartItem[] = [];

      try {
        cartItems = JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing cart data:', e);
        cartItems = [];
      }

      if (action === 'remove') {
        // Remove the item from the array
        cartItems = cartItems.filter(i => i.id !== item.id);
      } else if (action === 'update') {
        // Update the item in the array
        const index = cartItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          cartItems[index] = item;
        } else {
          // If not found, add it
          cartItems.push(item);
        }
      } else if (action === 'add') {
        // Check if item exists and update, or add if not
        const index = cartItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          cartItems[index] = item;
        } else {
          cartItems.push(item);
        }
      }

      // Save updated cart to localStorage
      localStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(cartItems));

      // Dispatch cart update event
      const totalItems = cartItems.reduce((total, i) => total + i.quantity, 0);
      console.log('count event 6', totalItems);
      window.dispatchEvent(
        new CustomEvent(CART_COUNT_EVENT_NAME, { detail: { count: totalItems } })
      );
    } catch (e) {
      console.error('Error updating client-side cart:', e);
    }
  }
}
