import { useLoaderData } from '@remix-run/react';
import { json, LoaderFunction } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { PageLayout } from '~/components/common/PageLayout';
import { useState, useEffect } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useCart } from '~/features/cart/context/CartContext';
import { Input } from '~/components/ui/input';
import { CartService } from '~/features/cart/api/cartService';
import type { CartItem } from '~/features/cart/types/cart.types';

type LoaderData = {
  initialCartItems: CartItem[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);

  // Get cart items from server
  const cartService = new CartService(supabase);
  const cartItems = await cartService.getCartItems();

  return json<LoaderData>({ initialCartItems: cartItems }, { headers: response.headers });
};

export default function CartPage() {
  const { initialCartItems } = useLoaderData<LoaderData>();
  const { cartItems, summary, updateCartItem, removeCartItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);

  // Use cartItems from context as single source of truth
  const displayItems = cartItems.length > 0 ? cartItems : initialCartItems;

  // Load initialCartItems into CartContext on first render only
  useEffect(() => {
    let isMounted = true;

    // Only sync from server to context if context is empty but server has items
    const syncServerToContext = async () => {
      if (initialCartItems.length > 0 && cartItems.length === 0) {
        console.log('Cart page - Syncing initialCartItems to context', initialCartItems);
        for (const item of initialCartItems) {
          if (!isMounted) return;
          await updateCartItem(item.id, item.quantity);
        }
      }
    };

    syncServerToContext();

    return () => {
      isMounted = false;
    };
  }, [cartItems.length, initialCartItems, updateCartItem]); // Empty dependency array = run once on mount

  // For debugging - keep logging minimal
  console.log('Cart page - displayItems count:', displayItems.length);

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setIsUpdating(true);
    try {
      // Find the item to ensure it exists
      const existingItem = displayItems.find(item => item.id === itemId);
      if (!existingItem) {
        console.error('Item not found in cart:', itemId);
        return;
      }

      console.log(`Updating cart item ${itemId} to quantity ${newQuantity}`);

      // Update via the CartContext to ensure global state update
      await updateCartItem(itemId, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setIsUpdating(true);
    try {
      // Check if item exists
      const itemToRemove = displayItems.find(item => item.id === itemId);
      if (!itemToRemove) {
        console.error('Item not found in cart for removal:', itemId);
        return;
      }

      console.log(`Removing cart item ${itemId}`);

      // Remove via the CartContext to ensure global state update
      await removeCartItem(itemId);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <PageLayout>
      <div className="pt-6">
        <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>

        {displayItems.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-lg text-gray-600 mb-4">Your cart is empty</p>
            <a
              href="/products"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700"
            >
              Continue Shopping
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left pb-4">Product</th>
                        <th className="text-center pb-4">Quantity</th>
                        <th className="text-right pb-4">Price</th>
                        <th className="text-right pb-4">Total</th>
                        <th className="text-right pb-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayItems.map(item => (
                        <tr key={item.id} className="border-b border-gray-200">
                          <td className="py-4">
                            <div className="flex items-center">
                              <div className="bg-gray-100 w-16 h-16 rounded flex items-center justify-center mr-4">
                                {item.product && item.product.image_url ? (
                                  <img
                                    src={item.product.image_url}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <span className="text-gray-400 text-xs">No Image</span>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {item.product
                                    ? item.product.name
                                    : `Product ID: ${item.product_id}`}
                                </p>
                                <p className="text-sm text-gray-500">
                                  SKU: {item.product ? item.product.sku : item.id.substring(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-center">
                            <div className="flex justify-center items-center">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={isUpdating || item.quantity <= 1}
                                className="px-2 py-1 border rounded-l-md disabled:opacity-50"
                              >
                                -
                              </button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={e => {
                                  const value = parseInt(e.target.value, 10);
                                  if (!isNaN(value) && value > 0) {
                                    handleQuantityChange(item.id, value);
                                  }
                                }}
                                className="w-12 text-center border-y border-x-0 rounded-none"
                                min="1"
                                disabled={isUpdating}
                              />
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={isUpdating}
                                className="px-2 py-1 border rounded-r-md disabled:opacity-50"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-4 text-right">${item.price.toFixed(2)}</td>
                          <td className="py-4 text-right font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isUpdating}
                              className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                              title="Remove item"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-medium mb-4">Order Summary</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">${summary.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">${(summary.shipping || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">${(summary.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${summary.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      className="w-full bg-blue-600 text-white py-3 rounded-md font-medium mt-4 hover:bg-blue-700 disabled:opacity-50"
                      disabled={displayItems.length === 0 || isUpdating}
                      onClick={() => {
                        // Future implementation: checkout flow
                        alert('Checkout functionality coming soon!');
                      }}
                    >
                      Proceed to Checkout
                    </button>

                    <a
                      href="/products"
                      className="block text-center text-blue-600 hover:underline mt-4"
                    >
                      Continue Shopping
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
