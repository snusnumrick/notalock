import { type SupabaseClient } from '@supabase/supabase-js';
import { CartService } from '~/features/cart/api/cartService';
import type { CheckoutSession } from '~/features/checkout/types/checkout.types';
import { getOrderService } from '../orderService';
import type { Order, OrderCreateInput } from '../../types';
import type { CartItem } from '~/features/cart/types/cart.types';

/**
 * Creates an order from a checkout session
 * This is the integration point between checkout and orders
 */
export async function createOrderFromCheckout(
  checkoutSession: CheckoutSession,
  paymentIntentId?: string,
  paymentMethodId?: string,
  paymentProvider?: string,
  supabase?: SupabaseClient
): Promise<Order> {
  // Get the supabase client if not provided
  if (!supabase) {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  }

  // Create cart service to get cart items
  const cartService = new CartService(supabase);

  try {
    // Get cart items for the checkout session
    const cartItems: CartItem[] = await cartService.getCartItems(checkoutSession.cartId);

    if (!cartItems || cartItems.length === 0) {
      throw new Error('No items found in the cart');
    }

    // Get the order service
    const orderService = await getOrderService();

    // Map cart items to order items
    const mappedItems = cartItems.map(item => ({
      productId: item.product_id,
      variantId: item.variant_id,
      name: item.product?.name || item.product_id,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.product?.image_url || undefined,
      // product and backward compatibility fields
      product: item.product,
      product_id: item.product_id,
      variant_id: item.variant_id,
    }));

    // Prepare the order creation input
    const orderInput: OrderCreateInput = {
      userId: checkoutSession.userId,
      email: checkoutSession.guestEmail || checkoutSession.shippingAddress?.email || '',
      cartId: checkoutSession.cartId,
      items: mappedItems,
      shippingAddress: checkoutSession.shippingAddress,
      billingAddress: checkoutSession.billingAddress || checkoutSession.shippingAddress,
      shippingMethod: checkoutSession.shippingMethod,
      shippingCost: checkoutSession.shippingCost || 0,
      taxAmount: checkoutSession.tax || 0,
      subtotalAmount: checkoutSession.subtotal || 0,
      totalAmount: checkoutSession.total || 0,
      paymentIntentId,
      paymentMethodId,
      paymentProvider,
      checkoutSessionId: checkoutSession.id,
      metadata: {
        // Store checkout shipping option as a string (JSON stringified)
        checkoutShippingOption: checkoutSession.shippingOption
          ? JSON.stringify(checkoutSession.shippingOption)
          : undefined,
        // Add payment info to the tracking field
        tracking: checkoutSession.paymentInfo
          ? {
              carrier: 'default',
              trackingNumber: 'default',
              paymentId: checkoutSession.paymentInfo?.paymentMethodId || '',
            }
          : undefined,
      },
    };

    // Create the order
    return await orderService.createOrder(orderInput);
  } catch (error) {
    console.error('Error creating order from checkout:', error);
    throw error;
  }
}
