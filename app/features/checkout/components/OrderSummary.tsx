// Component imports
import { useEffect, useMemo } from 'react';
import type { CartItem } from '~/features/cart/types/cart.types';
import type { CheckoutSession } from '../types/checkout.types';
import { syncCartData } from '~/features/cart/utils/cartSync';

interface OrderSummaryProps {
  cartItems: CartItem[];
  checkoutSession: CheckoutSession;
  showDetails?: boolean;
}

/**
 * Displays an order summary with pricing details
 */
export function OrderSummary({
  cartItems,
  checkoutSession,
  showDetails = true,
}: OrderSummaryProps) {
  // Add debug logging to check cart items and quantities
  useEffect(() => {
    // console.log(
    //   'OrderSummary: Cart items received:',
    //   cartItems.map(item => ({
    //     id: item.id,
    //     product_id: item.product_id,
    //     quantity: item.quantity,
    //     price: item.price,
    //   }))
    // );
    // console.log('OrderSummary: Checkout session total:', checkoutSession.subtotal);

    // Consolidate items with the same product ID, just in case
    // This is a safety mechanism in the component itself
    const productMap = new Map();
    let needsConsolidation = false;

    cartItems.forEach(item => {
      const key = `${item.product_id}:${item.variant_id || 'null'}`;
      if (productMap.has(key)) {
        needsConsolidation = true;
        // console.log(`OrderSummary: Found duplicate product ${key}, will combine quantities`);
      }
      productMap.set(key, item);
    });

    if (needsConsolidation) {
      console.log(
        'OrderSummary: Duplicates found in cart items, please check validateCartForCheckout function'
      );
    }
  }, [cartItems, checkoutSession]);

  // Sync with cart data from localStorage to ensure consistent display
  const syncedCartItems = useMemo(() => syncCartData(cartItems), [cartItems]);

  // IMPORTANT: Always trust the cart items quantity over any other source
  // Calculate values based on passed cart items to ensure accuracy
  const calculatedSubtotal = syncedCartItems.reduce((sum, item) => {
    // console.log(
    //   `OrderSummary calculation: Item ${item.product_id} - quantity: ${item.quantity}, price: ${item.price}`
    // );
    return sum + item.price * item.quantity;
  }, 0);

  // Prefer our calculated values based on cart items over session values
  // This ensures we're showing the user the correct information
  const subtotalToUse = calculatedSubtotal;
  const { shippingCost, tax } = checkoutSession;
  const totalToUse = subtotalToUse + shippingCost + tax;

  // Consolidate items with the same product ID for display
  const consolidatedItems = useMemo(() => {
    const productMap = new Map();

    syncedCartItems.forEach(item => {
      const key = `${item.product_id}:${item.variant_id || 'null'}`;
      if (productMap.has(key)) {
        // Update existing item's quantity
        const existingItem = productMap.get(key);
        existingItem.quantity += item.quantity;
      } else {
        // Add new item to map
        productMap.set(key, { ...item });
      }
    });

    return Array.from(productMap.values());
  }, [syncedCartItems]);

  // Get the total quantity from consolidated cart items
  const itemCount = consolidatedItems.reduce((count, item) => count + item.quantity, 0);
  // console.log(
  //   `OrderSummary: Total item count: ${itemCount}, Calculated subtotal: ${subtotalToUse}`
  // );

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-medium mb-4">Order Summary</h3>

      {showDetails && (
        <div className="mb-6 max-h-80 overflow-y-auto pr-2">
          {consolidatedItems.map(item => (
            <div
              key={item.id}
              className="flex items-start py-3 border-b border-gray-200 last:border-0"
            >
              <div className="relative w-16 h-16 bg-gray-100 rounded flex-shrink-0 mr-3">
                {item.product?.image_url ? (
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No Image
                  </div>
                )}
                <span className="absolute -top-2 -right-2 bg-gray-200 text-gray-800 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-grow">
                <p className="font-medium">
                  {item.product?.name || `Product ID: ${item.product_id.substring(0, 8)}`}
                </p>
                <p className="text-sm text-gray-500">
                  {item.product?.sku || `SKU: ${item.id.substring(0, 8)}`}
                </p>
                <p className="text-sm font-medium">
                  ${item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <div className="text-right whitespace-nowrap font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span>${subtotalToUse.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="order-summary-shipping-cost">${shippingCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="pt-3 border-t border-gray-200">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="order-summary-total">${totalToUse.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
