import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware/auth.server';
import { getOrders, getOrderById } from '~/features/orders/api/queries.server';
import { PaymentStatus } from '~/features/payment';
import { OrderStatus } from '~/features/orders';

/**
 * Admin orders route loader
 * Handles both order list and single order view
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  // Check admin authentication
  await requireAdmin(request);

  // Get URL search params
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;
  const status = url.searchParams.get('status') || undefined;
  const paymentStatus = url.searchParams.get('paymentStatus') || undefined;
  const searchQuery = url.searchParams.get('search') || undefined;

  // Get orders with filters
  const ordersResult = await getOrders({
    status: status as OrderStatus,
    paymentStatus: paymentStatus ? (paymentStatus as PaymentStatus) : undefined,
    searchQuery,
    limit,
    offset,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });

  // Get a specific order if requested
  let order = null;
  if (params.orderId) {
    order = await getOrderById(params.orderId);

    if (!order) {
      return json({ error: 'Order not found' }, { status: 404 });
    }
  }

  // Return data based on whether we're viewing a list or a single order
  return json(
    order
      ? { order }
      : {
          orders: ordersResult.orders,
          total: ordersResult.total,
          page,
          limit,
          totalPages: Math.ceil(ordersResult.total / limit),
        }
  );
}
