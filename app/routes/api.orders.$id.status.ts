import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/node';
import { v4 } from 'uuid';
import { requireAdmin } from '~/server/middleware/auth.server';
import { getOrderService } from '~/features/orders/api/orderService';
import {
  getAllowedOrderStatusTransitions,
  VALID_ORDER_STATUSES,
} from '~/features/orders/utils/order-validator';
import type { OrderStatus } from '~/features/orders/types';

/**
 * Loader function to handle GET requests
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    // Verify user is an admin
    await requireAdmin(request);

    const orderId = params.id;

    if (!orderId) {
      throw new Response('Order ID is required', { status: 400 });
    }

    // Get the order service
    const orderService = await getOrderService();

    // Get the order
    const order = await orderService.getOrderById(orderId);

    if (!order) {
      throw new Response('Order not found', { status: 404 });
    }

    // Get allowed transitions for this order
    const allowedTransitions = getAllowedOrderStatusTransitions(order.status);

    return json({
      order,
      currentStatus: order.status,
      allowedTransitions,
    });
  } catch (error) {
    // Always let Remix handle redirects or response errors
    if (error instanceof Response) {
      throw error;
    }

    console.error('Error in order status API:', error);
    throw new Response(
      JSON.stringify({
        error: 'Failed to fetch order status',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Action function to update an order's status
 */
export async function action({ request, params }: ActionFunctionArgs) {
  try {
    // Verify user is an admin
    await requireAdmin(request);

    const orderId = params.id;

    if (!orderId) {
      throw new Response('Order ID is required', { status: 400 });
    }

    // Check method
    if (request.method !== 'PATCH' && request.method !== 'PUT') {
      throw new Response('Method not allowed', { status: 405 });
    }

    // Parse the request body
    let requestData;
    try {
      requestData = await request.json();
      console.log('Request body:', requestData);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      throw new Response('Invalid request body format', { status: 400 });
    }

    const { status, notes } = requestData;

    // Validate status
    if (!status) {
      throw new Response('Status is required', { status: 400 });
    }

    // Validate the status is a valid OrderStatus
    if (!VALID_ORDER_STATUSES.includes(status as OrderStatus)) {
      throw new Response(`Invalid status value: ${status}`, { status: 400 });
    }

    // Ensure status is properly recognized as an OrderStatus enum value
    const orderStatus = status as OrderStatus;

    // Get the order service
    const orderService = await getOrderService();

    try {
      // Update the order status using the OrderService method
      const updatedOrder = await orderService.updateOrderStatus(orderId, orderStatus);

      // Add a status history entry if notes are provided
      if (notes) {
        try {
          await orderService.addOrderStatusHistory({
            id: v4(),
            order_id: orderId,
            status: status,
            notes: notes,
            created_at: new Date().toISOString(),
            created_by: 'system',
          });
        } catch (error) {
          console.log('Continue even if adding history fails');
        }
      }

      return json(updatedOrder);
    } catch (updateError) {
      // Handle status transition errors
      if (
        updateError instanceof Error &&
        updateError.message.includes('Invalid status transition')
      ) {
        // Get the current order to fetch allowed transitions
        const order = await orderService.getOrderById(orderId);
        const allowedTransitions = getAllowedOrderStatusTransitions(order.status);

        throw new Response(
          JSON.stringify({
            error: updateError.message,
            currentStatus: order.status,
            requestedStatus: status,
            allowedTransitions,
          }),
          {
            status: 422, // Unprocessable Entity
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Other errors
      throw updateError;
    }
  } catch (error) {
    // Always let Remix handle redirects or response errors
    if (error instanceof Response) {
      throw error;
    }

    console.error('Error in order status API:', error);

    // Extract more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';

    console.error('Detailed error info:', {
      message: errorMessage,
      stack: errorStack,
      orderId: params.id,
    });

    // Check for specific database type errors
    const isDbTypeError = errorMessage.includes('column "status" is of type order_status');

    throw new Response(
      JSON.stringify({
        error: isDbTypeError ? 'Database type error' : 'Failed to update order status',
        message: errorMessage,
        isDbTypeError: isDbTypeError,
      }),
      {
        status: isDbTypeError ? 422 : 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
