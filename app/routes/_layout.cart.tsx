import { useLoaderData, Link, useNavigate } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/node';
import { PageLayout } from '~/components/common/PageLayout';
import { useState, useEffect } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useCart } from '~/features/cart/context/CartContext';
import { Input } from '~/components/ui/input';
import type { CartItem } from '~/features/cart/types/cart.types';
import { cartLoader } from '~/features/cart/api/cartLoader';
import {
  ANONYMOUS_CART_COOKIE_NAME,
  CART_COUNT_EVENT_NAME,
  CART_DATA_STORAGE_KEY,
} from '~/features/cart/constants';

type LoaderData = {
  initialCartItems: CartItem[];
};

export const loader: LoaderFunction = cartLoader;

export default function CartPage() {
  const { initialCartItems } = useLoaderData<LoaderData>();
  const { cartItems, summary, updateCartItem, removeCartItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  // Client-side state for managing cart items explicitly
  const [clientDisplayItems, setClientDisplayItems] = useState<CartItem[]>([]);
  const [hasInitializedClient, setHasInitializedClient] = useState(false);

  // Use cartItems from context as single source of truth, but if we're about to display initialCartItems,
  // make sure they're in sync with what's in localStorage
  const serverItems = cartItems.length > 0 ? cartItems : initialCartItems;

  // Use client-side state for display after initialization
  const displayItems = hasInitializedClient ? clientDisplayItems : serverItems;

  /*  console.log('Cart page - displayItems:', displayItems.length);
  console.log('Cart page - cartItems from context:', cartItems.length);
  console.log('Cart page - initialCartItems from loader:', initialCartItems.length);
  console.log('Cart page - clientDisplayItems:', clientDisplayItems.length);*/

  // Initialize client display items on first render
  useEffect(() => {
    if (!hasInitializedClient && serverItems.length > 0) {
      // console.log('Cart page - Initializing client display items');
      setClientDisplayItems(serverItems);
      setHasInitializedClient(true);
    }
  }, [hasInitializedClient, serverItems]);

  // Keep clientDisplayItems in sync with cartItems after initialization
  useEffect(() => {
    if (hasInitializedClient && cartItems.length > 0) {
      console.log('Cart page - Syncing client display items with cart context');
      setClientDisplayItems(cartItems);
    }
  }, [hasInitializedClient, cartItems]);

  // Listen for cart state change events
  useEffect(() => {
    if (typeof window === 'undefined' || !hasInitializedClient) return;

    const handleCartStateChanged = (e: CustomEvent) => {
      if (e.detail?.type === 'update' && e.detail?.itemId && e.detail?.quantity) {
        console.log('Cart page - Received cart-state-changed event for update:', e.detail);
        setClientDisplayItems(prevItems =>
          prevItems.map(item =>
            item.id === e.detail.itemId ? { ...item, quantity: e.detail.quantity } : item
          )
        );
      } else if (e.detail?.items) {
        console.log(
          'Cart page - Received cart-state-changed event with items:',
          e.detail.items.length
        );
        setClientDisplayItems(e.detail.items);
      }
    };

    window.addEventListener('cart-state-changed', handleCartStateChanged as EventListener);

    return () => {
      window.removeEventListener('cart-state-changed', handleCartStateChanged as EventListener);
    };
  }, [hasInitializedClient]);

  // Function to perform emergency cart clear if all else fails
  const performEmergencyCartClear = async (specificItemId?: string) => {
    if (typeof window === 'undefined') return;

    console.log(
      specificItemId
        ? `CartPage - Attempting emergency removal of item: ${specificItemId}`
        : 'CartPage - Attempting emergency cart clear'
    );

    try {
      // 1. Clear client state first
      if (!specificItemId) {
        setClientDisplayItems([]);
      } else {
        setClientDisplayItems(prev => prev.filter(item => item.id !== specificItemId));
      }

      // 2. Clear localStorage or remove specific item
      if (!specificItemId) {
        localStorage.removeItem(CART_DATA_STORAGE_KEY);
      } else {
        try {
          const cartData = localStorage.getItem(CART_DATA_STORAGE_KEY);
          if (cartData) {
            const items = JSON.parse(cartData);
            const updatedItems = items.filter((item: CartItem) => item.id !== specificItemId);
            localStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(updatedItems));
          }
        } catch (e) {
          console.error('Error updating localStorage:', e);
        }
      }

      // 3. Dispatch clear events
      if (!specificItemId) {
        console.log('count event 23', 0);

        window.dispatchEvent(
          new CustomEvent(CART_COUNT_EVENT_NAME, {
            detail: { count: 0, timestamp: Date.now() },
          })
        );
      } else {
        // Recalculate count
        const cartData = localStorage.getItem(CART_DATA_STORAGE_KEY);
        const items = cartData ? JSON.parse(cartData) : [];
        const totalCount = items.reduce(
          (total: number, item: CartItem) => total + item.quantity,
          0
        );

        console.log('count event 2', totalCount);
        window.dispatchEvent(
          new CustomEvent(CART_COUNT_EVENT_NAME, {
            detail: { count: totalCount, timestamp: Date.now() },
          })
        );
      }

      // 4. Call emergency clear API
      const formData = new FormData();
      if (specificItemId) formData.append('itemId', specificItemId);

      const response = await fetch('/api/emergency-cart-clear', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      console.log('Emergency cart clear result:', result);

      // 5. Force navigation if clearing the whole cart
      if (!specificItemId) {
        navigate('/products');
      }
    } catch (error) {
      console.error('Emergency cart clear failed:', error);
      // Force hard reload as last resort
      if (!specificItemId) {
        window.location.href = '/products';
      }
    }
  };

  // Client-side function to calculate summary from client items
  const getClientSummary = () => {
    return clientDisplayItems.reduce(
      (acc, item) => {
        acc.totalItems += item.quantity;
        acc.subtotal += item.price * item.quantity;
        acc.total = acc.subtotal + (acc.shipping || 0) + (acc.tax || 0);
        return acc;
      },
      { totalItems: 0, subtotal: 0, shipping: 0, tax: 0, total: 0 }
    );
  };

  // Use client-calculated summary if we're using client display items
  const displaySummary = hasInitializedClient ? getClientSummary() : summary;

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
  }, [cartItems.length, initialCartItems, updateCartItem]);

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

      // Update clientDisplayItems to reflect the change immediately
      if (hasInitializedClient) {
        setClientDisplayItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId
              ? { ...item, quantity: newQuantity, updated_at: new Date().toISOString() }
              : item
          )
        );

        // Dispatch event in case other components need to be notified
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('cart-state-changed', {
              detail: { type: 'update', itemId, quantity: newQuantity },
            })
          );
        }
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setIsUpdating(true);
    console.log('CartPage - Client-side removal of item:', itemId);

    try {
      // Get the anonymous cart ID to help with consistent removal
      const anonymousCartId =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(ANONYMOUS_CART_COOKIE_NAME) || ''
          : '';

      console.log(`CartPage - Using anonymous cart ID: ${anonymousCartId}`);

      // Get the preferred cart ID if available
      const preferredCartId =
        anonymousCartId && typeof window !== 'undefined'
          ? window.localStorage.getItem(`preferred_cart_${anonymousCartId}`) || ''
          : '';

      if (preferredCartId) {
        console.log(`CartPage - Using preferred cart ID: ${preferredCartId}`);
      }

      // Update both the local state and the cart context state
      const updatedItems = clientDisplayItems.filter(item => item.id !== itemId);
      setClientDisplayItems(updatedItems);
      console.log('CartPage - Updated client display items, remaining:', updatedItems.length);

      // Force update the context state by directly setting cartItems
      // This ensures the header gets updated correctly
      let updatedStorageItems: CartItem[] = [];

      if (typeof window !== 'undefined') {
        // Force cart context update through localStorage and event
        try {
          const cartData = localStorage.getItem(CART_DATA_STORAGE_KEY);
          if (cartData) {
            const items: CartItem[] = JSON.parse(cartData);
            // Ensure we update both localStorage and dispatch the event
            updatedStorageItems = items.filter((item: CartItem) => item.id !== itemId);
            localStorage.setItem(CART_DATA_STORAGE_KEY, JSON.stringify(updatedStorageItems));
            console.log('CartPage - Updated localStorage, remaining:', updatedStorageItems.length);

            // Dispatch two events to ensure all components update
            // 1. Update the header cart count
            const totalCount = updatedStorageItems.reduce(
              (total: number, item: CartItem) => total + item.quantity,
              0
            );
            console.log('count event 3', totalCount);
            window.dispatchEvent(
              new CustomEvent(CART_COUNT_EVENT_NAME, {
                detail: { count: totalCount, timestamp: Date.now() },
              })
            );

            // 2. Also dispatch a cart-state-changed event for any other listeners
            window.dispatchEvent(
              new CustomEvent('cart-state-changed', {
                detail: {
                  type: 'remove',
                  itemId,
                  items: updatedStorageItems,
                  anonymousCartId,
                  preferredCartId,
                },
              })
            );

            // 3. Force a refresh of the HeaderContext if it exists
            if (window.dispatchEvent) {
              window.dispatchEvent(new Event('storage'));
            }
          }
        } catch (e) {
          console.error('Error updating localStorage:', e);
        }
      }

      // 3. If cart is now empty, navigate to products page after a short delay
      // Use localStorage items to check if cart is truly empty after all operations
      if (updatedStorageItems.length === 0) {
        console.log('Cart is empty in localStorage, will redirect to products page');
        setTimeout(() => {
          // Check again before redirecting to prevent race conditions
          const finalCheck = localStorage.getItem(CART_DATA_STORAGE_KEY);
          const isEmpty = !finalCheck || finalCheck === '[]' || JSON.parse(finalCheck).length === 0;

          if (isEmpty) {
            navigate('/products');
          }
        }, 800);
      }

      // 4. Attempt server-side removal in the background and set a reload timeout
      // We don't wait for this to complete but will force reload after a delay
      // This ensures the server data is refreshed even if the server removal fails
      setTimeout(() => {
        // Include cart information in the API calls
        const data = new URLSearchParams({
          itemId,
          anonymousCartId: anonymousCartId || '',
          preferredCartId: preferredCartId || '',
        });

        // Try all available methods
        Promise.allSettled([
          // Method 1: Use context removeCartItem
          removeCartItem(itemId).catch(e =>
            console.error('Background removal - context method failed:', e)
          ),

          // Method 2: Direct API call to specialized endpoint
          fetch('/api/direct-cart-remove', {
            method: 'POST',
            body: data,
          }).catch(e => console.error('Background removal - direct API failed:', e)),

          // Method 3: Standard cart API
          fetch('/api/cart', {
            method: 'POST',
            body: new URLSearchParams({ action: 'remove', itemId }),
          }).catch(e => console.error('Background removal - standard API failed:', e)),
        ]).then(results => {
          console.log(
            'Background removal attempts completed with results:',
            results.map(r => (r.status === 'fulfilled' ? 'success' : 'rejected'))
          );

          // Force reload after cart operations to ensure synchronization
          // This helps prevent deleted items from reappearing on refresh
          setTimeout(() => {
            if (updatedStorageItems.length > 0) {
              console.log('Performing soft reload to ensure server synchronization');
              navigate(window.location.pathname);
            }
          }, 2000);

          // Set a final failsafe - if the SPECIFIC item we tried to remove still appears
          // Only clear the entire cart if we detect the specific item we wanted to remove
          setTimeout(() => {
            if (window.localStorage.getItem(CART_DATA_STORAGE_KEY)) {
              try {
                const storedItems = JSON.parse(
                  window.localStorage.getItem(CART_DATA_STORAGE_KEY) || '[]'
                );
                // Only trigger emergency clear if the SPECIFIC item we tried to remove still exists
                const itemStillExists = storedItems.some((item: CartItem) => item.id === itemId);

                if (itemStillExists) {
                  console.log(
                    `Item ${itemId} still exists in localStorage after all removal attempts, performing emergency clear`
                  );
                  performEmergencyCartClear(itemId);
                } else {
                  console.log('Item was successfully removed, no need for emergency clear');
                }
              } catch (e) {
                console.error('Error checking localStorage during failsafe:', e);
              }
            }
          }, 5000);
        });
      }, 200);
    } catch (error) {
      console.error('CartPage - Error in client-side handleRemoveItem:', error);
      // Even if there's an error in our client logic, don't revert the UI change
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
                                    : `Product ID: ${item.product_id.substring(0, 8)}`}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {item.product
                                    ? `SKU: ${item.product.sku}`
                                    : `SKU: Item #${item.id.substring(0, 8)}`}
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
                                {isUpdating ? '...' : '-'}
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
                                {isUpdating ? '...' : '+'}
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
                      <span className="font-medium">${displaySummary.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">
                        {displaySummary.shipping ? (
                          `$${displaySummary.shipping.toFixed(2)}`
                        ) : (
                          <span className="text-gray-500 italic text-sm">
                            Calculated at checkout
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">
                        {displaySummary.tax ? (
                          `$${displaySummary.tax.toFixed(2)}`
                        ) : (
                          <span className="text-gray-500 italic text-sm">
                            Calculated at checkout
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>
                          ${displaySummary.subtotal.toFixed(2)}
                          {!displaySummary.tax && !displaySummary.shipping && (
                            <span className="text-gray-500 text-xs font-normal ml-1">
                              (excl. tax & shipping)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Use standard Remix Link for navigation */}
                    <Link
                      to="/checkout"
                      className={`block w-full bg-blue-600 text-white py-3 rounded-md font-medium mt-4 hover:bg-blue-700 text-center ${
                        clientDisplayItems.length === 0 || isUpdating
                          ? 'opacity-50 pointer-events-none'
                          : ''
                      }`}
                      aria-disabled={clientDisplayItems.length === 0 || isUpdating}
                    >
                      Proceed to Checkout
                    </Link>

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
