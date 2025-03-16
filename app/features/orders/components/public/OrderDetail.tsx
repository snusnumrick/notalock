import { type Order, type OrderStatus } from '../../types';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { formatDate } from '~/lib/utils';

interface OrderDetailProps {
  order: Order;
}

/**
 * Component to display detailed order information for customers
 */
export function OrderDetail({ order }: OrderDetailProps) {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <Badge className={getStatusBadgeColor(order.status)}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Items */}
        <Card className="md:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 w-16 h-16 rounded flex items-center justify-center">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-14 h-14 object-contain"
                        />
                      ) : (
                        <div className="text-gray-400 text-xs text-center">No image</div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      {item.options && item.options.length > 0 && (
                        <div className="text-sm text-gray-500">
                          {item.options.map(option => (
                            <span key={option.name}>
                              {option.name}: {option.value}
                              {option !== item.options![item.options!.length - 1] && ', '}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${(item.totalPrice || 0).toFixed(2)}</div>
                    <div className="text-sm text-gray-500">
                      {item.quantity} × ${(item.unitPrice || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${(order.subtotalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>${(order.shippingCost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${(order.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>${(order.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {order.shippingAddress ? (
              <div className="space-y-2">
                <p className="font-medium">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
                <div className="pt-4 border-t mt-4">
                  <p className="font-medium">Shipping Method</p>
                  <p>{order.shippingMethod || 'Standard Shipping'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No shipping information available</p>
            )}
          </CardContent>
        </Card>

        {/* Order Information */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <p className="font-medium">Order Number</p>
                <p>{order.orderNumber}</p>
              </div>
              <div>
                <p className="font-medium">Order Date</p>
                <p>{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium">Order Status</p>
                <p>
                  <Badge className={getStatusBadgeColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="font-medium">Payment Status</p>
                <p>{order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</p>
              </div>
              {order.paymentIntentId && (
                <div>
                  <p className="font-medium">Payment Reference</p>
                  <p className="text-sm">{order.paymentIntentId}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button variant="outline" asChild>
          <a href="/todelete/account/orders">Back to Orders</a>
        </Button>
        <div className="flex gap-2">
          <Button asChild>
            <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
              View Invoice
            </a>
          </Button>
          {['pending', 'processing'].includes(order.status) && (
            <Button variant="destructive" asChild>
              <a href={`/api/orders/${order.id}/cancel`}>Cancel Order</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
