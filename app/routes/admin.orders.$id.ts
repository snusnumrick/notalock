import { json } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware/auth.server';
import { getOrderById } from '~/features/orders/api/queries.server';
import { PaymentStatus } from '~/features/payment';
import { OrderStatus, getOrderService } from '~/features/orders';

/**
 * Load single order details for admin
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  // Check admin authentication
  await requireAdmin(request);

  // Ensure we have an order ID
  if (!params.id) {
    return json({ error: 'Order ID is required' }, { status: 400 });
  }

  // Get the order by ID
  const order = await getOrderById(params.id);

  if (!order) {
    return json({ error: 'Order not found' }, { status: 404 });
  }

  return json({ order });
}

/**
 * Handle order updates from admin
 */
export async function action({ request, params }: ActionFunctionArgs) {
  // Check admin authentication
  await requireAdmin(request);

  const orderService = await getOrderService();

  // Only process POST/PUT requests
  if (request.method !== 'POST' && request.method !== 'PUT') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Ensure we have an order ID
  if (!params.id) {
    return json({ error: 'Order ID is required' }, { status: 400 });
  }

  // Parse request body
  const formData = await request.formData();
  const intent = formData.get('intent')?.toString();

  if (intent === 'updateStatus') {
    const status = formData.get('status')?.toString();
    const notes = formData.get('notes')?.toString();

    if (!status) {
      return json({ error: 'Status is required' }, { status: 400 });
    }

    const order = await orderService.updateOrderStatus(params.id, status as OrderStatus, notes);

    return json({ order, success: true });
  } else if (intent === 'updatePaymentStatus') {
    const paymentStatus = formData.get('paymentStatus')?.toString();
    const notes = formData.get('notes')?.toString();

    if (!paymentStatus) {
      return json({ error: 'Payment status is required' }, { status: 400 });
    }

    const order = await orderService.updatePaymentStatus(
      params.id,
      paymentStatus as PaymentStatus,
      undefined,
      notes
    );

    return json({ order, success: true });
  }

  return json({ error: 'Invalid action intent' }, { status: 400 });
}
