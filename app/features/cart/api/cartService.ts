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
      // For anonymous users, use anonymous cart ID from localStorage
      let anonymousCartId = '';

      if (typeof window !== 'undefined' && window.localStorage) {
        anonymousCartId = window.localStorage.getItem('anonymousCartId') || '';

        if (!anonymousCartId) {
          // Create new anonymous cart if none exists
          anonymousCartId = uuidv4();
          window.localStorage.setItem('anonymousCartId', anonymousCartId);
        }
      } else {
        // For server-side, generate a temporary ID
        anonymousCartId = uuidv4();
      }

      // Check if this anonymous cart exists in the database
      try {
        const { data: anonCarts, error: anonCartsError } = await this.supabase
          .from('carts')
          .select('id')
          .eq('anonymous_id', anonymousCartId)
          .eq('status', 'active')
          .limit(1);

        if (anonCartsError) {
          throw new Error(`Failed to get anonymous carts: ${anonCartsError.message}`);
        }

        if (anonCarts && anonCarts.length > 0) {
          return anonCarts[0].id;
        }
      } catch (error) {
        console.error('Error checking for existing anonymous cart:', error);
        // Continue to create a new cart
      }

      // Create new anonymous cart
      const { data: newAnonCart, error: createAnonError } = await this.supabase
        .from('carts')
        .insert({
          id: uuidv4(),
          anonymous_id: anonymousCartId,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createAnonError) {
        throw new Error(`Failed to create anonymous cart: ${createAnonError.message}`);
      }

      return newAnonCart.id;
    }
  }

  /**
   * Gets the current cart contents
   * @returns Array of cart items with product information
   */
  async getCartItems(): Promise<CartItem[]> {
    try {
      const cartId = await this.getOrCreateCart();

      const { data, error } = await this.supabase
        .from('cart_items')
        .select(
          `
          *,
          product:products(name, sku, thumbnail_url:image_url)
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
          thumbnail_url: string | null;
        } | null;
      };

      return data.map((item: RawCartItem) => ({
        ...item,
        product: item.product
          ? {
              ...item.product,
              image_url: item.product.thumbnail_url,
            }
          : undefined,
      }));
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  }
}
