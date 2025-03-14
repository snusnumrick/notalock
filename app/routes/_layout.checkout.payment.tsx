import { useState } from 'react';
import { type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, useActionData, useNavigation, Form } from '@remix-run/react';
import { PageLayout } from '~/components/common/PageLayout';
import { Button } from '~/components/ui/button';
// import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Checkbox } from '~/components/ui/checkbox';
// import { Card, CardContent } from '~/components/ui/card';
import { CheckoutSteps } from '~/features/checkout/components/CheckoutSteps';
import { OrderSummary } from '~/features/checkout/components/OrderSummary';
import { AddressForm } from '~/features/checkout/components/AddressForm';
import { PaymentSelector } from '~/features/payment/components/PaymentSelector';
import { checkoutPaymentLoader } from '~/features/checkout/api/loaders';
import { checkoutPaymentAction } from '~/features/checkout/api/actions';
import type { Address } from '~/features/checkout/types/checkout.types';

/**
 * Payment information step - third step of checkout
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  return checkoutPaymentLoader({ request, params: {}, context: {} });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return checkoutPaymentAction({ request, params: {}, context: {} });
};

export default function CheckoutPaymentPage() {
  const { checkoutSession, cartItems } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ errors?: Record<string, string> }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit_card');
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState('mock');

  // Handle payment type and provider change
  const handlePaymentChange = (type: string, provider: string) => {
    setSelectedPaymentMethod(type);
    setSelectedPaymentProvider(provider);
  };

  return (
    <PageLayout>
      <div className="py-8">
        <h1 className="text-2xl font-bold text-center mb-2">Checkout</h1>

        <CheckoutSteps
          currentStep="payment"
          sessionId={checkoutSession.id}
          completedSteps={['information', 'shipping']}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Shipping Information Review */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Shipping Information</h2>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/checkout?session=${checkoutSession.id}`}>Edit</a>
                </Button>
              </div>

              {checkoutSession.shippingAddress && (
                <AddressForm address={checkoutSession.shippingAddress} readOnly={true} />
              )}
            </div>

            {/* Shipping Method Review */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Shipping Method</h2>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/checkout/shipping?session=${checkoutSession.id}`}>Edit</a>
                </Button>
              </div>

              {checkoutSession.shippingOption && (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{checkoutSession.shippingOption.name}</p>
                    <p className="text-sm text-gray-500">
                      {checkoutSession.shippingOption.estimatedDelivery}
                    </p>
                  </div>
                  <p className="font-medium">${checkoutSession.shippingOption.price.toFixed(2)}</p>
                </div>
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Payment Information</h2>

              <Form method="post" noValidate>
                <input type="hidden" name="sessionId" value={checkoutSession.id} />

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Payment Method</h3>

                  <PaymentSelector
                    onPaymentTypeChange={handlePaymentChange}
                    selectedProvider={selectedPaymentProvider}
                    selectedType={selectedPaymentMethod}
                    errors={actionData?.errors}
                  />
                </div>

                {/* Billing Address */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Billing Address</h3>

                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sameAsShipping"
                        name="sameAsShipping"
                        checked={sameAsShipping}
                        onCheckedChange={checked => setSameAsShipping(checked === true)}
                      />
                      <Label htmlFor="sameAsShipping">Same as shipping address</Label>
                    </div>
                  </div>

                  {!sameAsShipping && (
                    <AddressForm
                      address={checkoutSession.billingAddress}
                      errors={Object.entries(actionData?.errors || {})
                        .filter(([key]) => key.startsWith('billing_'))
                        .reduce(
                          (acc, [key, value]) => {
                            acc[key.replace('billing_', '') as keyof Address] = value;
                            return acc;
                          },
                          {} as Partial<Record<keyof Address, string>>
                        )}
                      fieldPrefix="billing"
                    />
                  )}
                </div>

                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" asChild>
                    <a href={`/checkout/shipping?session=${checkoutSession.id}`}>Back</a>
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Continue to Review'}
                  </Button>
                </div>
              </Form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary cartItems={cartItems} checkoutSession={checkoutSession} />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
