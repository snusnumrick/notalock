import { useState, FormEvent } from 'react';
import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData, useSearchParams } from '@remix-run/react';
import { requireAdmin } from '~/server/middleware/auth.server';
import { getOrderService } from '~/features/orders/api/orderService';
import { OrdersTable } from '~/features/orders/components/admin/OrdersTable';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Order, type OrderStatus } from '~/features/orders/types';

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify the user is an admin
  await requireAdmin(request);

  console.log('🔍 ORDERS LIST LOADER RUNNING (INDEX)');

  try {
    // Get query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Extract filter parameters
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get the order service
    const orderService = await getOrderService();

    // Prepare filter options
    const filterOptions = {
      searchQuery: search || undefined,
      status: status as OrderStatus | undefined,
      dateFrom,
      dateTo,
      limit,
      offset,
      sortBy: 'createdAt' as const,
      sortDirection: 'desc' as const,
    };

    console.log('Filter options:', filterOptions);

    // Get orders with filters
    const { orders, total } = await orderService.getOrders(filterOptions);

    console.log('Orders fetched successfully:', { count: orders?.length || 0, total });

    // Calculate pagination information
    const totalPages = Math.ceil(total / limit);

    return json({
      orders: orders || [],
      total,
      currentPage: page,
      totalPages,
      limit,
      error: null,
    });
  } catch (error) {
    console.error('Error loading orders:', error);
    return json({
      orders: [],
      total: 0,
      currentPage: 1,
      totalPages: 0,
      limit: 10,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
}

export default function OrdersIndexRoute() {
  const { orders, total, currentPage, totalPages, limit, error } = useLoaderData<typeof loader>();

  console.log('🔍 ORDERS LIST COMPONENT RENDERING (INDEX)', {
    ordersCount: orders?.length,
    ordersArray: Array.isArray(orders),
    firstOrder: orders?.[0] ? JSON.stringify(orders[0]).substring(0, 200) + '...' : 'No orders',
    total,
    error,
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');

  try {
    if (orders && (!Array.isArray(orders) || !orders.map)) {
      console.error('Invalid orders data format:', typeof orders, orders);
      return (
        <div className="container py-8">
          <h1 className="text-2xl font-bold mb-6">Orders</h1>
          <div className="bg-yellow-100 p-4 rounded-md border border-yellow-300 mb-6">
            <p className="text-yellow-700">
              Error: Invalid order data format received. Please contact support.
            </p>
          </div>
        </div>
      );
    }
  } catch (err) {
    console.error('Error checking orders data:', err);
  }

  // Handle status change for an order
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      console.log('Updating order status:', { orderId, newStatus });

      // Make a direct fetch call to the API endpoint
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: 'Status updated via admin panel',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating order status:', errorData);

        // Create a user-friendly message
        let errorMessage = 'Failed to update order status.';

        if (errorData.error) {
          if (errorData.error.includes('Invalid status transition')) {
            errorMessage = errorData.error;
            if (errorData.allowedTransitions && errorData.allowedTransitions.length > 0) {
              errorMessage += `\nAllowed transitions: ${errorData.allowedTransitions.join(', ')}`;
            }
          } else if (
            errorData.message &&
            errorData.message.includes('column "status" is of type order_status')
          ) {
            errorMessage =
              'The selected status is not compatible with the database. Please try a different status.';
          } else {
            // Include the actual error message
            errorMessage = errorData.message || errorData.error;
          }
        }

        // Create a better error display rather than using window.alert
        const errorElement = document.createElement('div');
        errorElement.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        errorElement.innerHTML = `
          <div class="bg-white p-6 rounded-lg max-w-md w-full shadow-lg">
            <h3 class="text-lg font-bold text-red-600 mb-2">Error Updating Order Status</h3>
            <p class="mb-4">${errorMessage}</p>
            <div class="flex justify-end">
              <button class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" id="close-error">Close</button>
            </div>
          </div>
        `;
        document.body.appendChild(errorElement);

        // Add event listener to close button
        document.getElementById('close-error')?.addEventListener('click', () => {
          document.body.removeChild(errorElement);
        });

        return;
      }

      // Success! Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating order status:', error);
      window.alert('A network error occurred while updating the status. Please try again.');
    }
  };

  // Handle filter form submission
  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();

    const newParams = new URLSearchParams(searchParams);
    if (search) newParams.set('search', search);
    else newParams.delete('search');

    if (status && status !== 'all') newParams.set('status', status);
    else newParams.delete('status');

    if (dateFrom) newParams.set('dateFrom', dateFrom);
    else newParams.delete('dateFrom');

    if (dateTo) newParams.set('dateTo', dateTo);
    else newParams.delete('dateTo');

    // Reset to first page when filtering
    newParams.set('page', '1');

    setSearchParams(newParams);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
  };

  // Handle clearing filters
  const handleClearFilters = () => {
    setSearch('');
    setStatus('all');
    setDateFrom('');
    setDateTo('');
    setSearchParams(new URLSearchParams({ page: '1' }));
  };

  return (
    <div className="container py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Orders</h1>
          <p className="text-gray-500">Manage and track customer orders</p>
        </div>
        <Link
          to="/admin/orders/analytics"
          className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors"
        >
          View Analytics
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-medium mb-4">Filter Orders</h2>
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium mb-1">
                Search
              </label>
              <Input
                id="search"
                name="search"
                placeholder="Order # or email"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium mb-1">
                Date From
              </label>
              <Input
                id="dateFrom"
                name="dateFrom"
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium mb-1">
                Date To
              </label>
              <Input
                id="dateTo"
                name="dateTo"
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
            <Button type="submit">Apply Filters</Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">
              {total} {total === 1 ? 'Order' : 'Orders'}
            </h2>
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <p className="text-lg text-red-500 mb-2">Error loading orders</p>
            <p className="text-sm text-gray-700">{error}</p>
          </div>
        ) : (
          <OrdersTable orders={orders as Order[]} onStatusChange={handleStatusChange} />
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, total)} of{' '}
              {total} orders
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
