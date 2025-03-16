import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware/auth.server';

import { getOrderService } from '~/features/orders/api/orderService';

/**
 * Loader function to get orders for the authenticated user
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get the authenticated user
    const { user } = await requireAdmin(request);

    if (!user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get the order service
    const orderService = await getOrderService();

    // Get the user's orders
    const orders = await orderService.getUserOrders(user.id);

    return json(orders);
  } catch (error) {
    console.error('Error in user orders API:', error);
    return json({ error: 'Failed to fetch user orders' }, { status: 500 });
  }
}
