import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { CartItem } from '../types/cart.types';
import { dbCartItem2CartItem, DbCartItemWithProduct } from '~/features/checkout/api/loaders';
import {
  ANONYMOUS_CART_COOKIE_NAME,
  CART_DATA_STORAGE_KEY,
  PREFERRED_CART_PREFIX,
  CURRENT_CART_ID_KEY,
  CART_COUNT_EVENT_NAME,
} from '../constants';

export interface AddToCartParams {
  productId: string;
  quantity: number;
  price: number;
  variantId?: string;
}

/**
 * Service for managing shopping cart operations in Supabase
 */
export class CartService {
  private supabase: SupabaseClient;
  // Cart ID caching for repeated calls within the same request/render
  private cachedCartId: string | null = null;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Adds an item to the cart
   * @param params Cart item parameters
   * @returns The newly created or updated cart item
   */
  async addToCart(params: AddToCartParams): Promise<CartItem> {
    const { productId, quantity, price, variantId } = params;

    // Get the user's cart ID (create if needed)
    const cartId = await this.getOrCreateCart();

    // Check if we have an authenticated user
    await this.supabase.auth.getSession();

    try {
      // First check if the item already exists in the cart
      const { data: existingItems, error: queryError } = await this.supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .is('variant_id', variantId || null);

      if (queryError) {
        console.error('Error querying cart items:', queryError);
        throw new Error(`Failed to check cart items: ${queryError.message}`);
      }

      const now = new Date().toISOString();
      let result: CartItem;

      if (existingItems && existingItems.length > 0) {
        // Update existing item
        const existingItem = existingItems[0];
        const newQuantity = existingItem.quantity + quantity;

        const { data: updatedItem, error: updateError } = await this.supabase
          .from('cart_items')
          .update({
            quantity: newQuantity,
            updated_at: now,
          })
          .eq('id', existingItem.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating cart item:', updateError);
          throw new Error(`Failed to update cart item: ${updateError.message}`);
        }

        result = updatedItem;
      } else {
        // Add new item
        const { data: newItem, error: insertError } = await this.supabase
          .from('cart_items')
          .insert({
            id: uuidv4(),
            cart_id: cartId,
            product_id: productId,
            variant_id: variantId || null,
            quantity,
            price,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting cart item:', insertError);
          throw new Error(`Failed to add item to cart: ${insertError.message}`);
        }

        result = newItem;
      }

      // Update client-side cache
      this.updateClientSideCart(result, 'add');
      return result;
    } catch (error) {
      console.error('Error in addToCart:', error);
      throw error;
    }
  }

  /**
   * Updates the quantity of an item in the cart
   * @param itemId The ID of the item to update
   * @param quantity The new quantity
   * @returns The updated item
   */
  async updateCartItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    try {
      // First, get the current item to compare
      const { data: currentItem } = await this.supabase
        .from('cart_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (!currentItem) {
        throw new Error(`Cart item with ID ${itemId} not found`);
      }

      // console.log(
      //   `CART QUANTITY UPDATE: Item ${itemId} changing from ${currentItem.quantity} to ${quantity}`
      // );

      const now = new Date().toISOString();

      // Update in database
      const { data: updatedItem, error } = await this.supabase
        .from('cart_items')
        .update({
          quantity,
          updated_at: now,
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        console.error('Error updating cart item:', error);
        throw new Error(`Failed to update cart item: ${error.message}`);
      }

      if (!updatedItem) {
        throw new Error('Update succeeded but no item was returned');
      }

      // console.log(
      //   `CART QUANTITY UPDATE: Successfully updated item ${itemId} to quantity ${quantity}`
      // );

      // Clear local storage cache to ensure fresh data on next retrieval
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(CART_DATA_STORAGE_KEY);
          // console.log('CART QUANTITY UPDATE: Cleared localStorage cache after update');
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
      }

      // Update client-side cache with only this item
      this.updateClientSideCart(updatedItem, 'update');
      return updatedItem;
    } catch (error) {
      console.error('Error in updateCartItemQuantity:', error);
      throw error;
    }
  }

