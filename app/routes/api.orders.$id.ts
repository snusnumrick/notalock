import { type ActionFunctionArgs, json, type LoaderFunctionArgs } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware/auth.server';
import { getOrderService } from '~/features/orders/api/orderService';

/**
 * Loader function to get a specific order by ID
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  // Verify user is an admin
  await requireAdmin(request);

  try {
    const orderId = params.id;

    if (!orderId) {
      return json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get the order service
    const orderService = await getOrderService();

    // Get the order
    const order = await orderService.getOrderById(orderId);

    return json(order);
  } catch (error) {
    console.error('Error in order API:', error);
    return json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

/**
 * Action function to update or delete a specific order
 */
export async function action({ request, params }: ActionFunctionArgs) {
  // Verify user is an admin
  await requireAdmin(request);

  try {
    const orderId = params.id;

    if (!orderId) {
      return json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get the order service
    const orderService = await getOrderService();

    if (request.method === 'PATCH' || request.method === 'PUT') {
      // Update the order
      const formData = await request.json();
      const updatedOrder = await orderService.updateOrder(orderId, formData);
      return json(updatedOrder);
    } else {
      return json({ error: 'Method not allowed' }, { status: 405 });
    }
  } catch (error) {
    console.error('Error in order API action:', error);
    return json({ error: 'Failed to process order' }, { status: 500 });
  }
}
