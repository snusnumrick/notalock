import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { formatCurrency, formatDate } from '~/lib/utils';
import { type Order } from '~/features/orders/types';

interface OrderAnalyticsProps {
  orders: Order[];
  loading?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export const OrderAnalytics: React.FC<OrderAnalyticsProps> = ({
  orders = [],
  loading = false,
  startDate,
  endDate,
}) => {
  // Filter orders by date range if provided
  const filteredOrders = useMemo(() => {
    if (!startDate && !endDate) return orders;

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  // Calculate metrics
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const completedOrders = filteredOrders.filter(
    order => order.status.toLowerCase() === 'completed'
  ).length;

  // Calculate status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredOrders.forEach(order => {
      const status = order.status.toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  }, [filteredOrders]);

  // Calculate top products
  const topProducts = useMemo(() => {
    const productMap = new Map();

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.totalPrice;
        } else {
          productMap.set(item.productId, {
            id: item.productId,
            name: item.name,
            quantity: item.quantity,
            revenue: item.totalPrice,
          });
        }
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders]);

  // Generate daily revenue data for line chart
  const revenueByDay = useMemo(() => {
    const dailyData: Record<string, number> = {};

    filteredOrders.forEach(order => {
      const date = formatDate(order.createdAt, 'yyyy-MM-dd');
      dailyData[date] = (dailyData[date] || 0) + (order.totalAmount || 0);
    });

    return Object.entries(dailyData)
      .map(([date, value]) => ({
        date,
        revenue: value,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  // Pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Show loading state
  if (loading) {
    return <div className="text-center py-10">Loading analytics...</div>;
  }

  // Show empty state
  if (filteredOrders.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-semibold mb-2">No order data available</h3>
        <p className="text-gray-500">
          Once orders start coming in, you&apos;ll see analytics here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue over time chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByDay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={value => formatCurrency(value as number)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order status distribution chart */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={value => [value, 'Orders']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top products section */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    name === 'quantity' ? 'Units Sold' : 'Revenue',
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="quantity"
                  name="Units Sold"
                  fill="#8884d8"
                  label={{
                    position: 'top',
                    formatter: val => `${val} ${val === 1 ? 'unit' : 'units'}`,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderAnalytics;
