import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { PageLayout } from '~/components/common/PageLayout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { getOrderById } from '~/features/orders/api/queries.server';
import { OrderSummary } from '~/features/orders/components';

/**
 * Order success page - shown after successful checkout
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');

  if (!orderId) {
    return redirect('/');
  }

  try {
    // Get order details
    const order = await getOrderById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    return json({ order });
  } catch (error) {
    console.error('Error loading success page:', error);
    return redirect('/');
  }
}

export default function CheckoutSuccessPage() {
  const { order } = useLoaderData<typeof loader>();

  return (
    <PageLayout>
      <div className="py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="mb-8">
            <CardHeader className="text-center border-b">
              <div className="mx-auto mb-4">
                <div className="rounded-full bg-green-100 p-3 inline-flex">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <CardTitle className="text-xl">Order Confirmed!</CardTitle>
              <p className="text-gray-500 mt-1">
                Thank you for your order! We&apos;ve sent a confirmation to {order.email}.
              </p>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Order Details</h3>
                  <div className="mt-2 border-t border-b py-2">
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Order Number:</span>
                      <span>{order.orderNumber}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Order Date:</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Total Amount:</span>
                      <span>${order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">What&apos;s Next?</h3>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                    <li>You&apos;ll receive an email confirmation shortly.</li>
                    <li>We&apos;re preparing your order for shipment.</li>
                    <li>You&apos;ll be notified once your order ships.</li>
                  </ul>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" asChild>
                    <Link
                      to={`/app/routes/todelete/orders/lookup?orderNumber=${order.orderNumber}`}
                    >
                      Track Order
                    </Link>
                  </Button>

                  <Button asChild>
                    <Link to="/">Continue Shopping</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <OrderSummary order={order} showDetailLink={false} />
        </div>
      </div>
    </PageLayout>
  );
}
