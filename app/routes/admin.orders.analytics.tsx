import { useState } from 'react';
import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { requireAdmin } from '~/server/middleware/auth.server';
import { getOrderService } from '~/features/orders/api/orderService';
import { OrderAnalytics } from '~/features/orders/components/admin/OrderAnalytics';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import type { Order } from '~/features/orders/types';

export async function loader({ request }: LoaderFunctionArgs) {
  // Verify the user is an admin
  await requireAdmin(request);

  console.log('🔍 ANALYTICS LOADER RUNNING');

  // Get query parameters
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Extract date filter parameters
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  // Get all orders for analytics with date filters if provided
  const orderService = await getOrderService();

  // Get orders with date filters but no pagination (we need all orders for analytics)
  const { orders } = await orderService.getOrders({
    dateFrom,
    dateTo,
    limit: 1000, // Fetch more orders for analytics
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });

  return json({
    orders,
    dateFrom,
    dateTo,
  });
}

export default function OrderAnalyticsRoute() {
  const { orders, dateFrom, dateTo } = useLoaderData<typeof loader>();

  console.log('🔍 ANALYTICS COMPONENT RENDERING');

  const [startDate, setStartDate] = useState<Date | undefined>(
    dateFrom ? new Date(dateFrom) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(dateTo ? new Date(dateTo) : undefined);

  // Handle form submission
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create the form target for fetching data
    const formTarget = document.createElement('form');
    formTarget.method = 'get';
    formTarget.action = '/admin/orders/analytics';

    if (startDate) {
      const startDateInput = document.createElement('input');
      startDateInput.name = 'dateFrom';
      startDateInput.value = startDate.toISOString().split('T')[0];
      formTarget.appendChild(startDateInput);
    }

    if (endDate) {
      const endDateInput = document.createElement('input');
      endDateInput.name = 'dateTo';
      endDateInput.value = endDate.toISOString().split('T')[0];
      formTarget.appendChild(endDateInput);
    }

    document.body.appendChild(formTarget);
    formTarget.submit();
    document.body.removeChild(formTarget);
  };

  // Handle clearing filters
  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    window.location.href = '/admin/orders/analytics';
  };

  return (
    <div className="container py-8 bg-indigo-100 border-4 border-indigo-500 rounded-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-indigo-700">ORDER ANALYTICS DASHBOARD</h1>
        <p className="text-gray-500">Track and analyze your store&apos;s order data</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFilterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateFrom" className="block text-sm font-medium mb-1">
                  Start Date
                </label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={e =>
                    setStartDate(e.target.value ? new Date(e.target.value) : undefined)
                  }
                />
              </div>
              <div>
                <label htmlFor="dateTo" className="block text-sm font-medium mb-1">
                  End Date
                </label>
                <Input
                  id="dateTo"
                  type="date"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={e => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
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
        </CardContent>
      </Card>

      <OrderAnalytics
        orders={orders as unknown as Order[]}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
