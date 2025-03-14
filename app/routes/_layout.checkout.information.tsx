import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData, Form, useActionData, useNavigation } from '@remix-run/react';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { ensureConsistentCartId } from '~/features/cart/utils/cartHelper';
import { validateCartForCheckout } from '~/features/cart/utils/cartValidation';
import { checkoutInfoLoader } from '~/features/checkout/api/loaders';
import { checkoutInfoAction } from '~/features/checkout/api/actions';
import { useState, useMemo } from 'react';
import { PageLayout } from '~/components/common/PageLayout';
import { OrderSummary } from '~/features/checkout/components/OrderSummary';

// Import shadcn components
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { CheckoutSteps } from '~/features/checkout/components/CheckoutSteps';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // console.log('CHECKOUT INFORMATION: Starting loader', request);

    // Create a new response object to set cookies
    const response = new Response();
    const supabase = createSupabaseClient(request, response);

    // Ensure consistent cart cookie - this prevents confusion with different cart IDs
    await ensureConsistentCartId(request, response, supabase);
    // console.log(`CHECKOUT INFORMATION: Using consistent anonymous cart ID: ${anonymousCartId}`);

    // Pass modified request to the checkoutInfoLoader
    const loaderResponse = await checkoutInfoLoader({ request, params: {}, context: {} });

    // Return the response with our cookie headers merged in
    const data = await loaderResponse.json();
    // console.log('CHECKOUT INFORMATION: Loader finished successfully');

    // Validate cart items to prevent duplicates and sync with localStorage
    if (data.cartItems) {
      // console.log('CHECKOUT INFORMATION: Validating cart items to prevent duplicates');

      // First validate through our function
      data.cartItems = validateCartForCheckout(data.cartItems);
      // console.log(`CHECKOUT INFORMATION: Validated cart now has ${data.cartItems.length} items`);
    }

    return json(data, {
      headers: response.headers,
    });
  } catch (error) {
    console.error('CHECKOUT INFORMATION ERROR:', error);

    // Always let Remix handle redirects
    if (error instanceof Response) {
      throw error;
    }

    // For other errors, throw a proper response with status code
    throw new Response('Failed to load checkout information', {
      status: 500,
      statusText: error instanceof Error ? error.message : 'Server Error',
    });
  }
};

export const action = checkoutInfoAction;

// Country options for select dropdown
const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
];