  /**
   * Removes an item from the cart
   * @param itemId The ID of the item to remove
   * @returns True if successful
   */
  async removeCartItem(itemId: string): Promise<boolean> {
    try {
      // Remove from database
      const { error } = await this.supabase.from('cart_items').delete().eq('id', itemId);

      if (error) {
        console.error('Error removing cart item:', error);
        throw new Error(`Failed to remove cart item: ${error.message}`);
      }

      // Update client-side cache
      this.updateClientSideCart({ id: itemId } as CartItem, 'remove');
      return true;
    } catch (error) {
      console.error('Error in removeCartItem:', error);
      throw error;
    }
  }

  /**
   * Clears all items from the cart
   * @returns True if successful
   */
  async clearCart(): Promise<boolean> {
    try {
      const cartId = await this.getOrCreateCart();

      // Clear from database
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
   * Gets or creates a cart for the current user with better caching and error handling
   * This implementation prioritizes finding existing carts and reduces database operations
   */
  async getOrCreateCart(): Promise<string> {
    // Use cached value if available to prevent duplicate DB calls
    if (this.cachedCartId) {
      console.log(`Using cached cart ID: ${this.cachedCartId}`);
      return this.cachedCartId;
    }
    console.log('no cached cart id found');

    // Check for a forced preferred cart ID in headers (highest priority)
    try {
      interface RequestContext {
        request?: {
          headers?: {
            get(name: string): string | null;
          };
        };
      }
      const requestContext = (this.supabase.auth as unknown as { context?: RequestContext })
        .context;
      if (requestContext?.request?.headers) {
        const preferredCartId = requestContext.request.headers.get('X-Preferred-Cart-ID');
        if (preferredCartId) {
          // console.log(`CART SERVICE: Using preferred cart ID from header: ${preferredCartId}`);

          // Verify this cart exists and is active
          const { data: cartExists } = await this.supabase
            .from('carts')
            .select('id')
            .eq('id', preferredCartId)
            .eq('status', 'active')
            .maybeSingle();

          if (cartExists) {
            // console.log(`CART SERVICE: Verified preferred cart ID from header exists`);
            this.cachedCartId = preferredCartId;
            return preferredCartId;
          } else {
            // console.log(
            //   `CART SERVICE: Preferred cart ID from header does not exist or is not active`
            // );
          }
        }
      }
    } catch (error) {
      console.error('Error checking for preferred cart ID in headers:', error);
    }

    // First check if client-side already has a cart ID in localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedCartId = window.localStorage.getItem('current_cart_id');
        if (storedCartId) {
          // Verify this cart still exists and is active before using it
          const { data: cartExists } = await this.supabase
            .from('carts')
            .select('id')
            .eq('id', storedCartId)
            .eq('status', 'active')
            .maybeSingle();

          if (cartExists) {
            console.log(`Using stored cart ID from localStorage: ${storedCartId}`);
            this.cachedCartId = storedCartId;
            return storedCartId;
          }
          console.log(`Stored cart ID ${storedCartId} not found or not active, will find another`);
        } else {
          console.log('No stored cart ID found in localStorage');
        }
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }
    }

    // Get anonymous cart ID from cookie or localStorage
    let anonymousCartId = '';

    // Check for cookie first - highest priority
    const cookieHeader = this.getCookieHeader();
    if (cookieHeader) {
      const cookies = this.parseCookies(cookieHeader);
      anonymousCartId = cookies[ANONYMOUS_CART_COOKIE_NAME] || '';
      if (anonymousCartId) {
        console.log(`Using anonymous cart ID from cookie: ${anonymousCartId}`);
      } else {
        console.log('No anonymous cart ID found in cookie');
      }
    } else {
      console.log('No cookie header found');
    }

    // If no cookie, check localStorage
    if (!anonymousCartId && typeof window !== 'undefined' && window.localStorage) {
      try {
        anonymousCartId = window.localStorage.getItem(ANONYMOUS_CART_COOKIE_NAME) || '';
        if (anonymousCartId) {
          console.log(`Using anonymous cart ID from localStorage: ${anonymousCartId}`);
        } else {
          console.log('No anonymous cart ID found in localStorage');
        }
      } catch (e) {
        console.error('Error reading from localStorage:', e);
      }
    }

    // If we found an anonymous cart ID, make sure it's synchronized
    if (anonymousCartId && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(ANONYMOUS_CART_COOKIE_NAME, anonymousCartId);
        // Sync the cookie if we're in a browser context
        this.setAnonymousCartCookie(anonymousCartId);
        console.log('Synchronized anonymous cart ID with cookie and localStorage');
      } catch (e) {
        console.error('Error synchronizing anonymous cart ID:', e);
      }
    }

