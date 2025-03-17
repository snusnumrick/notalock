import { Outlet } from '@remix-run/react';
import { requireAdmin } from '~/server/middleware/auth.server';
import { type LoaderFunctionArgs, type MetaFunction, json } from '@remix-run/node';
import { getOrders, getOrderById } from '~/features/orders/api/queries.server';
import type { OrderStatus, PaymentStatus } from '~/features/orders/types';

export const meta: MetaFunction = () => {
  return [
    { title: 'Admin Orders | Notalock' },
    { name: 'description', content: 'Notalock Admin Orders Management' },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Verify the user is an admin
  await requireAdmin(request);

  console.log('🔍 ORDERS LAYOUT LOADER RUNNING');

  // Get URL search params
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;
  const status = url.searchParams.get('status') || undefined;
  const paymentStatus = url.searchParams.get('paymentStatus') || undefined;
  const searchQuery = url.searchParams.get('search') || undefined;

  // Check if we have an orderId parameter
  if (params.orderId) {
    // Get the specific order
    const order = await getOrderById(params.orderId);

    if (!order) {
      return json({ error: 'Order not found' }, { status: 404 });
    }

    return json({ order });
  }

  // Check if we're directly on /admin/orders without a child route
  if (url.pathname === '/admin/orders') {
    // Get a list of orders with filters
    const ordersResult = await getOrders({
      status: status as OrderStatus | undefined,
      paymentStatus: paymentStatus as PaymentStatus | undefined,
      searchQuery,
      limit,
      offset,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });

    return json({
      orders: ordersResult.orders,
      total: ordersResult.total,
      page,
      limit,
      totalPages: Math.ceil(ordersResult.total / limit),
    });
  }

  return null;
}

export default function OrdersLayout() {
  console.log('🔍 ORDERS LAYOUT COMPONENT RENDERING');

  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}
