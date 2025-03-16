import { type Order, type OrderStatus } from '../../types';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { formatDate } from '~/lib/utils';

interface OrderSummaryProps {
  order: Order;
  showDetailLink?: boolean;
}

/**
 * Component to display a summary of an order for customers
 */
export function OrderSummary({ order, showDetailLink = true }: OrderSummaryProps) {
  /**
   * Get badge color based on order status
   */
  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-500 text-white';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Get a user-friendly status message
   */
  const getStatusMessage = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'Your order is being processed';
      case 'processing':
        return 'Your order is being prepared';
      case 'paid':
        return 'Payment received, preparing your order';
      case 'completed':
        return 'Your order has been delivered';
      case 'cancelled':
        return 'This order has been cancelled';
      case 'refunded':
        return 'This order has been refunded';
      case 'failed':
        return 'There was an issue with your order';
      default:
        return 'Order status unavailable';
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader className="bg-gray-50 border-b pb-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle className="text-base">
              Order #<span data-testid="order-number">{order.orderNumber}</span>
            </CardTitle>
            <CardDescription>
              Placed on <span data-testid="order-date">{formatDate(order.createdAt)}</span>
            </CardDescription>
          </div>
          <Badge className={getStatusBadgeColor(order.status)}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="text-sm">{getStatusMessage(order.status)}</div>

          <div className="flex justify-between text-sm mb-2">
            <span>{order.items.reduce((total, item) => total + item.quantity, 0)} items</span>
            <span>Order total: ${(order.totalAmount || 0).toFixed(2)}</span>
          </div>

          <div className="border-t border-b py-3">
            {order.items.slice(0, 3).map(item => (
              <div key={item.id} className="flex justify-between items-center py-2">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 w-12 h-12 rounded flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt="Product thumbnail"
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-xs text-center">No image</div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium truncate max-w-[200px]" title={item.name}>
                      {item.name.length > 30 ? `${item.name.substring(0, 30)}...` : item.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Qty: {item.quantity} × ${(item.unitPrice || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="font-medium">${(item.totalPrice || 0).toFixed(2)}</div>
              </div>
            ))}

            {order.items.length > 3 && (
              <div className="text-sm text-gray-500 mt-2">
                + {order.items.length - 3} more item(s)
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${(order.subtotalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping:</span>
              <span>${(order.shippingCost || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>${(order.taxAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium mt-2">
              <span>Total:</span>
              <span>${(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          {showDetailLink && (
            <div className="mt-4 flex justify-center gap-4">
              <a
                href={`/account/orders/${order.id}`}
                className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
              >
                View Details
              </a>

              {order.metadata?.tracking?.url && (
                <a
                  href={order.metadata.tracking.url}
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Track Order
                </a>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
