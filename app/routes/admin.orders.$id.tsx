import { useState, useEffect } from 'react';
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useActionData, useNavigation } from '@remix-run/react';
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
  const navigation = useNavigation();
  const isLoading = navigation.state === 'submitting';

  // Maintain a local order state to reflect updates immediately
  const [currentOrder, setCurrentOrder] = useState<Order>(order as Order);

  // Debug log
  console.log('Rendering OrderDetailRoute', {
    orderFromLoader: order,
    currentOrderState: currentOrder,
    actionData,
    navigationState: navigation.state,
  });

  // Update local state when order from loader changes
  useEffect(() => {
    setCurrentOrder(order as Order);
  }, [order]);

  // Handle status change
  const handleStatusChange = async (status: OrderStatus, orderId: string) => {
    console.log('Status change requested:', { status, orderId });

    try {
      // Instead of using submit, we'll use fetch directly
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          notes: 'Status updated by admin',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating status:', errorData);
        return;
      }

      const data = await response.json();
      console.log('Status updated successfully:', data);

      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error in handleStatusChange:', error);
    }
  };

  // Handle payment status change
  const handlePaymentStatusChange = async (status: PaymentStatus, orderId: string) => {
    console.log('Payment status change requested:', { status, orderId });

    try {
      // Instead of using submit, we'll use fetch directly
      const response = await fetch(`/api/orders/${orderId}/update-payment-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus: status,
          notes: 'Payment status updated by admin',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating payment status:', errorData);
        return;
      }

      const data = await response.json();
      console.log('Payment status updated successfully:', data);

      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error in handlePaymentStatusChange:', error);
    }
  };

  // Update local order state when the server responds with a new order
  useEffect(() => {
    if (
      actionData &&
      'success' in actionData &&
      actionData.success &&
      actionData.order &&
      actionData.order.id === currentOrder.id
    ) {
      console.log('Updating order state from action data', actionData.order);
      setCurrentOrder(actionData.order as Order);
    }
  }, [actionData, currentOrder.id]);

  return (
    <div className="container py-8">
      {actionData && 'error' in actionData && actionData.error && (
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
