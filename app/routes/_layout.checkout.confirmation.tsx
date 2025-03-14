import { type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { useEffect } from 'react';
import { PageLayout } from '~/components/common/PageLayout';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { AddressForm } from '~/features/checkout/components/AddressForm';
import { checkoutConfirmationLoader } from '~/features/checkout/api/loaders';
import { CART_COUNT_EVENT_NAME, CART_DATA_STORAGE_KEY } from '~/features/cart/constants';

/**
 * Order confirmation - final step of checkout
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  return checkoutConfirmationLoader({ request, params: {}, context: {} });
};

export default function CheckoutConfirmationPage() {
  const { order } = useLoaderData<typeof loader>();

  // Clear cart when confirmation page loads
  useEffect(() => {
    // Clear localStorage cart data
    if (typeof window !== 'undefined') {
      try {
        // Remove cart data from localStorage
        localStorage.removeItem(CART_DATA_STORAGE_KEY);

        // Dispatch cart-count-update event to update UI
        console.log('count event 24', 0);
        window.dispatchEvent(
          new CustomEvent(CART_COUNT_EVENT_NAME, {
            detail: {
              count: 0,
              timestamp: Date.now(),
            },
          })
        );

        // Dispatch cart-cleared event for any listeners
        window.dispatchEvent(new CustomEvent('cart-cleared'));

        console.log('Cart cleared in confirmation page component');
      } catch (error) {
        console.error('Error clearing cart in confirmation page:', error);
      }
    }
  }, []);

  // Format date for display
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get payment method display name
  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'credit_card':
        return 'Credit Card';
      case 'paypal':
        return 'PayPal';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'square':
        return 'Square';
      default:
        return method;
    }
  };

  return (
    <PageLayout>
      <div className="py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-2">
                <CheckCircleIcon className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">
              Thank you for your order. We&apos;ve received your purchase and will begin processing
              it soon.
            </p>
            <p className="text-gray-600 mt-1">
              A confirmation email has been sent to {order.guestEmail || 'your email address'}.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">Order #{order.orderNumber}</h2>
                <p className="text-gray-600">Placed on {orderDate}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>

            <Separator className="mb-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-3">Shipping Information</h3>
                <AddressForm address={order.shippingAddress} readOnly={true} />
              </div>

              <div>
                <h3 className="font-semibold mb-3">Payment Information</h3>
                <p className="font-medium">{getPaymentMethodName(order.paymentMethod)}</p>
                <p className="text-sm text-gray-600 mb-3">
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </p>

                <h3 className="font-semibold mb-3 mt-6">Billing Address</h3>
                <AddressForm address={order.billingAddress} readOnly={true} />
              </div>
            </div>

            <Separator className="mb-6" />

            <h3 className="font-semibold mb-4">Order Summary</h3>

            <div className="mb-6">
              {order.items.map(item => (
                <div
                  key={item.id}
                  className="flex items-start border-b border-gray-200 py-4 last:border-0"
                >
                  <div className="relative w-16 h-16 bg-gray-100 rounded flex-shrink-0 mr-4">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
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
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    <p className="text-sm font-medium mt-1">
                      ${item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span>${order.shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-4 mt-8">
            <Button asChild>
              <Link to="/">Continue Shopping</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/account/orders">View Your Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
