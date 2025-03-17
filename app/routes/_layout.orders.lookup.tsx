import { useState } from 'react';
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, useNavigation, Form } from '@remix-run/react';
import { PageLayout } from '~/components/common/PageLayout';
import { getOrderByOrderNumber, getOrdersByEmail } from '~/features/orders/api/actions.server';
import { OrderDetail, OrdersList } from '~/features/orders/components';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import type { Order } from '~/features/orders/types';

/**
 * Loader function for the order lookup page
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get('orderNumber');
  const email = url.searchParams.get('email');

  if (orderNumber) {
    try {
      const order = await getOrderByOrderNumber(orderNumber);
      if (order) {
        return json({ order, orderNumber, email, lookupMethod: 'orderNumber' });
      }
    } catch (error) {
      console.error('Error looking up by order number:', error);
    }
  }

  if (email) {
    try {
      const orders = await getOrdersByEmail(email);
      return json({ orders, orderNumber, email, lookupMethod: 'email' });
    } catch (error) {
      console.error('Error looking up by email:', error);
    }
  }

  return json({ orderNumber, email, lookupMethod: null });
}

/**
 * Action function for the order lookup form submission
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const lookupMethod = formData.get('lookupMethod')?.toString();
  const orderNumber = formData.get('orderNumber')?.toString();
  const email = formData.get('email')?.toString();

  // Validate form data
  const errors: Record<string, string> = {};

  if (lookupMethod === 'orderNumber') {
    if (!orderNumber || orderNumber.trim() === '') {
      errors.orderNumber = 'Order number is required';
    }
  } else if (lookupMethod === 'email') {
    if (!email || email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
  } else {
    errors.lookupMethod = 'Please select a lookup method';
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors });
  }

  // Redirect to the same page with query parameters
  const searchParams = new URLSearchParams();
  if (lookupMethod === 'orderNumber' && orderNumber) {
    searchParams.set('orderNumber', orderNumber);
  } else if (lookupMethod === 'email' && email) {
    searchParams.set('email', email);
  }

  return json({ redirectTo: `/orders/lookup?${searchParams.toString()}` });
}

export default function OrderLookupPage() {
  const loaderData = useLoaderData<typeof loader>();
  const order = 'order' in loaderData ? loaderData.order : undefined;
  const orders = 'orders' in loaderData ? loaderData.orders : undefined;
  const initialOrderNumber = loaderData.orderNumber || '';
  const initialEmail = loaderData.email || '';
  const initialLookupMethod = loaderData.lookupMethod;

  const actionData = useActionData<{ errors?: Record<string, string>; redirectTo?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [lookupMethod, setLookupMethod] = useState(initialLookupMethod || 'orderNumber');
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber || '');
  const [email, setEmail] = useState(initialEmail || '');

  // If there's a redirect URL in the action data, perform the redirect
  if (actionData?.redirectTo) {
    window.location.href = actionData.redirectTo;
    return null;
  }

  return (
    <PageLayout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold text-center mb-6">Order Lookup</h1>

        <div className="max-w-2xl mx-auto mb-8">
          <Tabs value={lookupMethod} onValueChange={setLookupMethod}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="orderNumber">Order Number</TabsTrigger>
              <TabsTrigger value="email">Email Address</TabsTrigger>
            </TabsList>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Form method="post" className="space-y-4">
                <input type="hidden" name="lookupMethod" value={lookupMethod} />

                <TabsContent value="orderNumber">
                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Order Number</Label>
                    <Input
                      id="orderNumber"
                      name="orderNumber"
                      placeholder="e.g. NO-20240101-AB12"
                      value={orderNumber}
                      onChange={e => setOrderNumber(e.target.value)}
                    />
                    {actionData?.errors?.orderNumber && (
                      <p className="text-sm text-red-500">{actionData.errors.orderNumber}</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="email">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter the email used for your order"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    {actionData?.errors?.email && (
                      <p className="text-sm text-red-500">{actionData.errors.email}</p>
                    )}
                  </div>
                </TabsContent>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Searching...' : 'Find Order'}
                </Button>
              </Form>
            </div>
          </Tabs>
        </div>

        {/* No results message */}
        {initialLookupMethod && !order && (!orders || orders.length === 0) && (
          <Alert className="max-w-3xl mx-auto mb-6">
            <AlertTitle>No orders found</AlertTitle>
            <AlertDescription>
              {initialLookupMethod === 'orderNumber'
                ? `We couldn't find an order with the number ${initialOrderNumber}. Please check the order number and try again.`
                : `We couldn't find any orders associated with ${initialEmail}. Please check the email address and try again.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Display order details if found by order number */}
        {order && (
          <div className="max-w-4xl mx-auto">
            <OrderDetail order={order as Order} />
          </div>
        )}

        {/* Display orders list if found by email */}
        {orders && orders.length > 0 && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Orders for {initialEmail}</h2>
            <OrdersList orders={orders as Order[]} />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