export default function CheckoutInformationPage() {
  // console.log('CHECKOUT INFORMATION: Rendering component');

  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<{ errors?: Record<string, string> }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // If no data is available, show an error
  if (!data || !data.checkoutSession) {
    throw new Response('Missing checkout session data', {
      status: 404,
      statusText: 'Not Found',
    });
  }

  const { checkoutSession, cartItems } = data;

  // Convert country to two-letter code if needed (some systems use full country names)
  const countryCode = useMemo(() => {
    const countryValue = checkoutSession?.shippingAddress?.country;
    if (!countryValue) return 'US';

    // If it's already a 2-letter code, use it
    if (countryValue.length === 2) return countryValue;

    // Otherwise, find the matching country
    const match = COUNTRIES.find(c => c.label === countryValue);
    return match?.value || 'US';
  }, [checkoutSession?.shippingAddress?.country]);

  const [country, setCountry] = useState<string>(countryCode);

  return (
    <PageLayout>
      <div className="py-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Checkout</h1>

        <CheckoutSteps
          currentStep="information"
          sessionId={checkoutSession.id}
          completedSteps={[]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Contact & Address</CardTitle>
              </CardHeader>
              <CardContent>
                <Form method="post" className="space-y-4" noValidate>
                  <input type="hidden" name="sessionId" value={checkoutSession.id} />
                  <input type="hidden" name="cartId" value={checkoutSession.cartId || ''} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className={actionData?.errors?.firstName ? 'text-red-500' : ''}
                      >
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="First name"
                        defaultValue={checkoutSession?.shippingAddress?.firstName || ''}
                        required
                        className={actionData?.errors?.firstName ? 'border-red-500' : ''}
                      />
                      {actionData?.errors?.firstName && (
                        <p className="text-red-500 text-sm mt-1">{actionData.errors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className={actionData?.errors?.lastName ? 'text-red-500' : ''}
                      >
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Last name"
                        defaultValue={checkoutSession?.shippingAddress?.lastName || ''}
                        required
                        className={actionData?.errors?.lastName ? 'border-red-500' : ''}
                      />
                      {actionData?.errors?.lastName && (
                        <p className="text-red-500 text-sm mt-1">{actionData.errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className={actionData?.errors?.email ? 'text-red-500' : ''}
                    >
                      Email *
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Email address"
                      defaultValue={
                        checkoutSession?.guestEmail || checkoutSession?.shippingAddress?.email || ''
                      }
                      required
                      className={actionData?.errors?.email ? 'border-red-500' : ''}
                    />
                    {actionData?.errors?.email && (
                      <p className="text-red-500 text-sm mt-1">{actionData.errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className={actionData?.errors?.phone ? 'text-red-500' : ''}
                    >
                      Phone *
                    </Label>
                    <Input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="Phone number"
                      defaultValue={checkoutSession?.shippingAddress?.phone || ''}
                      required
                      className={actionData?.errors?.phone ? 'border-red-500' : ''}
                    />
                    {actionData?.errors?.phone && (
                      <p className="text-red-500 text-sm mt-1">{actionData.errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Select defaultValue={country} onValueChange={setCountry}>
                      <SelectTrigger id="country" name="country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Label
                      htmlFor="address1"
                      className={actionData?.errors?.address1 ? 'text-red-500' : ''}
                    >
                      Address Line 1 *
                    </Label>
                    <Input
                      id="address1"
                      name="address1"
                      placeholder="Street address"
                      defaultValue={checkoutSession?.shippingAddress?.address1 || ''}
                      required
                      className={actionData?.errors?.address1 ? 'border-red-500' : ''}
                    />
                    {actionData?.errors?.address1 && (
                      <p className="text-red-500 text-sm mt-1">{actionData.errors.address1}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address2">Address Line 2</Label>
                    <Input
                      id="address2"
                      name="address2"
                      placeholder="Apartment, suite, etc. (optional)"
                      defaultValue={checkoutSession?.shippingAddress?.address2 || ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="city"
                      className={actionData?.errors?.city ? 'text-red-500' : ''}
                    >
                      City *
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="City"
                      defaultValue={checkoutSession?.shippingAddress?.city || ''}
                      required
                      className={actionData?.errors?.city ? 'border-red-500' : ''}
                    />
                    {actionData?.errors?.city && (
                      <p className="text-red-500 text-sm mt-1">{actionData.errors.city}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="state"
                        className={actionData?.errors?.state ? 'text-red-500' : ''}
                      >
                        State/Province *
                      </Label>
                      <Input
                        id="state"
                        name="state"
                        placeholder="State/Province"
                        defaultValue={checkoutSession?.shippingAddress?.state || ''}
                        required
                        className={actionData?.errors?.state ? 'border-red-500' : ''}
                      />
                      {actionData?.errors?.state && (
                        <p className="text-red-500 text-sm mt-1">{actionData.errors.state}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="postalCode"
                        className={actionData?.errors?.postalCode ? 'text-red-500' : ''}
                      >
                        Postal Code *
                      </Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        placeholder="Postal code"
                        defaultValue={checkoutSession?.shippingAddress?.postalCode || ''}
                        required
                        className={actionData?.errors?.postalCode ? 'border-red-500' : ''}
                      />
                      {actionData?.errors?.postalCode && (
                        <p className="text-red-500 text-sm mt-1">{actionData.errors.postalCode}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="country"
                      className={actionData?.errors?.country ? 'text-red-500' : ''}
                    >
                      Country *
                    </Label>
                    <Select name="country" defaultValue={country} onValueChange={setCountry}>
                      <SelectTrigger
                        id="country"
                        className={actionData?.errors?.country ? 'border-red-500' : ''}
                      >
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(country => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {actionData?.errors?.country && (
                      <p className="text-red-500 text-sm mt-1">{actionData.errors.country}</p>
                    )}
                  </div>

                  {/* Display general form error if present */}
                  {actionData?.errors?.general && (
                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      <p>{actionData.errors.general}</p>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" asChild>
                      <a href="/cart">Back to Cart</a>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Continue to Shipping'}
                    </Button>
                  </div>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary cartItems={cartItems} checkoutSession={checkoutSession} />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
