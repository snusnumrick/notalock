import type { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  CheckoutSession,
  Address,
  ShippingOption,
  PaymentInfo,
  Order,
  ShippingMethod,
  OrderDBInput,
  OrderStatus,
  DbCheckoutSession,
  OrderDbItem,
  CheckoutStep,
} from '../types/checkout.types';
import type { CartItem } from '~/features/cart/types/cart.types';
import { CartService } from '~/features/cart/api/cartService';
import { Json } from '~/features/supabase/types/Database.types';
import { PaymentMethodType } from '~/features/payment';

/**
 * Service for managing checkout processes
 */
export class CheckoutService {
  private supabase: SupabaseClient;
  private cartService: CartService;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.cartService = new CartService(supabase);
  }

  /**
   * Creates a new checkout session or returns existing one
   * With improved error handling and fewer database operations
   */
  async getOrCreateCheckoutSession(cartId: string, userId?: string): Promise<CheckoutSession> {
    try {
      console.log(`Starting checkout session creation/retrieval for cart ${cartId}`);

      // Initialize the cartItems variable
      let cartItems: CartItem[] = [];

      // Get the latest cart items to ensure consistent quantities
      try {
        // Direct database query to get the most precise, up-to-date cart items
        const { data: directCartItems } = await this.supabase
          .from('cart_items')
          .select(
            `
            *,
            product:products(name, sku, image_url)
            `
          )
          .eq('cart_id', cartId);

        if (directCartItems && directCartItems.length > 0) {
          console.log(
            `CHECKOUT: Found ${directCartItems.length} items with direct DB query to ensure accurate quantities`
          );

          // Debug log all cart items to verify correct quantities
          directCartItems.forEach(item => {
            console.log(
              `CHECKOUT QUANTITY CHECK: Item ${item.product_id} has quantity ${item.quantity}`
            );
          });

          // Get cart items through standard method for comparison
          const standardCartItems = await this.cartService.getCartItems();
          console.log(
            `Retrieved ${standardCartItems.length} items through standard CartService method`
          );

          if (standardCartItems.length > 0) {
            standardCartItems.forEach(item => {
              console.log(`STANDARD METHOD: Item ${item.product_id} has quantity ${item.quantity}`);
            });

            // If there's a difference in quantities, use the direct DB query results
            let discrepancyFound = false;
            directCartItems.forEach(directItem => {
              const matchingStandardItem = standardCartItems.find(
                std => std.product_id === directItem.product_id
              );
              if (matchingStandardItem && matchingStandardItem.quantity !== directItem.quantity) {
                console.log(
                  `QUANTITY DISCREPANCY: Item ${directItem.product_id} has ${directItem.quantity} in DB but ${matchingStandardItem.quantity} in CartService`
                );
                discrepancyFound = true;
              }
            });

            if (discrepancyFound) {
              console.log('Using direct DB query results due to quantity discrepancies');
              cartItems = directCartItems.map(item => ({
                id: item.id,
                cart_id: item.cart_id,
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                price: item.price,
                created_at: item.created_at,
                updated_at: item.updated_at,
                product: item.product
                  ? {
                      name: item.product.name ?? '',
                      sku: item.product.sku ?? '',
                      image_url: item.product.image_url,
                    }
                  : undefined,
              }));
            } else {
              console.log('No quantity discrepancies found, using standard cart items');
              cartItems = standardCartItems;
            }
          } else {
            console.log('Standard method returned no items, using direct DB query results');
            cartItems = directCartItems.map(item => ({
              id: item.id,
              cart_id: item.cart_id,
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity,
              price: item.price,
              created_at: item.created_at,
              updated_at: item.updated_at,
              product: item.product
                ? {
                    name: item.product.name ?? '',
                    sku: item.product.sku ?? '',
                    image_url: item.product.image_url,
                  }
                : undefined,
            }));
          }
        } else {
          console.log('Direct DB query found no items, falling back to standard method');
          cartItems = await this.cartService.getCartItems();
        }
      } catch (directQueryError) {
        console.log(`Error in direct cart item query: ${directQueryError}`);
        // Fall back to standard method
        cartItems = await this.cartService.getCartItems();
      }

      console.log(`Retrieved ${cartItems?.length || 0} items for cart to verify latest data`);

      // First check if we have a checkout session in the recent sessions for this cart
      // Use maybeSingle to avoid errors with multiple rows
      const { data: existingSession, error: queryError } = await this.supabase
        .from('checkout_sessions')
        .select('*')
        .eq('cart_id', cartId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (queryError) {
        console.log(`Error querying existing sessions: ${queryError.message}`);
      } else if (existingSession) {
        console.log(`Found existing checkout session: ${existingSession.id}`);
        return this.dbSessionToCheckoutSession(existingSession);
      }

      // Calculate the subtotal based on the latest cart items with correct quantities
      const subtotal =
        cartItems && cartItems.length > 0
          ? cartItems.reduce((sum, item) => {
              console.log(
                `Item ${item.product_id}: quantity ${item.quantity}, price ${item.price}`
              );
              return sum + (item.price || 0) * (item.quantity || 0);
            }, 0)
          : 0;

      console.log(`Calculated subtotal: ${subtotal} based on the latest cart items`);

      // Generate a session ID we'll use for either persisted or virtual session
      const newSessionId = uuidv4();
      console.log(`Created new session ID: ${newSessionId}`);

      // Try multiple approaches to create the session in the database
      // Approach 1: Direct insert with all fields
      try {
        const now = new Date().toISOString();
        const { data: fullSession, error: fullInsertError } = await this.supabase
          .from('checkout_sessions')
          .insert({
            id: newSessionId,
            cart_id: cartId,
            user_id: userId || null,
            current_step: 'information',
            subtotal,
            shipping_cost: 0,
            tax: 0,
            total: subtotal,
            created_at: now,
            updated_at: now,
          })
          .select()
          .maybeSingle();

        if (fullInsertError) {
          console.log('Full insert failed, will try another approach', fullInsertError);
        } else if (fullSession) {
          console.log(`Successfully created full checkout session: ${newSessionId}`);
          return this.dbSessionToCheckoutSession(fullSession);
        }
      } catch (fullInsertError) {
        console.log(
          'Exception during full session insert, trying alternative approaches',
          fullInsertError
        );
      }

      // Approach 2: Try using an RPC function if available
      try {
        const { data: functionResult, error: functionError } = await this.supabase.rpc(
          'create_checkout_session',
          {
            p_cart_id: cartId,
            p_user_id: userId || null,
            p_subtotal: subtotal,
          }
        );

        if (functionError) {
          console.log('Function approach failed', functionError);
        } else if (functionResult) {
          // Get the newly created session
          const { data: newSession, error: fetchError } = await this.supabase
            .from('checkout_sessions')
            .select('*')
            .eq('id', functionResult)
            .maybeSingle();

          if (fetchError) {
            console.log('Error fetching created session from RPC', fetchError);
          } else if (newSession) {
            console.log(`Successfully created session via RPC: ${newSession.id}`);
            return this.dbSessionToCheckoutSession(newSession);
          }
        }
      } catch (functionCallError) {
        console.log('RPC function not available or failed', functionCallError);
      }

      // Approach 3: Minimal insert + update
      try {
        // First, try a very minimal insert with just ID and created_at
        const now = new Date().toISOString();
        const { data: minimalSession, error: minimalError } = await this.supabase
          .from('checkout_sessions')
          .insert({
            id: newSessionId,
            created_at: now,
          })
          .select()
          .maybeSingle();

        if (minimalError) {
          console.log('Minimal insert failed', minimalError);
        } else if (minimalSession) {
          // If successful, then update with the rest of the fields
          try {
            await this.supabase
              .from('checkout_sessions')
              .update({
                cart_id: cartId,
                user_id: userId || null,
                current_step: 'information',
                subtotal,
                shipping_cost: 0,
                tax: 0,
                total: subtotal,
                updated_at: now,
              })
              .eq('id', newSessionId);

            // Get the updated session
            const { data: updatedSession, error: fetchError } = await this.supabase
              .from('checkout_sessions')
              .select('*')
              .eq('id', newSessionId)
              .maybeSingle();

            if (fetchError) {
              console.log('Error fetching updated session', fetchError);
            } else if (updatedSession) {
              console.log(`Successfully created and updated session: ${newSessionId}`);
              return this.dbSessionToCheckoutSession(updatedSession);
            }
          } catch (updateError) {
            console.log('Update after minimal insert failed', updateError);
          }
        }
      } catch (minimalInsertError) {
        console.log('Minimal insert approach failed', minimalInsertError);
      }

      // Last resort: Return a virtual session that's not stored in the database
      console.log(`All database approaches failed, returning virtual session: ${newSessionId}`);

      const virtualSession: CheckoutSession = {
        id: newSessionId,
        cartId,
        userId,
        subtotal,
        shippingCost: 0,
        tax: 0,
        total: subtotal,
        currentStep: 'information',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return virtualSession;
    } catch (error) {
      console.error('Error in getOrCreateCheckoutSession:', error);

      // Create an emergency virtual session as a last resort
      const emergencySessionId = uuidv4();
      console.log(`Creating emergency virtual session: ${emergencySessionId}`);

      return {
        id: emergencySessionId,
        cartId,
        userId,
        subtotal: 0,
        shippingCost: 0,
        tax: 0,
        total: 0,
        currentStep: 'information',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Updates the shipping address in a checkout session
   */
  async updateShippingAddress(
    sessionId: string,
    address: Address,
    guestEmail?: string
  ): Promise<CheckoutSession> {
    try {
      // First try to get the existing session to check if it's a virtual session
      try {
        const { data: existingSession } = await this.supabase
          .from('checkout_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        // If we can find the session, update it normally
        if (existingSession) {
          const { data, error } = await this.supabase
            .from('checkout_sessions')
            .update({
              shipping_address: address,
              guest_email: guestEmail || undefined,
              current_step: 'shipping',
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionId)
            .select()
            .single();

          if (error) {
            throw new Error(`Failed to update shipping address: ${error.message}`);
          }

          return this.dbSessionToCheckoutSession(data);
        }
      } catch (sessionLookupError) {
        // Session might be virtual, continue to fallback
        console.log('Session lookup failed, treating as virtual session', sessionLookupError);
      }

      // Fallback: Create a virtual session response
      // This is used when the session is not actually in the database (virtual session)
      return {
        id: sessionId,
        cartId: sessionId, // Use sessionId as fallback cartId for virtual session
        shippingAddress: address,
        guestEmail: guestEmail,
        currentStep: 'shipping',
        // We don't have the other fields but the frontend mostly cares about the address
        // and the current step at this point
        subtotal: 0,
        shippingCost: 0,
        tax: 0,
        total: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in updateShippingAddress:', error);
      throw error;
    }
  }

  /**
   * Updates the selected shipping method and calculates new totals
   */
  async updateShippingMethod(
    sessionId: string,
    shippingMethod: ShippingMethod,
    shippingOption: ShippingOption
  ): Promise<CheckoutSession> {
    try {
      // First get current session to calculate new totals using maybeSingle to handle multiple records gracefully
      const { data: currentSession, error: getError } = await this.supabase
        .from('checkout_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (getError) {
        throw new Error(`Failed to get checkout session: ${getError.message}`);
      }

      // If no session found, try to find the most recent one with this ID
      if (!currentSession) {
        console.log(
          `Session ${sessionId} not found for shipping update, trying to find any session with this ID`
        );
        const { data: fallbackSession, error: fallbackError } = await this.supabase
          .from('checkout_sessions')
          .select('*')
          .eq('id', sessionId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fallbackError || !fallbackSession) {
          // If we truly can't find a session, create a virtual one and update it
          console.log(`No session found for ID ${sessionId}, creating virtual session`);
          const virtualSubtotal = 0; // We don't know the real subtotal
          const virtualShippingCost = shippingOption.price;
          const virtualTaxRate = 0.08;
          const virtualTax =
            Math.round((virtualSubtotal + virtualShippingCost) * virtualTaxRate * 100) / 100;
          const virtualTotal = virtualSubtotal + virtualShippingCost + virtualTax;

          // Try to create a new session
          try {
            const { data: newSession, error: createError } = await this.supabase
              .from('checkout_sessions')
              .insert({
                id: sessionId,
                shipping_method: shippingMethod,
                shipping_option: shippingOption,
                shipping_cost: virtualShippingCost,
                subtotal: virtualSubtotal,
                tax: virtualTax,
                total: virtualTotal,
                current_step: 'payment',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .maybeSingle();

            if (createError) {
              throw new Error(`Failed to create new session: ${createError.message}`);
            }

            if (newSession) {
              return this.dbSessionToCheckoutSession(newSession);
            }
          } catch (createSessionError) {
            console.error('Error creating new session:', createSessionError);
          }

          // As a last resort, return a virtual session
          return {
            id: sessionId,
            cartId: sessionId, // Use session ID as fallback
            shippingMethod,
            shippingOption,
            shippingCost: virtualShippingCost,
            subtotal: virtualSubtotal,
            tax: virtualTax,
            total: virtualTotal,
            currentStep: 'payment',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        // Use the fallback session we found
        return this.updateShippingMethodWithSession(
          sessionId,
          shippingMethod,
          shippingOption,
          fallbackSession
        );
      }

      // Use the session we found
      return this.updateShippingMethodWithSession(
        sessionId,
        shippingMethod,
        shippingOption,
        currentSession
      );
    } catch (error) {
      console.error('Error in updateShippingMethod:', error);
      throw error;
    }
  }

  /**
   * Helper method to update shipping with an existing session
   */
  private async updateShippingMethodWithSession(
    sessionId: string,
    shippingMethod: ShippingMethod,
    shippingOption: ShippingOption,
    currentSession: Partial<CheckoutSession>
  ): Promise<CheckoutSession> {
    console.log(`Updating shipping method for session ${sessionId}`);
    console.log(`Shipping method: ${shippingMethod}, option ID: ${shippingOption.id}`);
    console.log('Current session state:', {
      id: currentSession.id,
      cartId: currentSession.cartId,
      currentStep: currentSession.currentStep,
    });

    const subtotal = currentSession.subtotal || 0;
    const shippingCost = shippingOption.price;

    // Simple tax calculation (would be more complex in production)
    const taxRate = 0.08; // 8% tax rate
    const tax = Math.round((subtotal + shippingCost) * taxRate * 100) / 100;

    const total = subtotal + shippingCost + tax;
    console.log(
      `Calculated values - subtotal: ${subtotal}, shipping: ${shippingCost}, tax: ${tax}, total: ${total}`
    );

    try {
      // Update the session using maybeSingle to handle multiple records
      console.log('Sending database update request...');
      const { data, error } = await this.supabase
        .from('checkout_sessions')
        .update({
          shipping_method: shippingMethod,
          shipping_option: shippingOption,
          shipping_cost: shippingCost,
          tax,
          total,
          current_step: 'payment',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .maybeSingle();

      if (error) {
        console.error(`Database error when updating shipping: ${error.message}`);
        throw new Error(`Failed to update shipping method: ${error.message}`);
      }

      if (!data) {
        console.log(
          `No data returned after shipping update for session ${sessionId}, using calculated values`
        );
        // Return a constructed session with our calculated values
        const virtualSession: CheckoutSession = {
          id: sessionId,
          cartId: currentSession.cartId || sessionId,
          userId: currentSession.userId,
          shippingMethod,
          shippingOption,
          shippingCost,
          subtotal,
          tax,
          total,
          shippingAddress: currentSession.shippingAddress,
          currentStep: 'payment',
          createdAt: currentSession.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        console.log('Using virtual session:', virtualSession);
        return virtualSession;
      }

      console.log('Successfully updated checkout session, got database response');
      return this.dbSessionToCheckoutSession(data);
    } catch (updateError) {
      console.error(`Error updating session with shipping method: ${updateError}`);

      // If update fails, return a constructed session with our calculated values
      const virtualSession: CheckoutSession = {
        id: sessionId,
        cartId: currentSession.cartId || sessionId,
        userId: currentSession.userId,
        shippingMethod,
        shippingOption,
        shippingCost,
        subtotal,
        tax,
        total,
        shippingAddress: currentSession.shippingAddress,
        currentStep: 'payment',
        createdAt: currentSession.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      console.log('Using emergency virtual session after error:', virtualSession);
      return virtualSession;
    }
  }

  /**
   * Updates payment information and advances to review step
   */
  async updatePaymentInfo(sessionId: string, paymentInfo: PaymentInfo): Promise<CheckoutSession> {
    try {
      // Handle billing address
      let billingAddress = paymentInfo.billingAddress;

      if (paymentInfo.billingAddressSameAsShipping) {
        // Get shipping address from current session
        const { data: currentSession, error: getError } = await this.supabase
          .from('checkout_sessions')
          .select('shipping_address')
          .eq('id', sessionId)
          .single();

        if (getError) {
          throw new Error(`Failed to get checkout session: ${getError.message}`);
        }

        billingAddress = currentSession.shipping_address;
      }

      // Update the session
      const { data, error } = await this.supabase
        .from('checkout_sessions')
        .update({
          payment_method: paymentInfo.type,
          payment_info: {
            type: paymentInfo.type,
            cardholderName: paymentInfo.cardholderName,
            paymentMethodId: paymentInfo.paymentMethodId,
            billingAddressSameAsShipping: paymentInfo.billingAddressSameAsShipping,
            // Don't store sensitive payment details
          },
          billing_address: billingAddress,
          current_step: 'review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update payment info: ${error.message}`);
      }

      return this.dbSessionToCheckoutSession(data);
    } catch (error) {
      console.error('Error in updatePaymentInfo:', error);
      throw error;
    }
  }

  /**
   * Finalizes an order after review and payment processing
   */
  async createOrder(sessionId: string): Promise<Order> {
    try {
      // Get full session details
      const { data: session, error: sessionError } = await this.supabase
        .from('checkout_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        throw new Error(`Failed to get checkout session: ${sessionError.message}`);
      }

      // Get cart items
      const { data: cartItems, error: cartError } = await this.supabase
        .from('cart_items')
        .select(
          `
          *,
          product:products(name, sku, image_url)
        `
        )
        .eq('cart_id', session.cart_id);

      if (cartError) {
        throw new Error(`Failed to get cart items: ${cartError.message}`);
      }

      // Create order record
      const orderId = uuidv4();
      const orderNumber = this.generateOrderNumber();
      const now = new Date().toISOString();

      const orderInput: OrderDBInput = {
        id: orderId,
        checkout_session_id: sessionId,
        cart_id: session.cart_id,
        user_id: session.user_id,
        guest_email: session.guest_email,
        order_number: orderNumber,
        status: 'created' as OrderStatus,
        shipping_address: session.shipping_address,
        billing_address: session.billing_address,
        shipping_method: session.shipping_method,
        shipping_cost: Number(session.shipping_cost) || 0,
        subtotal: Number(session.subtotal) || 0,
        tax: Number(session.tax) || 0,
        total: Number(session.total) || 0,
        payment_method: session.payment_method,
        payment_status: 'pending',
        created_at: now,
        updated_at: now,
      };

      const { data: order, error: orderError } = await this.supabase
        .from('orders')
        .insert(orderInput)
        .select()
        .single();

      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      // Create order items from cart items
      const orderItems = cartItems.map((item: CartItem) => ({
        id: uuidv4(),
        order_id: orderId,
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        name: item.product?.name || `Product ID: ${item.product_id.substring(0, 8)}`,
        sku: item.product?.sku || `SKU: ${item.id.substring(0, 8)}`,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        image_url: item.product?.image_url ?? null,
        options: {},
        metadata: {},
        created_at: now,
        updated_at: now,
      }));

      const { error: itemsError } = await this.supabase
        .from('order_items')
        .insert(orderItems)
        .select();
      if (itemsError) {
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }

      // Update checkout session to confirmation step
      await this.supabase
        .from('checkout_sessions')
        .update({
          current_step: 'confirmation',
          updated_at: now,
        })
        .eq('id', sessionId);

      // Update cart status to completed and remove all cart items
      await this.supabase
        .from('carts')
        .update({
          status: 'completed',
          updated_at: now,
        })
        .eq('id', session.cart_id);

      // Clear all cart items to ensure they don't appear in the UI after order completion
      console.log(`Removing all items from cart ${session.cart_id} after order creation`);
      const { error: deleteError } = await this.supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', session.cart_id);

      if (deleteError) {
        console.error('Warning: Failed to clear cart items after order creation:', deleteError);
        // We continue even if this fails since the order was created successfully
      } else {
        console.log(`Successfully removed all items from cart ${session.cart_id}`);
      }

      // Return the created order
      const mappedOrderItems = orderItems.map(item => ({
        ...item,
        price: item.unit_price, // Map unit_price to price for compatibility
      }));
      return this.formatOrderResponse(order, mappedOrderItems);
    } catch (error) {
      console.error('Error in createOrder:', error);
      throw error;
    }
  }

  /**
   * Retrieves available shipping options
   */
  async getShippingOptions(): Promise<ShippingOption[]> {
    // In a real implementation, this might come from a database or external API
    // For now, returning static options
    return [
      {
        id: 'shipping-standard',
        name: 'Standard Shipping',
        description: 'Delivery in 5-7 business days',
        method: 'standard',
        price: 9.99,
        estimatedDelivery: '5-7 business days',
      },
      {
        id: 'shipping-express',
        name: 'Express Shipping',
        description: 'Delivery in 2-3 business days',
        method: 'express',
        price: 19.99,
        estimatedDelivery: '2-3 business days',
      },
      {
        id: 'shipping-overnight',
        name: 'Overnight Shipping',
        description: 'Next business day delivery',
        method: 'overnight',
        price: 29.99,
        estimatedDelivery: 'Next business day',
      },
    ];
  }

  /**
   * Retrieves a checkout session by ID
   */
  async getCheckoutSession(sessionId: string): Promise<CheckoutSession> {
    try {
      // Modified to use maybeSingle() instead of single() to handle multiple or no rows gracefully
      const { data, error } = await this.supabase
        .from('checkout_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      // Log the query result for debugging
      // console.log(`getCheckoutSession for ID ${sessionId} returned:`, { data, error });

      if (error) {
        throw new Error(`Failed to get checkout session: ${error.message}`);
      }

      // If no session found, try to fallback to the most recent session for this ID
      if (!data) {
        // Try to find any session with this ID, ordered by updated_at (most recent first)
        const { data: fallbackData, error: fallbackError } = await this.supabase
          .from('checkout_sessions')
          .select('*')
          .eq('id', sessionId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log(`Fallback session query result:`, { fallbackData, fallbackError });

        if (fallbackError) {
          throw new Error(`Failed to get fallback checkout session: ${fallbackError.message}`);
        }

        if (!fallbackData) {
          // Create a minimal virtual session as last resort
          console.log(`No checkout session found with ID: ${sessionId}, returning virtual session`);
          return {
            id: sessionId,
            cartId: sessionId, // Use session ID as fallback cart ID
            currentStep: 'information',
            subtotal: 0,
            shippingCost: 0,
            tax: 0,
            total: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        return this.dbSessionToCheckoutSession(fallbackData as DbCheckoutSession);
      }

      return this.dbSessionToCheckoutSession(data as DbCheckoutSession);
    } catch (error) {
      console.error('Error in getCheckoutSession:', error);
      throw error;
    }
  }

  /**
   * Retrieves an order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    try {
      // Get order
      const { data: order, error: orderError } = await this.supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) {
        throw new Error(`Failed to get order: ${orderError.message}`);
      }

      // Get order items
      const { data: items, error: itemsError } = await this.supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) {
        throw new Error(`Failed to get order items: ${itemsError.message}`);
      }

      return this.formatOrderResponse(order, items);
    } catch (error) {
      console.error('Error in getOrder:', error);
      throw error;
    }
  }

  /**
   * Helper to convert database session to interface format
   */
  private dbSessionToCheckoutSession(data: DbCheckoutSession): CheckoutSession {
    // Start with a base object with required fields
    const session: Partial<CheckoutSession> = {
      id: data.id,
      subtotal: data.subtotal || 0,
      tax: data.tax || 0,
      total: data.total || 0,
      shippingCost: data.shipping_cost || 0,
      currentStep: (data.current_step as CheckoutStep) || 'information',
    };

    // Add non-undefined fields in camelCase format
    if (data.cart_id) session.cartId = data.cart_id;
    if (data.user_id) session.userId = data.user_id;
    if (
      data.shipping_method &&
      ['standard', 'express', 'overnight'].includes(data.shipping_method as string)
    ) {
      session.shippingMethod = data.shipping_method as ShippingMethod;
    }
    if (
      data.shipping_option &&
      typeof data.shipping_option === 'object' &&
      'id' in data.shipping_option &&
      'name' in data.shipping_option &&
      'price' in data.shipping_option
    ) {
      const opt = data.shipping_option as Record<string, Json>;

      // Create the shipping option with required fields
      const shippingOptionObj: Partial<ShippingOption> = {
        id: String(opt.id),
        name: String(opt.name),
        price: Number(opt.price),
      };

      // Add optional fields if they exist
      if ('description' in opt) shippingOptionObj.description = String(opt.description);
      if ('method' in opt) shippingOptionObj.method = String(opt.method) as ShippingMethod;
      if ('estimatedDelivery' in opt)
        shippingOptionObj.estimatedDelivery = String(opt.estimatedDelivery);

      session.shippingOption = shippingOptionObj as ShippingOption;
    }
    if (data.shipping_address && typeof data.shipping_address === 'object') {
      const addr = data.shipping_address as Record<string, Json>;
      const shippingAddress: Address = {
        firstName: String(addr.firstName || ''),
        lastName: String(addr.lastName || ''),
        phone: String(addr.phone || ''),
        address1: String(addr.address1 || ''),
        city: String(addr.city || ''),
        state: String(addr.state || ''),
        postalCode: String(addr.postalCode || ''),
        country: String(addr.country || ''),
      };

      // Only add these properties if they exist in the original address
      if (addr.address2) shippingAddress.address2 = String(addr.address2);
      if (addr.email) shippingAddress.email = String(addr.email);

      session.shippingAddress = shippingAddress;
    }
    if (data.billing_address && typeof data.billing_address === 'object') {
      const addr = data.billing_address as Record<string, Json>;
      session.billingAddress = {
        firstName: String(addr.firstName || ''),
        lastName: String(addr.lastName || ''),
        phone: String(addr.phone || ''),
        address1: String(addr.address1 || ''),
        address2: String(addr.address2 || ''),
        city: String(addr.city || ''),
        state: String(addr.state || ''),
        postalCode: String(addr.postalCode || ''),
        country: String(addr.country || ''),
        email: addr.email ? String(addr.email) : undefined,
      };
    }
    if (data.payment_method && ['card', 'paypal'].includes(data.payment_method as string)) {
      session.paymentMethod = data.payment_method as PaymentMethodType;
    }
    if (
      data.payment_info &&
      typeof data.payment_info === 'object' &&
      !Array.isArray(data.payment_info)
    ) {
      const paymentInfo = data.payment_info as Record<string, Json>;
      session.paymentInfo = {
        ...(paymentInfo as unknown as PaymentInfo),
      };
    }
    if (data.guest_email) session.guestEmail = data.guest_email;
    if (data.created_at) session.createdAt = data.created_at;
    if (data.updated_at) session.updatedAt = data.updated_at;

    return session as CheckoutSession;
  }

  /**
   * Helper to format an order response
   */
  private formatOrderResponse(order: OrderDBInput, items: OrderDbItem[]): Order {
    return {
      id: order.id ?? '',
      checkoutSessionId: order.checkout_session_id ?? '',
      cartId: order.cart_id ?? '',
      userId: order.user_id ?? undefined,
      guestEmail: order.guest_email ?? undefined,
      orderNumber: order.order_number,
      status: order?.status
        ? Object.values([
            'created',
            'processing',
            'completed',
            'cancelled',
            'refunded',
          ] as const).includes(order.status as OrderStatus)
          ? (order.status as OrderStatus)
          : 'created'
        : 'created',
      shippingAddress: order.shipping_address as unknown as Address,
      billingAddress: order.billing_address as unknown as Address,
      shippingMethod: order.shipping_method as ShippingMethod,
      shippingCost: Number(order.shipping_cost) || 0,
      items: items.map(item => ({
        // Convert null to undefined for imageUrl to match OrderItem type
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        variantId: item.variant_id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price, // Use price field, not unit_price
        imageUrl: item.image_url || undefined,
        options: this.transformOrderItemOptions(item.options),
      })),
      subtotal: Number(order.subtotal) || 0,
      tax: Number(order.tax) || 0,
      total: Number(order.total) || 0,
      paymentMethod: order.payment_method as PaymentMethodType,
      paymentStatus: (order.payment_status ?? 'pending') as 'pending' | 'paid' | 'failed',
      notes: order.notes ? String(order.notes) : undefined,
      createdAt: order.created_at || new Date().toISOString(),
      updatedAt: order.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Helper to transform order item options into the expected format
   */
  private transformOrderItemOptions(options: Json): { name: string; value: string }[] {
    if (!options) {
      return [];
    }

    // If already an array, map each item to ensure correct structure
    if (Array.isArray(options)) {
      return options.map(opt => {
        // If item is already in correct structure
        if (opt && typeof opt === 'object' && 'name' in opt && 'value' in opt) {
          return {
            name: String(opt.name || ''),
            value: String(opt.value || ''),
          };
        }
        // If item is a simple key-value object, convert to name-value
        else if (opt && typeof opt === 'object') {
          const key = Object.keys(opt)[0] || '';
          return {
            name: key,
            // Check if opt is an object (not an array) before accessing with a string key
            value: String(
              !Array.isArray(opt) && typeof opt === 'object' && key in opt ? opt[key] : ''
            ),
          };
        }
        // Fallback for primitive values
        return {
          name: 'option',
          value: String(opt || ''),
        };
      });
    }

    // If options is an object but not array, convert key-value pairs
    if (typeof options === 'object' && options !== null) {
      return Object.entries(options).map(([key, value]) => ({
        name: key,
        value: String(value || ''),
      }));
    }

    // Fallback: return empty array
    return [];
  }

  /**
   * Generates a unique order number
   */
  private generateOrderNumber(): string {
    // Format: NO-YYYYMMDD-XXXX where XXXX is a random alphanumeric string
    const date = new Date();
    const datePart = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('');

    // Generate a random 4-character alphanumeric string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `NO-${datePart}-${randomPart}`;
  }

  /**
   * Updates the checkout session step
   */
  async updateCheckoutSessionStep(sessionId: string, step: string): Promise<void> {
    try {
      await this.supabase
        .from('checkout_sessions')
        .update({
          current_step: step,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error updating checkout session step:', error);
      throw error;
    }
  }
}

/**
 * Export a singleton getCheckoutSession function for use in routes
 */
export async function getCheckoutSession(sessionId: string): Promise<CheckoutSession | null> {
  try {
    // Create a Supabase client

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const service = new CheckoutService(supabase);
    return await service.getCheckoutSession(sessionId);
  } catch (error) {
    console.error('Error getting checkout session:', error);
    return null;
  }
}
