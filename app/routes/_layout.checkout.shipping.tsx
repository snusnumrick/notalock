import { type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import {
  useLoaderData,
  useNavigation,
  Form,
  useActionData,
  isRouteErrorResponse,
  useRouteError,
  useFetcher,
} from '@remix-run/react';
import { PageLayout } from '~/components/common/PageLayout';
import { Button } from '~/components/ui/button';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { Label } from '~/components/ui/label';
import { CheckoutSteps } from '~/features/checkout/components/CheckoutSteps';
import { OrderSummary } from '~/features/checkout/components/OrderSummary';
import { AddressForm } from '~/features/checkout/components/AddressForm';
import { checkoutShippingLoader } from '~/features/checkout/api/loaders';
import { checkoutShippingAction } from '~/features/checkout/api/actions';
import { ShippingOption } from '~/features/checkout/types/checkout.types';
import { useEffect, useState } from 'react';

/**
 * Shipping method selection - second step of checkout
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log('CHECKOUT SHIPPING LOADER CALLED');
  const response = checkoutShippingLoader({ request, params: {}, context: {} });
  console.log('CHECKOUT SHIPPING LOADER EXECUTED');
  return response;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log('CHECKOUT SHIPPING ACTION CALLED');
  return checkoutShippingAction({ request, params: {}, context: {} });
};

export default function CheckoutShippingPage() {
  // console.log('CHECKOUT SHIPPING PAGE RENDERING');

  const { checkoutSession, shippingOptions, cartItems } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string }>(); // Get action errors
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // For real-time shipping cost updates
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string | null>(
    checkoutSession.shippingOption?.id || shippingOptions[0]?.id || null
  );
  const [sessionWithUpdatedShipping, setSessionWithUpdatedShipping] = useState(checkoutSession);
  const updateShippingFetcher = useFetcher();

  // Update the shipping cost in real-time
  useEffect(() => {
    // When the fetcher returns data successfully, we can update the tax calculation
    if (
      updateShippingFetcher.data &&
      typeof updateShippingFetcher.data === 'object' &&
      'success' in updateShippingFetcher.data
    ) {
      // Update tax calculation based on server response
      const response = updateShippingFetcher.data as {
        success: boolean;
        session: typeof checkoutSession;
      };
      const serverSession = response.session;
      setSessionWithUpdatedShipping((prev: typeof sessionWithUpdatedShipping) => ({
        ...prev,
        tax: serverSession.tax,
        total: serverSession.total,
      }));
    }
  }, [updateShippingFetcher.data]);

  return (
    <PageLayout>
      <div className="py-8">
        <h1 className="text-2xl font-bold text-center mb-2">Checkout</h1>

        <CheckoutSteps
          currentStep="shipping"
          sessionId={checkoutSession.id}
          completedSteps={['information']}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>

              {checkoutSession.shippingAddress && (
                <div className="mb-4">
                  <AddressForm address={checkoutSession.shippingAddress} readOnly={true} />
                </div>
              )}

              <div className="mt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/checkout?session=${checkoutSession.id}`}>Edit</a>
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Shipping Method</h2>

              <Form method="post" noValidate>
                <input type="hidden" name="sessionId" value={checkoutSession.id} />

                <RadioGroup
                  name="shippingMethod"
                  value={
                    selectedShippingMethod ||
                    checkoutSession.shippingOption?.id ||
                    shippingOptions[0]?.id
                  }
                  required
                  onValueChange={value => {
                    setSelectedShippingMethod(value);

                    // Find the selected shipping option
                    const selectedOption = shippingOptions.find(
                      (option: ShippingOption) => option.id === value
                    );
                    if (selectedOption) {
                      // Update the session state with the new shipping cost
                      setSessionWithUpdatedShipping((prev: typeof checkoutSession) => ({
                        ...prev,
                        shippingOption: selectedOption,
                        shippingCost: selectedOption.price,
                        // Recalculate total
                        total: prev.subtotal + selectedOption.price + prev.tax,
                      }));

                      // Send data to the server to update shipping prices without advancing the checkout flow
                      const formData = new FormData();
                      formData.append('sessionId', checkoutSession.id);
                      formData.append('shippingMethod', value);
                      updateShippingFetcher.submit(formData, {
                        method: 'post',
                        action: '/api/update-shipping-price',
                      });
                    }
                  }}
                >
                  {shippingOptions.map((option: ShippingOption) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2 border p-4 rounded-md mb-3 hover:border-blue-500"
                    >
                      <RadioGroupItem value={option.id} id={option.id} className="mr-2" />
                      <Label htmlFor={option.id} className="flex-grow cursor-pointer">
                        <div className="font-medium flex justify-between items-center w-full">
                          <span>{option.name}</span>
                          <span className="text-right font-bold">${option.price.toFixed(2)}</span>
                        </div>
                        <div className="text-gray-500 text-sm flex justify-between items-center w-full">
                          <span>{option.description}</span>
                          <span className="text-right">{option.estimatedDelivery}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {/* Display any errors */}
                {actionData?.error && (
                  <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    <p className="font-bold">{actionData.error}</p>
                    <p className="mt-2 text-sm">Please select a shipping method and try again.</p>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" asChild>
                    <a href={`/checkout?session=${checkoutSession.id}`}>Back</a>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Continue to Payment'}
                  </Button>
                </div>
              </Form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary cartItems={cartItems} checkoutSession={sessionWithUpdatedShipping} />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// Error Boundary using Remix conventions
export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 401:
        return (
          <PageLayout>
            <div className="py-8">
              <h1 className="text-2xl font-bold text-center mb-2">Authentication Required</h1>
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
                <p>Please log in to continue with checkout.</p>
                <div className="mt-4 flex justify-center">
                  <a
                    href="/app/routes/_layout.login"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded transition duration-200"
                  >
                    Log In
                  </a>
                </div>
              </div>
            </div>
          </PageLayout>
        );
      case 404:
        return (
          <PageLayout>
            <div className="py-8">
              <h1 className="text-2xl font-bold text-center mb-2">Checkout Not Found</h1>
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
                <p>We couldn&apos;t find the checkout session you&apos;re looking for.</p>
                <div className="mt-4 flex justify-center">
                  <a
                    href="/cart"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded transition duration-200"
                  >
                    Return to Cart
                  </a>
                </div>
              </div>
            </div>
          </PageLayout>
        );
      default:
        return (
          <PageLayout>
            <div className="py-8">
              <h1 className="text-2xl font-bold text-center mb-2">Checkout Error</h1>
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <p>Something went wrong with your checkout: {error.data || error.statusText}</p>
                <div className="mt-4 flex justify-center">
                  <a
                    href="/cart"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded transition duration-200"
                  >
                    Return to Cart
                  </a>
                </div>
              </div>
            </div>
          </PageLayout>
        );
    }
  }

  // For non-Response errors
  return (
    <PageLayout>
      <div className="py-8">
        <h1 className="text-2xl font-bold text-center mb-2">Unexpected Error</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <p>An unexpected error occurred during checkout.</p>
          <div className="mt-4 flex justify-center">
            <a
              href="/cart"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded transition duration-200"
            >
              Return to Cart
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
