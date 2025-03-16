import { type ActionFunctionArgs, json, type LoaderFunctionArgs } from '@remix-run/node';
import { requireAdmin } from '~/server/middleware/auth.server';
import { getOrderService } from '~/features/orders/api/orderService';
import type { OrderFilterOptions, OrderStatus, PaymentStatus } from '~/features/orders/types';

/**
 * Loader function to get orders
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Verify user is an admin
  await requireAdmin(request);

  try {
    // Parse search parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Extract filter options from query parameters
    const filterOptions: OrderFilterOptions = {
      limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 10,
      offset: searchParams.has('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy:
        (searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'totalAmount' | 'orderNumber') ||
        'createdAt',
      sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc',
    };

    // Add optional filters if they exist in the query
    if (searchParams.has('userId')) filterOptions.userId = searchParams.get('userId')!;
    if (searchParams.has('email')) filterOptions.email = searchParams.get('email')!;
    if (searchParams.has('status'))
      filterOptions.status = searchParams.get('status')! as OrderStatus;
    if (searchParams.has('paymentStatus'))
      filterOptions.paymentStatus = searchParams.get('paymentStatus')! as PaymentStatus;
    if (searchParams.has('dateFrom')) filterOptions.dateFrom = searchParams.get('dateFrom')!;
    if (searchParams.has('dateTo')) filterOptions.dateTo = searchParams.get('dateTo')!;
    if (searchParams.has('minAmount'))
      filterOptions.minAmount = parseFloat(searchParams.get('minAmount')!);
    if (searchParams.has('maxAmount'))
      filterOptions.maxAmount = parseFloat(searchParams.get('maxAmount')!);
    if (searchParams.has('searchQuery'))
      filterOptions.searchQuery = searchParams.get('searchQuery')!;

    // Get the order service
    const orderService = await getOrderService();

    // Get orders with filters
    const orders = await orderService.getOrders(filterOptions);

    return json(orders);
  } catch (error) {
    console.error('Error in orders API:', error);
    return json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

/**
 * Action function to create or update orders
 */
export async function action({ request }: ActionFunctionArgs) {
  // Verify user is an admin
  await requireAdmin(request);

  try {
    // Parse request data
    const formData = await request.json();

    // Get the order service
    const orderService = await getOrderService();

    if (request.method === 'PUT' && formData.id) {
      // Update an existing order
      const updatedOrder = await orderService.updateOrder(formData.id, formData);
      return json(updatedOrder);
    } else if (request.method === 'POST') {
      // Create a new order
      const newOrder = await orderService.createOrder(formData);
      return json(newOrder, { status: 201 });
    } else {
      return json({ error: 'Invalid request method or missing ID for update' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in orders API action:', error);
    return json({ error: 'Failed to process order' }, { status: 500 });
  }
}
