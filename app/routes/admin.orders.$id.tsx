import { useState } from 'react';
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useActionData, useSubmit, useNavigation } from '@remix-run/react';
import { requireAdmin } from '~/server/middleware/auth.server';
import { OrderDetail } from '~/features/orders/components/admin/OrderDetail';
import { getOrderById } from '~/features/orders/api/queries.server';
import { updateOrderStatus, updatePaymentStatus } from '~/features/orders/api/actions.server';
import type { Order, OrderStatus, PaymentStatus } from '~/features/orders/types';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Verify the user is an admin
  await requireAdmin(request);

  const orderId = params.id;
  if (!orderId) {
    throw new Response('Order ID is required', { status: 400 });
  }

  try {
    // Get the order with all details using the query function
    const order = await getOrderById(orderId);

    if (!order) {
      throw new Response('Order not found', { status: 404 });
    }

    return json({ order });
  } catch (error) {
    console.error('Error loading order:', error);
    throw new Response('Order not found', { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  // Verify the user is an admin
  await requireAdmin(request);

  // Only process POST/PUT requests
  if (request.method !== 'POST' && request.method !== 'PUT') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const orderId = params.id;
  if (!orderId) {
    return json({ error: 'Order ID is required' }, { status: 400 });
  }

  try {
    // Handle both JSON and FormData requests
    let intentValue;
    let statusValue;
    let paymentStatusValue;
    let notesValue;

    // Check if the request is JSON
    if (request.headers.get('Content-Type')?.includes('application/json')) {
      // Parse the JSON body
      const data = await request.json();
      intentValue = data.intent;
      statusValue = data.status;
      paymentStatusValue = data.paymentStatus;
      notesValue = data.notes;
    } else {
      // Parse the form data
      const formData = await request.formData();
      intentValue = formData.get('intent');
      statusValue = formData.get('status')?.toString();
      paymentStatusValue = formData.get('paymentStatus')?.toString();
      notesValue = formData.get('notes')?.toString();
    }

    if (intentValue === 'updateStatus') {
      if (!statusValue) {
        return json({ error: 'Status is required' }, { status: 400 });
      }

      // Validate the status
      const validStatuses: OrderStatus[] = [
        'pending',
        'processing',
        'paid',
        'completed',
        'cancelled',
        'refunded',
        'failed',
      ];

      if (!validStatuses.includes(statusValue as OrderStatus)) {
        return json({ error: 'Invalid status value' }, { status: 400 });
      }

      // Update order status
      const order = await updateOrderStatus(orderId, statusValue as OrderStatus, notesValue);

      return json({ order, success: true });
    } else if (intentValue === 'updatePaymentStatus') {
      if (!paymentStatusValue) {
        return json({ error: 'Payment status is required' }, { status: 400 });
      }

      // Validate the payment status
      const validPaymentStatuses: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];

      if (!validPaymentStatuses.includes(paymentStatusValue as PaymentStatus)) {
        return json({ error: 'Invalid payment status value' }, { status: 400 });
      }

      // Update payment status
      const order = await updatePaymentStatus(
        orderId,
        paymentStatusValue as PaymentStatus,
        undefined,
        notesValue
      );

      return json({ order, success: true });
    }

    return json({ error: 'Invalid action intent' }, { status: 400 });
  } catch (error) {
    console.error('Error updating order:', error);
    return json({ error: `Failed to update order: ${(error as Error).message}` }, { status: 500 });
  }
}

export default function OrderDetailRoute() {
  const { order } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'submitting';

  // Maintain a local order state to reflect updates immediately
  const [currentOrder, setCurrentOrder] = useState<Order>(order as Order);

  // Handle status change
  const handleStatusChange = async (status: OrderStatus) => {
    // Use JSON for submission to avoid TextDecoder issues
    const data = {
      intent: 'updateStatus',
      status,
      notes: 'Order completed',
    };

    submit(data, {
      method: 'post',
      encType: 'application/json',
    });
  };

  // Handle payment status change
  const handlePaymentStatusChange = async (status: PaymentStatus) => {
    // Use JSON for submission to avoid TextDecoder issues
    const data = {
      intent: 'updatePaymentStatus',
      paymentStatus: status,
      notes: 'Payment confirmed',
    };

    submit(data, {
      method: 'post',
      encType: 'application/json',
    });
  };

  // Update local order state when the server responds with a new order
  if (
    actionData &&
    'success' in actionData &&
    actionData.success &&
    actionData.order &&
    actionData.order.id === currentOrder.id
  ) {
    setCurrentOrder(actionData.order as Order);
  }

  return (
    <div className="container py-8">
      {'error' in actionData! && actionData.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      {actionData && 'success' in actionData && actionData.success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Order updated successfully</AlertDescription>
        </Alert>
      )}

      <OrderDetail
        order={currentOrder}
        onStatusChange={handleStatusChange}
        onPaymentStatusChange={handlePaymentStatusChange}
        isLoading={isLoading}
      />
    </div>
  );
}