    // Try to get the authenticated user's session
    const { data: sessionData } = await this.supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    console.log('user id: ', userId);

    // FIRST: Check if there's a cart ID we previously determined for this anonymous ID
    // This is to fix the issue with multiple cart IDs for the same anonymous ID
    if (anonymousCartId) {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const preferredCartId = window.localStorage.getItem(
            `${PREFERRED_CART_PREFIX}${anonymousCartId}`
          );
          if (preferredCartId) {
            // Verify this cart still exists and is active before using it
            const { data: cartExists } = await this.supabase
              .from('carts')
              .select('id')
              .eq('id', preferredCartId)
              .eq('status', 'active')
              .maybeSingle();

            if (cartExists) {
              console.log(`Using preferred cart ID for this anonymous ID: ${preferredCartId}`);
              this.cachedCartId = preferredCartId;

              // Store in localStorage for future requests
              window.localStorage.setItem(CURRENT_CART_ID_KEY, preferredCartId);

              return preferredCartId;
            } else {
              console.log(`Preferred cart ID ${preferredCartId} not found or not active`);
            }
          } else {
            console.log(`No preferred cart ID found for this anonymous ID: ${anonymousCartId}`);
          }
        } catch (e) {
          console.error('Error checking preferred cart ID:', e);
        }
      }

      // PRIORITY 1: Look for carts with this anonymous ID that have items
      console.log('PRIORITY 1: Look for carts with this anonymous ID that have items');
      try {
        const { data: cartsWithItems } = await this.supabase
          .from('carts')
          .select('id, cart_items!inner(id)')
          .eq('anonymous_id', anonymousCartId)
          .eq('status', 'active');

        if (cartsWithItems && cartsWithItems.length > 0) {
          // If we found multiple carts with items, we need to consolidate them
          if (cartsWithItems.length > 1) {
            console.log(
              `Found ${cartsWithItems.length} active carts for anonymous ID ${anonymousCartId}. Will consolidate.`
            );

            // Use the most recently updated cart as the primary one
            const preferredCartId = cartsWithItems[0].id; // First one is most recent due to order

            // Store this as the preferred cart ID
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem(
                `${PREFERRED_CART_PREFIX}${anonymousCartId}`,
                preferredCartId
              );
              window.localStorage.setItem(CURRENT_CART_ID_KEY, preferredCartId);
              console.log(`Stored preferred cart ID: ${preferredCartId}`);
            }

            // Start consolidation in the background (don't await)
            this.consolidateCarts(
              cartsWithItems.map(c => c.id),
              preferredCartId
            ).catch(error => {
              console.error('Cart consolidation failed:', error);
            });

            console.log(`Using consolidated preferred cart ID: ${preferredCartId}`);
            this.cachedCartId = preferredCartId;
            return preferredCartId;
          } else {
            console.log(`not found multiple carts with items for anonymous ID ${anonymousCartId}`);
          }

          // Just one cart with items - use it
          const cartId = cartsWithItems[0].id;
          console.log(`Found cart with items for anonymous ID ${anonymousCartId}: ${cartId}`);

          // Store as preferred cart
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(`preferred_cart_${anonymousCartId}`, cartId);
            window.localStorage.setItem('current_cart_id', cartId);
            console.log(`Stored preferred cart ID: ${cartId}`);
          }

          this.cachedCartId = cartId;
          return cartId;
        } else {
          console.log(`No carts with items for anonymous ID ${anonymousCartId}`);
        }
      } catch (error) {
        console.error('Error finding carts with items for anonymous ID:', error);
      }
    }

    // PRIORITY 2: Find cart with items
    // This query is optimized to find carts with items in a single operation
    console.log('PRIORITY 2: Find cart matching cookie first, then any cart with items');
    try {
      // IMPORTANT: First, check for carts that match the anonymous ID from the cookie
      if (anonymousCartId) {
        console.log(`Looking for cart with anonymous ID: ${anonymousCartId}`);
        const { data: cartsWithAnonymousId } = await this.supabase
          .from('carts')
          .select('id')
          .eq('anonymous_id', anonymousCartId)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (cartsWithAnonymousId && cartsWithAnonymousId.length > 0) {
          const cartId = cartsWithAnonymousId[0].id;
          console.log(`Found cart matching anonymous ID cookie: ${cartId}`);
          this.cachedCartId = cartId;

          // Store in localStorage for future requests
          if (typeof window !== 'undefined' && window.localStorage) {
            console.log(`Storing cookie-matched cart ID in localStorage: ${cartId}`);
            try {
              window.localStorage.setItem('current_cart_id', cartId);
              window.localStorage.setItem(`${PREFERRED_CART_PREFIX}${anonymousCartId}`, cartId);
            } catch (e) {
              console.error('Error saving to localStorage:', e);
            }
          }

          return cartId;
        } else {
          console.log(`No cart found with anonymous ID: ${anonymousCartId}`);
        }
      }

      // Only if we can't find a cart matching the anonymous ID, then look for any cart with items
      let cartsWithItemsQuery = this.supabase
        .from('carts')
        .select('id, cart_items!inner(id)')
        .eq('status', 'active')
        .limit(1);

      // Add user specific filters if available
      if (userId) {
        cartsWithItemsQuery = cartsWithItemsQuery.eq('user_id', userId);
      } else if (anonymousCartId) {
        cartsWithItemsQuery = cartsWithItemsQuery.eq('anonymous_id', anonymousCartId);
      }

      const { data: cartsWithItems } = await cartsWithItemsQuery;

      if (cartsWithItems && cartsWithItems.length > 0) {
        if (cartsWithItems.length > 1) {
          console.log(`Found ${cartsWithItems.length} active carts with items. Will consolidate.`);
        }
        const cartId = cartsWithItems[0].id;
        console.log(`Found cart with items: ${cartId}`);
        this.cachedCartId = cartId;

        // Store in localStorage for future requests
        if (typeof window !== 'undefined' && window.localStorage) {
          console.log(`Storing cart ID in localStorage: ${cartId}`);
          try {
            window.localStorage.setItem('current_cart_id', cartId);
            if (anonymousCartId) {
              window.localStorage.setItem(`${PREFERRED_CART_PREFIX}${anonymousCartId}`, cartId);
            }
          } catch (e) {
            console.error('Error saving to localStorage:', e);
          }
        }

        return cartId;
      }
    } catch (error) {
      console.error('Error finding cart with items:', error);
    }

    // PRIORITY 3: Find active cart for user or anonymous ID
    console.log('PRIORITY 3: Find active cart for user or anonymous ID');
    try {
      let query = this.supabase
        .from('carts')
        .select('id')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (anonymousCartId) {
        query = query.eq('anonymous_id', anonymousCartId);
      }

      const { data: existingCarts } = await query;

      if (existingCarts && existingCarts.length > 0) {
        if (existingCarts.length > 1) {
          console.log(
            `Found ${existingCarts.length} active carts for user or anonymous ID. Will consolidate.`
          );
        }
        const cartId = existingCarts[0].id;
        console.log(`Found existing active cart: ${cartId}`);
        this.cachedCartId = cartId;

        // Store in localStorage for future requests
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            window.localStorage.setItem('current_cart_id', cartId);
            if (anonymousCartId) {
              window.localStorage.setItem(`preferred_cart_${anonymousCartId}`, cartId);
            }
          } catch (e) {
            console.error('Error saving to localStorage:', e);
          }
        }

        return cartId;
      }
    } catch (error) {
      console.error('Error finding active cart:', error);
    }

    // PRIORITY 4: Create a new cart
    // If we don't have an anonymousCartId yet, generate one
    console.log('PRIORITY 4: Create a new cart');
    if (!anonymousCartId) {
      anonymousCartId = uuidv4();
      console.log(`Generated new anonymous cart ID: ${anonymousCartId}`);

      // Save to localStorage if available
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(ANONYMOUS_CART_COOKIE_NAME, anonymousCartId);
          window.localStorage.setItem('anonymousCartId', anonymousCartId); // For backward compatibility
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
      }

      // Set cookie for future server-side requests
      try {
        this.setAnonymousCartCookie(anonymousCartId);
      } catch (cookieError) {
        console.log(`Unable to set anonymous cart cookie: ${anonymousCartId}.`);
      }
    }

    // Create a new cart with necessary info
    const newCartId = uuidv4();
    try {
      const cartData = userId
        ? {
            id: newCartId,
            user_id: userId,
            anonymous_id: anonymousCartId || null,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : {
            id: newCartId,
            user_id: null,
            anonymous_id: anonymousCartId,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

      const { data: newCart, error: createError } = await this.supabase
        .from('carts')
        .insert(cartData)
        .select()
        .single();

      if (createError) {
        console.error('Failed to create cart:', createError);
        // Return a temporary ID that will work for the current session
        // This prevents failures but doesn't persist to the database
        const tempId = uuidv4();
        console.log(`Using temporary cart ID as fallback: ${tempId}`);
        return tempId;
      }

      console.log(`Created new cart: ${newCart.id}`);
      this.cachedCartId = newCart.id;

      // Store in localStorage for future requests
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem('current_cart_id', newCart.id);
          if (anonymousCartId) {
            window.localStorage.setItem(`preferred_cart_${anonymousCartId}`, newCart.id);
          }
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
      }

      return newCart.id;
    } catch (error) {
      console.error('Error creating new cart:', error);
      const tempId = uuidv4();
      console.log(`Using temporary cart ID after error: ${tempId}`);
      return tempId;
    }
  }

  /**
   * Consolidates multiple carts by moving all items to a single preferred cart
   * @param cartIds Array of cart IDs to consolidate
   * @param preferredCartId The preferred cart ID to consolidate items into
   */
  async consolidateCarts(cartIds: string[], preferredCartId: string): Promise<void> {
    try {
      if (!cartIds.length || !preferredCartId) return;

      console.log(`Consolidating ${cartIds.length} carts into preferred cart: ${preferredCartId}`);

      // Get items from all carts except the preferred one
      const otherCartIds = cartIds.filter(id => id !== preferredCartId);
      if (otherCartIds.length === 0) return;

      console.log(`Moving items from ${otherCartIds.join(', ')} to ${preferredCartId}`);

      // Get all items from all other carts
      const { data: itemsToMove, error: fetchError } = await this.supabase
        .from('cart_items')
        .select('*')
        .in('cart_id', otherCartIds);

      if (fetchError) {
        console.error('Error fetching items to consolidate:', fetchError);
        return;
      }

      if (!itemsToMove || itemsToMove.length === 0) {
        console.log('No items to consolidate');
        return;
      }

      console.log(`Found ${itemsToMove.length} items to consolidate`);

      // Get items from the preferred cart for deduplication
      const { data: preferredCartItems } = await this.supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', preferredCartId);

      const preferredItemsMap = new Map();
      if (preferredCartItems) {
        preferredCartItems.forEach(item => {
          const key = `${item.product_id}:${item.variant_id || 'null'}`;
          preferredItemsMap.set(key, item);
        });
      }

      // Process each item to move
      const now = new Date().toISOString();
      interface CartItemUpdate {
        id: string;
        quantity: number;
        updated_at: string;
      }

      const updates: CartItemUpdate[] = [];
      const inserts: CartItem[] = [];

      for (const item of itemsToMove) {
        const key = `${item.product_id}:${item.variant_id || 'null'}`;

        if (preferredItemsMap.has(key)) {
          // Update existing item in preferred cart
          const preferredItem = preferredItemsMap.get(key);
          updates.push({
            id: preferredItem.id,
            quantity: preferredItem.quantity + item.quantity,
            updated_at: now,
          });
        } else {
          // Insert as new item in preferred cart
          inserts.push({
            ...item,
            id: uuidv4(), // New ID to avoid conflicts
            cart_id: preferredCartId,
            created_at: now,
            updated_at: now,
          });
        }
      }

      // Perform updates
      if (updates.length > 0) {
        console.log(`Updating ${updates.length} existing items in preferred cart`);
        for (const update of updates) {
          await this.supabase
            .from('cart_items')
            .update({ quantity: update.quantity, updated_at: update.updated_at })
            .eq('id', update.id);
        }
      }

      // Perform inserts
      if (inserts.length > 0) {
        console.log(`Inserting ${inserts.length} new items into preferred cart`);
        await this.supabase.from('cart_items').insert(inserts);
      }

      // Mark other carts as consolidated
      console.log(`Marking ${otherCartIds.length} carts as consolidated`);
      await this.supabase
        .from('carts')
        .update({ status: 'consolidated', updated_at: now })
        .in('id', otherCartIds);

      console.log('Cart consolidation complete');
    } catch (error) {
      console.error('Error consolidating carts:', error);
    }
  }

  /**
   * Gets the cookie header from the request if available
   * @returns The cookie header string or null
   */
  private getCookieHeader(): string | null {
    try {
      // Define a type for the expected context structure
      interface RequestContext {
        request?: {
          headers?: {
            get(name: string): string | null;
          };
        };
      }

      // More specific type casting
      const authContext = (this.supabase.auth as unknown as { context?: RequestContext }).context;

      if (authContext?.request?.headers) {
        return authContext.request.headers.get('cookie') || null;
      }
      return null;
    } catch (e) {
      console.error('Error accessing cookie header:', e);
      // Consider throwing a custom error or handling it differently
      return null;
    }
  }

  /**
   * Parse cookie string into key-value pairs
   * @param cookieString The cookie header string
   * @returns Object with cookie key-value pairs
   */
  private parseCookies(cookieString: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!cookieString) return cookies;

    cookieString.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      const value = parts.length > 1 ? parts[1].trim() : '';
      if (name) cookies[name] = value;
    });

    return cookies;
  }

  /**
   * Sets the anonymous cart cookie for server-side tracking
   * This version gracefully handles missing response context
   * @param anonymousCartId The anonymous cart ID to set
   */
  private setAnonymousCartCookie(anonymousCartId: string): void {
    if (!anonymousCartId?.trim()) {
      throw new Error('Invalid anonymous cart ID');
    }

    try {
      interface AuthContext {
        response?: {
          headers: {
            append(name: string, value: string): void;
          };
        };
      }

      const contextObject = (this.supabase.auth as unknown as { context?: AuthContext }).context;

      // Check if response context is available - if not, just return silently
      if (!contextObject?.response) {
        console.log('Response context not available for setting cookie - skipping');
        return; // Skip cookie setting instead of throwing an error
      }

      // Only proceed if we have a valid response context
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);

      const cookieValue = [
        `notalock_anonymous_cart=${encodeURIComponent(anonymousCartId)}`,
        'Path=/',
        `Expires=${expires.toUTCString()}`,
        'SameSite=Lax',
        'HttpOnly',
        'Secure',
      ].join('; ');

      contextObject.response.headers.append('Set-Cookie', cookieValue);
      console.log(`Anonymous cart cookie set successfully: ${anonymousCartId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Failed to set anonymous cart cookie: ${errorMessage}`);
      // Don't throw an error to prevent breaking the checkout flow
    }
  }

  /**
   * Gets the current cart contents
   * @returns Array of cart items with product information
   */
  async getCartItems(): Promise<CartItem[]> {
    try {
      const cartId = await this.getOrCreateCart();
      // console.log(`getCartItems: Using cart ID: ${cartId}`);

      // IMPORTANT: Always clear the client-side cache before querying
      // This ensures we get fresh data every time
      if (typeof window !== 'undefined') {
        try {
          // Clear the cart data cache to ensure we get fresh data
          localStorage.removeItem(CART_DATA_STORAGE_KEY);
          // console.log('CART SERVICE: Cleared localStorage cache to ensure fresh data');
        } catch (e) {
          console.error('CART SERVICE: Error clearing localStorage:', e);
        }
      }

      // Get cart items from database with NO caching
      const {
        data: cartItems,
        error,
      }: {
        data: DbCartItemWithProduct[] | null;
        error: PostgrestError | null;
      } = await this.supabase
        .from('cart_items')
        .select(
          `
          *,
          product:products(name, sku, image_url)
        `
        )
        .eq('cart_id', cartId);

      if (error) {
        console.error('CART SERVICE: Error fetching cart items:', error);
        throw new Error(`Failed to get cart items: ${error.message}`);
      }

      if (!cartItems) {
        // console.log('CART SERVICE: No cart items found in database, returning empty array');
        return [];
      }

      /*
      console.log(`getCartItems: Found ${cartItems.length} items for cart ${cartId}`);
      cartItems.forEach(item => {
        console.log(
          `CART ITEM DEBUG: ID=${item.id}, product=${item.product_id}, quantity=${item.quantity}`
        );
      });
*/

      // Update client-side cache with fresh data
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(cartItems));
          // console.log('CART SERVICE: Updated localStorage cache with fresh cart items');

          // Store the current cart ID in localStorage too
          localStorage.setItem('current_cart_id', cartId);
        } catch (e) {
          console.error('CART SERVICE: Error updating localStorage:', e);
        }
      }

      // Transform and return
      return cartItems.map(item => dbCartItem2CartItem(item));
    } catch (error) {
      console.error('CART SERVICE: Error in getCartItems:', error);

      // Try to fetch from local storage as fallback, but only if we can't reach the database
      if (typeof window !== 'undefined') {
        try {
          const cachedData = localStorage.getItem(CART_DATA_STORAGE_KEY);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            // console.log(
            //   `CART SERVICE: Using ${parsedData.length} items from localStorage fallback`
            // );
            return parsedData;
          }
        } catch (e) {
          // console.error('CART SERVICE: Error reading from localStorage:', e);
        }
      }
      // console.log('CART SERVICE: Returning empty array after all retrieval attempts failed');
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
      const cartDataKey = CART_DATA_STORAGE_KEY;

      // Attempt to get fresh data first
      let cartItems: CartItem[] = [];
      try {
        // First try to get items directly from the database to ensure we have the latest data
        this.getCartItems()
          .then(() => {
            // console.log('CART UPDATE: Retrieved fresh cart data for client-side update');
            // Just trigger the retrieval - we don't need to wait for the result
            // The next time getCartItems is called, it will use fresh data
          })
          .catch(e => {
            console.error('Failed to retrieve fresh cart data:', e);
          });

        // Meanwhile, work with what we have in localStorage
        const savedData = localStorage.getItem(cartDataKey) || '[]';
        try {
          cartItems = JSON.parse(savedData);
        } catch (e) {
          console.error('Error parsing cart data:', e);
          cartItems = [];
        }
      } catch (e) {
        console.error('Error getting fresh cart data:', e);
        // If retrieval fails, use existing localStorage if available
        const savedData = localStorage.getItem(cartDataKey) || '[]';
        try {
          cartItems = JSON.parse(savedData);
        } catch (e) {
          console.error('Error parsing cart data:', e);
          cartItems = [];
        }
      }

      // console.log(`CART CLIENT: Current items in localStorage: ${cartItems.length}`);

      if (action === 'remove') {
        // Remove the item from the array
        cartItems = cartItems.filter(i => i.id !== item.id);
        // console.log(`CART CLIENT: Removed item ${item.id}, now have ${cartItems.length} items`);
      } else if (action === 'update') {
        // Update the item in the array
        const index = cartItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          // console.log(
          //   `CART CLIENT: Updating item ${item.id}, quantity from ${cartItems[index].quantity} to ${item.quantity}`
          // );
          cartItems[index] = item;
        } else {
          // If not found, add it
          // console.log(
          //   `CART CLIENT: Adding item ${item.id} with quantity ${item.quantity} (not found in cache)`
          // );
          cartItems.push(item);
        }
      } else if (action === 'add') {
        // Check if item exists and update, or add if not
        const index = cartItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          // console.log(
          //   `CART CLIENT: Updating existing item ${item.id} with quantity ${item.quantity}`
          // );
          cartItems[index] = item;
        } else {
          // console.log(`CART CLIENT: Adding new item ${item.id} with quantity ${item.quantity}`);
          cartItems.push(item);
        }
      }

      // Save updated cart to localStorage
      localStorage.setItem(cartDataKey, JSON.stringify(cartItems));

      // Dispatch cart update event
      const totalItems = cartItems.reduce((total, i) => total + i.quantity, 0);
      console.log('count event 5', totalItems);
      window.dispatchEvent(
        new CustomEvent(CART_COUNT_EVENT_NAME, { detail: { count: totalItems } })
      );

      // Log update for debugging
      // console.log(
      //   `CART CLIENT: Updated client-side cart (${action}), now has ${cartItems.length} items with total quantity ${totalItems}`
      // );
    } catch (e) {
      console.error('Error updating client-side cart:', e);
    }
  }

  /**
   * Merges a guest cart with a user cart
   * @param anonymousCartId The anonymous cart ID to merge from
   * @param userId The user ID to merge to
   * @returns True if successful
   */
  async mergeAnonymousCart(anonymousCartId: string, userId: string): Promise<boolean> {
    try {
      // Get the anonymous cart
      const { data: anonymousCart } = await this.supabase
        .from('carts')
        .select('id')
        .eq('anonymous_id', anonymousCartId)
        .eq('status', 'active')
        .single();

      if (!anonymousCart) return false;

      // Get the user cart or create one
      const { data: userCarts } = await this.supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1);

      let userCartId: string;

      if (!userCarts || userCarts.length === 0) {
        // Create a new cart for the user
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
          throw new Error(`Failed to create user cart: ${createError.message}`);
        }

        userCartId = newCart.id;
      } else {
        userCartId = userCarts[0].id;
      }

      // Get the items from the anonymous cart
      const { data: anonymousItems } = await this.supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', anonymousCart.id);

      if (!anonymousItems || anonymousItems.length === 0) return true;

      // Get the items from the user cart
      const { data: userItems } = await this.supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', userCartId);

      const userItemsMap = new Map();
      if (userItems) {
        userItems.forEach(item => {
          const key = `${item.product_id}:${item.variant_id || 'null'}`;
          userItemsMap.set(key, item);
        });
      }

      // Process each anonymous item
      const now = new Date().toISOString();
      const updates = [];
      const inserts = [];

      for (const item of anonymousItems) {
        const key = `${item.product_id}:${item.variant_id || 'null'}`;

        if (userItemsMap.has(key)) {
          // Update quantity of existing item
          const userItem = userItemsMap.get(key);
          updates.push({
            id: userItem.id,
            quantity: userItem.quantity + item.quantity,
            updated_at: now,
          });
        } else {
          // Insert as new item
          inserts.push({
            id: uuidv4(),
            cart_id: userCartId,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price: item.price,
            created_at: now,
            updated_at: now,
          });
        }
      }

      // Perform the updates
      if (updates.length > 0) {
        for (const update of updates) {
          await this.supabase
            .from('cart_items')
            .update({ quantity: update.quantity, updated_at: update.updated_at })
            .eq('id', update.id);
        }
      }

      // Perform the inserts
      if (inserts.length > 0) {
        await this.supabase.from('cart_items').insert(inserts);
      }

      // Mark the anonymous cart as merged
      await this.supabase
        .from('carts')
        .update({ status: 'merged', updated_at: now })
        .eq('id', anonymousCart.id);

      return true;
    } catch (error) {
      console.error('Error merging anonymous cart:', error);
      return false;
    }
  }
}
