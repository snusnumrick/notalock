import React, { useState, useEffect } from 'react';
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
  const [orderStatusOptions, setOrderStatusOptions] = useState<Record<string, OrderStatus[]>>({});

  // Fetch available status transitions for each order
  useEffect(() => {
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return;
    }

    const fetchOrderStatusOptions = async () => {
      const options: Record<string, OrderStatus[]> = {};

      for (const order of orders) {
        try {
          const response = await fetch(`/api/orders/${order.id}/status`);
          if (response.ok) {
            const data = await response.json();
            if (data.allowedTransitions && Array.isArray(data.allowedTransitions)) {
              options[order.id] = data.allowedTransitions;
            }
          }
        } catch (error) {
          console.error(`Error fetching status options for order ${order.id}:`, error);
        }
      }

      setOrderStatusOptions(options);
    };

    fetchOrderStatusOptions();
  }, [orders]);

  console.log('OrdersTable rendering with:', {
    orderCount: orders?.length,
    loading,
    ordersArray: Array.isArray(orders),
    orderItems: orders?.[0]?.items ? 'has items' : 'no items',
    firstOrderSample: orders?.[0]
      ? JSON.stringify(orders[0]).substring(0, 200) + '...'
      : 'No orders',
  });

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
      try {
        onStatusChange(orderId, status as OrderStatus);
      } catch (err) {
        console.error('Error in handleStatusChange:', err);
      }
    }
  };

  if (loading) {
    return <p className="text-center py-4">Loading orders...</p>;
  }

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    console.log('Rendering no orders found message');
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-500 mb-2">No orders found</p>
        <p className="text-sm text-gray-400">
          Orders will appear here once customers make purchases
        </p>
      </div>
    );
  }

  // Safety check for orders.map
  try {
    if (!orders.map) {
      console.error('orders does not have map function:', orders);
      return (
        <div className="p-8 text-center">
          <p className="text-lg text-red-500 mb-2">Error: Invalid orders data format</p>
        </div>
      );
    }
  } catch (err) {
    console.error('Error checking orders:', err);
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-red-500 mb-2">Error processing orders data</p>
      </div>
    );
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
                        {/* Always keep current status as an option */}
                        <SelectItem value={order.status}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </SelectItem>

                        {/* Show allowed transitions */}
                        {orderStatusOptions[order.id]
                          ?.filter(s => s !== order.status)
                          .map(status => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}

                        {/* If no allowed transitions detected, show core statuses */}
                        {(!orderStatusOptions[order.id] ||
                          orderStatusOptions[order.id].length === 0) &&
                          [
                            'pending',
                            'processing',
                            'paid',
                            'completed',
                            'cancelled',
                            'refunded',
                            'failed',
                          ]
                            .filter(s => s !== order.status)
                            .map(status => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </SelectItem>
                            ))}
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
