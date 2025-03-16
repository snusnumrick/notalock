import { useState } from 'react';
import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData, useSubmit, useSearchParams } from '@remix-run/react';
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
import type { OrderStatus } from '~/features/orders/types';

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify the user is an admin
  await requireAdmin(request);

  console.log('🔍 ORDERS LIST LOADER RUNNING (INDEX)');

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

  // Get orders with filters
  const { orders, total } = await orderService.getOrders(filterOptions);

  // Calculate pagination information
  const totalPages = Math.ceil(total / limit);

  return json({
    orders,
    total,
    currentPage: page,
    totalPages,
    limit,
  });
}

export default function OrdersRoute() {
  const { orders, total, currentPage, totalPages, limit } = useLoaderData<typeof loader>();

  console.log('🔍 ORDERS LIST COMPONENT RENDERING (INDEX)');

  const [searchParams, setSearchParams] = useSearchParams();
  const submit = useSubmit();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');

  // Handle status change for an order
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('status', newStatus);
    formData.append('_action', 'updateStatus');

    submit(formData, { method: 'post', action: `/api/orders/${orderId}/status` });
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

        <OrdersTable orders={orders} onStatusChange={handleStatusChange} />

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
