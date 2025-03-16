import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { requireAuth } from '~/server/middleware/auth.server';

import { getOrderById } from '~/features/orders/api/actions.server';
import { OrderDetail } from '~/features/orders/components';

/**
 * Loader function to get a specific order
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  // Require authenticated user
  const { user } = await requireAuth(request);

  // Get orderId parameter
  const orderId = params.id;
  if (!orderId) {
    throw new Response('Order ID is required', { status: 400 });
  }

  // Get order details
  const order = await getOrderById(orderId);

  if (!order) {
    throw new Response('Order not found', { status: 404 });
  }

  // Verify the order belongs to the user
  if (order.userId !== user.id) {
    throw new Response('Unauthorized', { status: 403 });
  }

  return json({ order });
}

export default function OrderDetailPage() {
  const { order } = useLoaderData<typeof loader>();

  return (
    <div className="container py-8">
      <OrderDetail order={order} />
    </div>
  );
}
