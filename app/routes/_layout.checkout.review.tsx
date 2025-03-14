import { type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigation, Form } from '@remix-run/react';
import { PageLayout } from '~/components/common/PageLayout';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { CheckoutSteps } from '~/features/checkout/components/CheckoutSteps';
import { OrderSummary } from '~/features/checkout/components/OrderSummary';
import { AddressForm } from '~/features/checkout/components/AddressForm';
import { checkoutReviewLoader } from '~/features/checkout/api/loaders';
import { checkoutPlaceOrderAction } from '~/features/checkout/api/actions';
import { CartItem } from '~/features/cart/types/cart.types';

/**
 * Order review step - fourth step of checkout
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  return checkoutReviewLoader({ request, params: {}, context: {} });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return checkoutPlaceOrderAction({ request, params: {}, context: {} });
};

export default function CheckoutReviewPage() {
  const { checkoutSession, cartItems } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

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
        <h1 className="text-2xl font-bold text-center mb-2">Order Review</h1>

        <CheckoutSteps
          currentStep="review"
          sessionId={checkoutSession.id}
          completedSteps={['information', 'shipping', 'payment']}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Contact Information</h2>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/checkout?session=${checkoutSession.id}`}>Edit</a>
                </Button>
              </div>

              <div className="mb-4">
                <p className="font-medium">Email</p>
                <p>{checkoutSession.guestEmail || 'Account email'}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Shipping Information</h2>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/checkout?session=${checkoutSession.id}`}>Edit</a>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium mb-2">Shipping Address</h3>
                  {checkoutSession.shippingAddress && (
                    <AddressForm address={checkoutSession.shippingAddress} readOnly={true} />
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-2">Shipping Method</h3>
                  {checkoutSession.shippingOption && (
                    <div>
                      <p className="font-medium">{checkoutSession.shippingOption.name}</p>
                      <p className="text-sm text-gray-500">
                        {checkoutSession.shippingOption.estimatedDelivery}
                      </p>
                      <p className="mt-1 font-medium">
                        ${checkoutSession.shippingOption.price.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Payment Information</h2>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/checkout/payment?session=${checkoutSession.id}`}>Edit</a>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium mb-2">Payment Method</h3>
                  <p>{getPaymentMethodName(checkoutSession.paymentMethod || '')}</p>
                  {checkoutSession.paymentInfo?.cardholderName && (
                    <p className="text-sm text-gray-600 mt-1">
                      Cardholder: {checkoutSession.paymentInfo.cardholderName}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-2">Billing Address</h3>
                  {checkoutSession.billingAddress && (
                    <AddressForm address={checkoutSession.billingAddress} readOnly={true} />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>

              <div className="space-y-4 mb-6">
                {cartItems.map((item: CartItem) => (
                  <div
                    key={item.id}
                    className="flex items-start border-b border-gray-200 pb-4 last:border-0"
                  >
                    <div className="relative w-16 h-16 bg-gray-100 rounded flex-shrink-0 mr-4">
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

              <Separator className="mb-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${checkoutSession.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>${checkoutSession.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span>${checkoutSession.tax.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${checkoutSession.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Form
                method="post"
                className="mt-8"
                onSubmit={() => {
                  // Set a flag in sessionStorage to indicate an order was just placed
                  if (typeof window !== 'undefined' && window.sessionStorage) {
                    window.sessionStorage.setItem('just_placed_order', 'true');
                  }
                }}
              >
                <input type="hidden" name="sessionId" value={checkoutSession.id} />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" asChild>
                    <a href={`/checkout/payment?session=${checkoutSession.id}`}>Back</a>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Place Order'}
                  </Button>
                </div>
              </Form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary
              cartItems={cartItems}
              checkoutSession={checkoutSession}
              showDetails={false}
            />

            <div className="bg-white rounded-lg shadow p-6 mt-6 text-sm text-gray-600">
              <h3 className="font-medium text-gray-900 mb-3">Order Notes</h3>
              <p>
                By placing your order, you agree to Notalock&apos;s Terms of Service and Privacy
                Policy.
              </p>
              <p className="mt-4">
                Your order will be processed once payment is confirmed. You will receive an order
                confirmation email with your order details.
              </p>
              <p className="mt-4">
                For this demonstration, no actual payment processing will occur, and no real orders
                will be fulfilled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
