import { useState } from 'react';
import { Order, OrderStatus, PaymentStatus } from '~/features/orders/types';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { formatDate } from '~/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

interface OrderDetailProps {
  order: Order;
  onStatusChange?: (orderId: string, status: OrderStatus) => Promise<void>;
  isLoading?: boolean;
}

export function OrderDetail({ order, onStatusChange, isLoading = false }: OrderDetailProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status);

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

  const getPaymentStatusBadgeColor = (status: PaymentStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-500 text-white';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus as OrderStatus);
    if (onStatusChange) {
      await onStatusChange(order.id, newStatus as OrderStatus);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
          <div className="text-sm text-gray-500">Created on {formatDate(order.createdAt)}</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">Order Status</div>
            {onStatusChange ? (
              <div className="flex items-center gap-2">
                <Select
                  defaultValue={status}
                  onValueChange={handleStatusChange}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                {isLoading && <div className="animate-spin">⟳</div>}
              </div>
            ) : (
              <Badge className={getStatusBadgeColor(order.status)}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-1 mt-2 sm:mt-0">
            <div className="text-sm font-medium">Payment Status</div>
            <Badge className={getPaymentStatusBadgeColor(order.paymentStatus)}>
              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Order Items</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Items included in this order</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.totalPrice.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} />
                    <TableCell className="text-right font-medium">Subtotal</TableCell>
                    <TableCell className="text-right">${order.subtotalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} />
                    <TableCell className="text-right font-medium">Shipping</TableCell>
                    <TableCell className="text-right">${order.shippingCost.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} />
                    <TableCell className="text-right font-medium">Tax</TableCell>
                    <TableCell className="text-right">${order.taxAmount.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} />
                    <TableCell className="text-right font-medium">Total</TableCell>
                    <TableCell className="text-right font-bold">
                      ${order.totalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Details about the customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Contact Information</h3>
                <p className="text-sm">Email: {order.email}</p>
                {order.shippingAddress?.phone && (
                  <p className="text-sm">Phone: {order.shippingAddress.phone}</p>
                )}
              </div>

              {order.userId && (
                <div>
                  <h3 className="font-semibold mb-1">Account</h3>
                  <p className="text-sm">User ID: {order.userId}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
              <CardDescription>Shipping details and address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.shippingMethod && (
                <div>
                  <h3 className="font-semibold mb-1">Shipping Method</h3>
                  <p className="text-sm">{order.shippingMethod}</p>
                  <p className="text-sm">Cost: ${order.shippingCost.toFixed(2)}</p>
                </div>
              )}

              {order.shippingAddress && (
                <div>
                  <h3 className="font-semibold mb-1">Shipping Address</h3>
                  <div className="text-sm">
                    <p>
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                    <p>{order.shippingAddress.address1}</p>
                    {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                      {order.shippingAddress.postalCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
              )}

              {order.billingAddress && (
                <div>
                  <h3 className="font-semibold mb-1">Billing Address</h3>
                  <div className="text-sm">
                    <p>
                      {order.billingAddress.firstName} {order.billingAddress.lastName}
                    </p>
                    <p>{order.billingAddress.address1}</p>
                    {order.billingAddress.address2 && <p>{order.billingAddress.address2}</p>}
                    <p>
                      {order.billingAddress.city}, {order.billingAddress.state}{' '}
                      {order.billingAddress.postalCode}
                    </p>
                    <p>{order.billingAddress.country}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Payment details and transaction information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Payment Method</h3>
                <p className="text-sm">{order.paymentProvider || 'Not specified'}</p>
                <p className="text-sm">
                  Status:{' '}
                  <Badge className={getPaymentStatusBadgeColor(order.paymentStatus)}>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </Badge>
                </p>
              </div>

              {order.paymentIntentId && (
                <div>
                  <h3 className="font-semibold mb-1">Transaction Details</h3>
                  <p className="text-sm">Payment Intent ID: {order.paymentIntentId}</p>
                  {order.paymentMethodId && (
                    <p className="text-sm">Payment Method ID: {order.paymentMethodId}</p>
                  )}
                </div>
              )}

              {order.notes && (
                <div>
                  <h3 className="font-semibold mb-1">Payment Notes</h3>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>Timeline of order status changes</CardDescription>
            </CardHeader>
            <CardContent>
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {order.statusHistory.map(entry => (
                    <div key={entry.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusBadgeColor(entry.status)}>
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </Badge>
                        <span className="text-sm text-gray-500">{formatDate(entry.createdAt)}</span>
                      </div>
                      {entry.notes && <p className="text-sm mt-1">{entry.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No status history available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Back to Orders</Button>
        <Button variant="default">Print Order</Button>
      </div>
    </div>
  );
}
