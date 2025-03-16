import { type Order } from '../../types';
import { OrderSummary } from './OrderSummary';

interface OrdersListProps {
  orders: Order[];
  isLoading?: boolean;
  emptyMessage?: string;
}

/**
 * Component to display a list of customer orders
 */
export function OrdersList({
  orders,
  isLoading = false,
  emptyMessage = 'No orders found.',
}: OrdersListProps) {
  if (isLoading) {
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
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map(order => (
        <OrderSummary key={order.id} order={order} />
      ))}
    </div>
  );
}
