import React, { useState } from 'react';
import { Order, OrderStatus, PaymentStatus } from '~/features/orders/types';
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
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Link } from '@remix-run/react';
import { formatDate } from '~/lib/utils';

interface OrdersTableProps {
  orders: Order[];
  loading?: boolean;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
}

/**
 * Admin orders table component
 */
export function OrdersTable({ orders, loading = false, onStatusChange }: OrdersTableProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

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

  const handleStatusChange = (orderId: string, status: string) => {
    if (onStatusChange) {
      onStatusChange(orderId, status as OrderStatus);
    }
  };

  if (loading) {
    return <p className="text-center py-4">Loading orders...</p>;
  }

  if (orders.length === 0) {
    return <p className="text-center py-4">No orders found.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Order #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => (
            <React.Fragment key={order.id}>
              <TableRow>
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>{order.email}</TableCell>
                <TableCell>${(order.totalAmount || 0).toFixed(2)}</TableCell>
                <TableCell>
                  {onStatusChange ? (
                    <Select
                      defaultValue={order.status}
                      onValueChange={value => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-[130px]">
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
                  ) : (
                    <Badge
                      className={getStatusBadgeColor(order.status)}
                      data-testid="order-status-badge"
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={getPaymentStatusBadgeColor(order.paymentStatus)}
                    data-testid="payment-status-badge"
                  >
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleOrderDetails(order.id)}>
                    {expandedOrder === order.id ? 'Hide' : 'View'}
                  </Button>
                  <Link to={`/admin/orders/${order.id}`}>
                    <Button variant="outline" size="sm" className="ml-2">
                      Details
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
              {expandedOrder === order.id && (
                <TableRow key={`${order.id}-details`}>
                  <TableCell colSpan={7} className="bg-gray-50">
                    <div className="p-4">
                      <h4 className="font-semibold mb-2">Order Items</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map(item => (
                            <TableRow key={item.id}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.sku}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${(item.unitPrice || 0).toFixed(2)}</TableCell>
                              <TableCell>${(item.totalPrice || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Shipping Address</h4>
                          {order.shippingAddress ? (
                            <div className="text-sm">
                              <p>
                                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                              </p>
                              <p>{order.shippingAddress.address1}</p>
                              {order.shippingAddress.address2 && (
                                <p>{order.shippingAddress.address2}</p>
                              )}
                              <p>
                                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                                {order.shippingAddress.postalCode}
                              </p>
                              <p>{order.shippingAddress.country}</p>
                              <p>{order.shippingAddress.phone}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No shipping address provided</p>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Order Summary</h4>
                          <div className="text-sm">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>${(order.subtotalAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Shipping:</span>
                              <span>${(order.shippingCost || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tax:</span>
                              <span>${(order.taxAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-semibold mt-2">
                              <span>Total:</span>
                              <span>${(order.totalAmount || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {order.notes && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Notes</h4>
                          <p className="text-sm">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
