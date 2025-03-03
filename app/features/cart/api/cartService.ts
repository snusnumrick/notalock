import type { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { CartItem } from '../types/cart.types';

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
    const { data: sessionData } = await this.supabase.auth.getSession();
    const isAuthenticated = !!sessionData.session?.user.id;

    // For anonymous users, handle cart items in localStorage
    if (!isAuthenticated && typeof window !== 'undefined') {
      const cartDataKey = 'notalock_cart_data';
      const now = new Date().toISOString();
      const newItemId = uuidv4();

      // Try to get existing cart items
      const savedData = window.localStorage.getItem(cartDataKey) || '[]';
      let cartItems: CartItem[] = [];

      try {
        cartItems = JSON.parse(savedData);
      } catch (error) {
        console.error('Error parsing cart data:', error);
        cartItems = [];
      }

      // Check if item already exists in cart
      const existingItemIndex = cartItems.findIndex(
        item =>
          item.product_id === productId &&
          ((!variantId && !item.variant_id) || variantId === item.variant_id)
      );

      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        cartItems[existingItemIndex].quantity += quantity;
        cartItems[existingItemIndex].updated_at = now;

        // Save updated cart to localStorage
        window.localStorage.setItem(cartDataKey, JSON.stringify(cartItems));

        // Dispatch cart update event
        const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
        window.dispatchEvent(
          new CustomEvent('cart-count-update', { detail: { count: totalItems } })
        );

        return cartItems[existingItemIndex];
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          id: newItemId,
          cart_id: cartId,
          product_id: productId,
          variant_id: variantId || null,
          quantity: quantity,
          price: price,
          created_at: now,
          updated_at: now,
        };

        cartItems.push(newItem);

        // Save updated cart to localStorage
        window.localStorage.setItem(cartDataKey, JSON.stringify(cartItems));

        // Dispatch cart update event
        const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
        window.dispatchEvent(
          new CustomEvent('cart-count-update', { detail: { count: totalItems } })
        );

        return newItem;
      }
    }

    // Check if product already exists in cart
    const { data: existingItems, error: queryError } = await this.supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .is('variant_id', variantId ? variantId : null)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" error
      throw new Error(`Failed to query cart items: ${queryError.message}`);
    }

    if (existingItems) {
      // Update quantity of existing item
      const { data: updatedItem, error: updateError } = await this.supabase
        .from('cart_items')
        .update({
          quantity: existingItems.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItems.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update cart item: ${updateError.message}`);
      }

      return updatedItem as CartItem;
    } else {
      // Add new item to cart
      const { data: newItem, error: insertError } = await this.supabase
        .from('cart_items')
        .insert({
          id: uuidv4(),
          cart_id: cartId,
          product_id: productId,
          variant_id: variantId || null,
          quantity: quantity,
          price: price,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to add item to cart: ${insertError.message}`);
      }

      return newItem as CartItem;
    }
  }

  /**
   * Gets the current cart or creates a new one if needed
   * @returns The cart ID
   * @private
   */
  private async getOrCreateCart(): Promise<string> {
    // Try to get the authenticated user's session
    const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession();

    if (sessionError) {
      throw new Error(`Failed to get user session: ${sessionError.message}`);
    }

    const userId = sessionData.session?.user.id;

    // For authenticated users, get their assigned cart
    if (userId) {
      const { data: userCarts, error: cartsError } = await this.supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (cartsError) {
        throw new Error(`Failed to get user carts: ${cartsError.message}`);
      }

      if (userCarts && userCarts.length > 0) {
        return userCarts[0].id;
      }

      // Create new cart for user
      const { data: newCart, error: createError } = await this.supabase
        .from('carts')
        .insert({
          id: uuidv4(),
          user_id: userId,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create cart: ${createError.message}`);
      }

      return newCart.id;
    } else {
      // For anonymous users, we'll use a client-side only approach
      // This avoids RLS policy issues completely
      let anonymousCartId = '';

      if (typeof window !== 'undefined' && window.localStorage) {
        anonymousCartId = window.localStorage.getItem('anonymousCartId') || '';

        if (!anonymousCartId) {
          // Create new anonymous cart ID if none exists
          anonymousCartId = uuidv4();
          window.localStorage.setItem('anonymousCartId', anonymousCartId);
        }

        // Return the ID without trying to create a cart in the database
        // We'll handle items client-side for anonymous users
        return anonymousCartId;
      } else {
        // For server-side, generate a temporary ID but don't try to store in database
        return uuidv4();
      }
    }
  }

  /**
   * Gets the current cart contents
   * @returns Array of cart items with product information
   */
  async getCartItems(): Promise<CartItem[]> {
    try {
      const cartId = await this.getOrCreateCart();

      // Check if we have an authenticated user
      const { data: sessionData } = await this.supabase.auth.getSession();
      const isAuthenticated = !!sessionData.session?.user.id;

      // If not authenticated, try getting cart items from localStorage
      if (!isAuthenticated) {
        // For anonymous users, we'll retrieve cart items from localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          const cartDataKey = 'notalock_cart_data';
          const savedData = window.localStorage.getItem(cartDataKey);
          if (savedData) {
            try {
              const parsedItems = JSON.parse(savedData);
              if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                return parsedItems;
              }
            } catch (error) {
              console.error('Error parsing localStorage cart items:', error);
            }
          }
          // If no items found in localStorage, return empty array
          return [];
        }
        // For server-side with anonymous users, return empty array
        return [];
      }

      // For authenticated users, get cart items from Supabase
      const { data, error } = await this.supabase
        .from('cart_items')
        .select(
          `
          *,
          product:products(name, sku, image_url)
        `
        )
        .eq('cart_id', cartId);

      if (error) {
        throw new Error(`Failed to get cart items: ${error.message}`);
      }

      // Transform response to match CartItem interface
      type RawCartItem = {
        id: string;
        cart_id: string;
        product_id: string;
        variant_id: string | null;
        quantity: number;
        price: number;
        created_at: string;
        updated_at: string;
        product: {
          name: string;
          sku: string;
          image_url: string | null;
        } | null;
      };

      return data.map((item: RawCartItem) => ({
        ...item,
        product: item.product || undefined,
      }));
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  }
}
