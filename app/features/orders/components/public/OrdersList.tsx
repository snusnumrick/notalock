import { type Order } from '../../types';
import { OrderSummary } from './OrderSummary';
import { Button } from '~/components/ui/button';

interface OrdersListProps {
  orders: Order[];
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  limit?: number;
}

/**
 * Component to display a list of customer orders
 */
export function OrdersList({
  orders,
  loading = false,
  emptyMessage = 'No orders found.',
  title = 'Your Orders',
  limit,
}: OrdersListProps) {
  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
        <p className="mt-4 text-gray-500">Loading your orders...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">You have no orders yet.</p>
        <p className="text-gray-500 mt-2">Browse our products to place your first order.</p>
        <div className="mt-4">
          <Button asChild>
            <a href="/products">Browse Products</a>
          </Button>
        </div>
      </div>
    );
  }

  // Apply the limit if provided
  const displayedOrders = limit ? orders.slice(0, limit) : orders;
  const hasMoreOrders = limit && orders.length > limit;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>

      {displayedOrders.map(order => (
        <OrderSummary key={order.id} order={order} />
      ))}

      {hasMoreOrders && (
        <div className="mt-6 text-center">
          <Button variant="outline" asChild>
            <a href="/account/orders">View All Orders</a>
          </Button>
        </div>
      )}
    </div>
  );
}
