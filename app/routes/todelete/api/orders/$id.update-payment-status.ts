import { json, type ActionFunctionArgs } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware/auth.server';
import { getOrderService } from '~/features/orders/api/orderService';
import type { PaymentStatus } from '~/features/orders/types';

/**
 * Action function to update an order's payment status
 */
export async function action({ request, params }: ActionFunctionArgs) {
  try {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, { status: 405 });
    }

    // Get the order ID
    const orderId = params.id;
    if (!orderId) {
      return json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Parse the request body
    const { paymentStatus, notes } = await request.json();

    // Validate the payment status
    if (!paymentStatus) {
      return json({ error: 'Payment status is required' }, { status: 400 });
    }

    // Validate the status value
    const validStatuses: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus as PaymentStatus)) {
      return json({ error: 'Invalid payment status value' }, { status: 400 });
    }

    // Update payment status through a webhook payload
    // This endpoint doesn't require admin auth when coming from a payment webhook
    if (
      request.headers.get('x-webhook-source') === 'payment-processor' &&
      request.headers.get('x-webhook-signature')
    ) {
      const orderService = await getOrderService();
      const updatedOrder = await orderService.updatePaymentStatus(
        orderId,
        paymentStatus as PaymentStatus,
        undefined,
        notes || 'Payment status updated via webhook'
      );

      return json({
        success: true,
        message: `Order payment status updated to ${paymentStatus}`,
        order: updatedOrder,
      });
    }

    // Check for admin access for non-webhook updates
    await requireAdmin(request);

    // Get the order service
    const orderService = await getOrderService();

    // Update the order status
    const updatedOrder = await orderService.updatePaymentStatus(
      orderId,
      paymentStatus as PaymentStatus,
      undefined,
      notes
    );

    return json({
      success: true,
      message: `Order payment status updated to ${paymentStatus}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order payment status:', error);
    return json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
