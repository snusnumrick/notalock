import { type ActionFunctionArgs, json } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware/auth.server';
import { getOrderService } from '~/features/orders/api/orderService';
import type { OrderStatus } from '~/features/orders/types';

/**
 * Action function to update an order's status
 */
export async function action({ request, params }: ActionFunctionArgs) {
  // Verify user is an admin
  await requireAdmin(request);

  try {
    const orderId = params.id;

    if (!orderId) {
      return json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (request.method !== 'PATCH' && request.method !== 'PUT') {
      return json({ error: 'Method not allowed' }, { status: 405 });
    }

    // Parse the request body
    const { status, notes } = await request.json();

    if (!status) {
      return json({ error: 'Status is required' }, { status: 400 });
    }

    // Validate the status is a valid OrderStatus
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
      notes
    );

    return json(updatedOrder);
  } catch (error) {
    console.error('Error in order status API:', error);
    return json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
