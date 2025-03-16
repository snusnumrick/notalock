import { useEffect, useState } from 'react';
import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { PageLayout } from '~/components/common/PageLayout';
import { CheckoutSteps } from '~/features/checkout/components/CheckoutSteps';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getPaymentService } from '~/features/payment/PaymentService';
import { getOrderById } from '~/features/orders/api/queries.server';

/**
 * Payment confirmation page - final step of checkout
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session');
  const paymentId = url.searchParams.get('paymentId');
  const orderId = url.searchParams.get('orderId');

  if (!sessionId) {
    return redirect('/checkout');
  }

  // If no payment ID or order ID, redirect to checkout
  if (!paymentId || !orderId) {
    return redirect(`/checkout?session=${sessionId}`);
  }

  try {
    // Get order details
    const order = await getOrderById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // Get payment details
    const paymentService = getPaymentService();
    const paymentResult = await paymentService.verifyPayment(paymentId);

    // Return data for the confirmation page
    return json({
      sessionId,
      paymentId,
      orderId,
      paymentStatus: paymentResult.status,
      orderStatus: order.status,
      orderReference: order.orderNumber,
      orderDate: order.createdAt,
      customerEmail: order.email,
      totalAmount: order.totalAmount,
      currency: 'USD', // Default currency or use environment variable
    });
  } catch (error) {
    console.error('Error loading confirmation page:', error);

    // Return partial data if error occurs
    return json({
      sessionId,
      paymentId,
      orderId,
      paymentStatus: 'unknown',
      orderStatus: 'unknown',
      error: 'Failed to load order or payment details',
      totalAmount: null,
      currency: null,
      customerEmail: null,
      orderReference: null,
      orderDate: '',
    });
  }
}

export default function CheckoutConfirmationPage() {
  const data = useLoaderData<typeof loader>() as {
    orderId: string;
    paymentId: string;
    sessionId: string;
    paymentStatus: string;
    orderStatus: string;
    totalAmount: number | string | null;
    currency: string | null;
    customerEmail: string | null;
    orderReference: string | null;
    orderDate: string;
    error?: string;
  };
  const [isVerifying, setIsVerifying] = useState(data.paymentStatus === 'pending');
  const [paymentStatus, setPaymentStatus] = useState(data.paymentStatus);

  // If payment is pending, poll for status updates
  useEffect(() => {
    if (paymentStatus === 'pending') {
      const intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/payment/verify?paymentId=${data.paymentId}`);
          const result = await response.json();

          if (result.status !== 'pending') {
            setPaymentStatus(result.status);
            setIsVerifying(false);
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
        }
      }, 3000); // Check every 3 seconds

      // Clean up interval
      return () => clearInterval(intervalId);
    }

    // Return empty function for non-pending status
    return () => {};
  }, [data.paymentId, paymentStatus]);

  // Determine UI based on payment status
  const isSuccess = paymentStatus === 'completed';
  const isFailed = paymentStatus === 'failed';

  return (
    <PageLayout>
      <div className="py-8">
        <h1 className="text-2xl font-bold text-center mb-2">Order Confirmation</h1>

        <CheckoutSteps
          currentStep="confirmation"
          sessionId={data.sessionId}
          completedSteps={['information', 'shipping', 'payment']}
        />

        <div className="max-w-3xl mx-auto mt-8">
          <Card>
            <CardHeader className="text-center border-b">
              <div className="mx-auto mb-4">
                {isVerifying && (
                  <div className="rounded-full bg-yellow-100 p-3 inline-flex">
                    <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
                  </div>
                )}

                {isSuccess && (
                  <div className="rounded-full bg-green-100 p-3 inline-flex">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                )}

                {isFailed && (
                  <div className="rounded-full bg-red-100 p-3 inline-flex">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                )}
              </div>

              <CardTitle className="text-xl">
                {isVerifying && 'Processing Your Order...'}
                {isSuccess && 'Order Confirmed!'}
                {isFailed && 'Payment Failed'}
              </CardTitle>

              {isVerifying && (
                <p className="text-gray-500 mt-1">
                  We&apos;re processing your payment. This may take a moment...
                </p>
              )}

              {isSuccess && (
                <p className="text-gray-500 mt-1">
                  Thank you for your order! We&apos;ve sent a confirmation to{' '}
                  {data.customerEmail || 'your email address'}.
                </p>
              )}

              {isFailed && (
                <p className="text-gray-500 mt-1">
                  There was a problem processing your payment. Please try again or contact support.
                </p>
              )}
            </CardHeader>

            <CardContent className="pt-6">
              {(isSuccess || isVerifying) && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Order Details</h3>
                    <div className="mt-2 border-t border-b py-2">
                      <div className="flex justify-between py-1">
                        <span className="font-medium">Order Number:</span>
                        <span>{data.orderReference || data.orderId}</span>
                      </div>
                      {data.orderDate && (
                        <div className="flex justify-between py-1">
                          <span className="font-medium">Order Date:</span>
                          <span>{new Date(data.orderDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {data.totalAmount != null && (
                        <div className="flex justify-between py-1">
                          <span className="font-medium">Total Amount:</span>
                          <span>
                            {data.currency || '$'}{' '}
                            {typeof data.totalAmount === 'number'
                              ? data.totalAmount.toFixed(2)
                              : data.totalAmount}
                          </span>
                        </div>
                      )}
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
                      <a
                        href={`/api/payment/receipt?paymentId=${data.paymentId}&orderId=${data.orderId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Receipt
                      </a>
                    </Button>

                    <Button asChild>
                      <Link to="/">Continue Shopping</Link>
                    </Button>
                  </div>
                </div>
              )}

              {isFailed && (
                <div className="space-y-6">
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-sm text-red-800">
                      Your payment could not be processed. This could be due to insufficient funds,
                      an expired card, or other issues with your payment method.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button className="w-full" asChild>
                      <a href={`/checkout/payment?session=${data.sessionId}`}>Try Again</a>
                    </Button>

                    <Button variant="outline" className="w-full" asChild>
                      <a href="/contact">Contact Support</a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
