import { useState } from 'react';
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useActionData, useSubmit, useNavigation } from '@remix-run/react';
import { requireAdmin } from '~/server/middleware/auth.server';
import { OrderDetail } from '~/features/orders/components/admin/OrderDetail';
import { getOrderService } from '~/features/orders/api/orderService';
import type { OrderStatus } from '~/features/orders/types';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Verify the user is an admin
  await requireAdmin(request);

  const orderId = params.id;
  if (!orderId) {
    throw new Response('Order ID is required', { status: 400 });
  }

  try {
    // Get the order service
    const orderService = await getOrderService();

    // Get the order with all details
    const order = await orderService.getOrderById(orderId);

    return json({ order });
  } catch (error) {
    console.error('Error loading order:', error);
    throw new Response('Order not found', { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  // Verify the user is an admin
  await requireAdmin(request);

  const orderId = params.id;
  if (!orderId) {
    return json({ error: 'Order ID is required' }, { status: 400 });
  }

  try {
    // Parse the request body
    const formData = await request.formData();
    const action = formData.get('_action');

    if (action === 'updateStatus') {
      const status = formData.get('status');
      const notes = formData.get('notes');

      if (!status) {
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

      if (!validStatuses.includes(status as OrderStatus)) {
        return json({ error: 'Invalid status value' }, { status: 400 });
      }

      // Get the order service
      const orderService = await getOrderService();

      // Update the order status
      const updatedOrder = await orderService.updateOrderStatus(
        orderId,
        status as OrderStatus,
        notes ? String(notes) : undefined
      );

      return json({
        success: true,
        message: `Order status updated to ${status}`,
        order: updatedOrder,
      });
    }

    return json({ error: 'Invalid action' }, { status: 400 });
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
  const [currentOrder, setCurrentOrder] = useState(order);

  // Handle status change
  const handleStatusChange = async (_orderId: string, status: OrderStatus) => {
    const formData = new FormData();
    formData.append('_action', 'updateStatus');
    formData.append('status', status);

    submit(formData, { method: 'post' });
  };

  // Update local order state when the server responds with a new order
  if (
    actionData &&
    'success' in actionData &&
    actionData.success &&
    actionData.order &&
    actionData.order.id === currentOrder.id
  ) {
    setCurrentOrder(actionData.order);
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
          <AlertDescription>{actionData.message}</AlertDescription>
        </Alert>
      )}

      <OrderDetail order={currentOrder} onStatusChange={handleStatusChange} isLoading={isLoading} />
    </div>
  );
}
