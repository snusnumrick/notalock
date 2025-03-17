import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { requireAuth } from '~/server/middleware/auth.server';
import { getUserOrders, getOrderById } from '~/features/orders/api/queries.server';

/**
 * API endpoint to get orders for authenticated users
 *
 * GET /api/orders?orderId=123 - get a specific order by ID
 * GET /api/orders - get all orders for the authenticated user
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const orderId = params.orderId || url.searchParams.get('orderId');

  // If an order ID is provided, return that specific order
  if (orderId) {
    const order = await getOrderById(orderId);

    if (!order) {
      return json({ error: 'Order not found' }, { status: 404 });
    }

    const { user } = await requireAuth(request);

    // Ensure the user has access to this order
    if (order.userId && order.userId !== user?.id) {
      return json({ error: 'Unauthorized' }, { status: 403 });
    }

    return json({ order });
  }

  // Otherwise, return all orders for the user
  const { user } = await requireAuth(request);
  const orders = await getUserOrders(user.id);

  return json({ orders });
}
