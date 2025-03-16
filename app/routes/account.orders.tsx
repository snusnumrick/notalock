import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { requireAuth } from '~/server/middleware/auth.server';

import { OrdersList } from '~/features/orders/components';
import { getUserOrders } from '~/features/orders/api/actions.server';

/**
 * Loader function to get user orders
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Require authenticated user
  const { user } = await requireAuth(request);

  // Get user orders
  const orders = await getUserOrders(user.id);

  return json({ orders });
}

export default function AccountOrdersPage() {
  const { orders } = useLoaderData<typeof loader>();

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

      <OrdersList orders={orders} emptyMessage="You haven't placed any orders yet." />
    </div>
  );
}
