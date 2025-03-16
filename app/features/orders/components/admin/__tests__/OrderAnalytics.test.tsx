import { render, screen } from '@testing-library/react';
import { OrderAnalytics } from '../OrderAnalytics';
import { type Order, OrderStatus, PaymentStatus } from '../../../types';
import { vi } from 'vitest';

// Mock the charting library to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar"></div>,
  XAxis: () => <div data-testid="x-axis"></div>,
  YAxis: () => <div data-testid="y-axis"></div>,
  Tooltip: () => <div data-testid="tooltip"></div>,
  Legend: () => <div data-testid="legend"></div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line"></div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie"></div>,
  Cell: () => <div data-testid="cell"></div>,
}));

// Mock date utils
vi.mock('~/lib/utils', () => ({
  formatDate: vi.fn().mockImplementation((_date: string) => 'March 15, 2025'),
  formatCurrency: vi.fn().mockImplementation((amount: number) => `$${amount.toFixed(2)}`),
}));

describe('OrderAnalytics', () => {
  // Mock orders for testing
  const mockOrders: Order[] = [
    {
      id: 'order-1',
      orderNumber: 'NO-20250315-ABCD',
      userId: 'user-1',
      email: 'customer1@example.com',
      status: 'completed' as OrderStatus,
      paymentStatus: 'paid' as PaymentStatus,
      shippingCost: 10.0,
      taxAmount: 8.5,
      subtotalAmount: 100.0,
      totalAmount: 118.5,
      items: [
        {
          id: 'item-1',
          orderId: 'order-1',
          productId: 'product-1',
          name: 'Product 1',
          sku: 'P1',
          quantity: 2,
          unitPrice: 50.0,
          totalPrice: 100.0,
          createdAt: '2025-03-15T12:00:00Z',
          updatedAt: '2025-03-15T12:00:00Z',
        },
      ],
      createdAt: '2025-03-15T12:00:00Z',
      updatedAt: '2025-03-15T12:00:00Z',
    },
    {
      id: 'order-2',
      orderNumber: 'NO-20250314-EFGH',
      userId: 'user-2',
      email: 'customer2@example.com',
      status: 'completed' as OrderStatus,
      paymentStatus: 'paid' as PaymentStatus,
      shippingCost: 20.0,
      taxAmount: 16.0,
      subtotalAmount: 200.0,
      totalAmount: 236.0,
      items: [
        {
          id: 'item-2',
          orderId: 'order-2',
          productId: 'product-2',
          name: 'Product 2',
          sku: 'P2',
          quantity: 1,
          unitPrice: 200.0,
          totalPrice: 200.0,
          createdAt: '2025-03-14T12:00:00Z',
          updatedAt: '2025-03-14T12:00:00Z',
        },
      ],
      createdAt: '2025-03-14T12:00:00Z',
      updatedAt: '2025-03-14T12:00:00Z',
    },
    {
      id: 'order-3',
      orderNumber: 'NO-20250313-IJKL',
      userId: 'user-3',
      email: 'customer3@example.com',
      status: 'processing' as OrderStatus,
      paymentStatus: 'pending' as PaymentStatus,
      shippingCost: 15.0,
      taxAmount: 12.0,
      subtotalAmount: 150.0,
      totalAmount: 177.0,
      items: [
        {
          id: 'item-3',
          orderId: 'order-3',
          productId: 'product-1',
          name: 'Product 1',
          sku: 'P1',
          quantity: 3,
          unitPrice: 50.0,
          totalPrice: 150.0,
          createdAt: '2025-03-13T12:00:00Z',
          updatedAt: '2025-03-13T12:00:00Z',
        },
      ],
      createdAt: '2025-03-13T12:00:00Z',
      updatedAt: '2025-03-13T12:00:00Z',
    },
    {
      id: 'order-4',
      orderNumber: 'NO-20250312-MNOP',
      userId: 'user-4',
      email: 'customer4@example.com',
      status: 'cancelled' as OrderStatus,
      paymentStatus: 'refunded' as PaymentStatus,
      shippingCost: 5.0,
      taxAmount: 3.0,
      subtotalAmount: 50.0,
      totalAmount: 58.0,
      items: [
        {
          id: 'item-4',
          orderId: 'order-4',
          productId: 'product-3',
          name: 'Product 3',
          sku: 'P3',
          quantity: 1,
          unitPrice: 50.0,
          totalPrice: 50.0,
          createdAt: '2025-03-12T12:00:00Z',
          updatedAt: '2025-03-12T12:00:00Z',
        },
      ],
      createdAt: '2025-03-12T12:00:00Z',
      updatedAt: '2025-03-12T12:00:00Z',
    },
  ];

  it('renders the analytics dashboard with correct summary metrics', () => {
    // Arrange
    render(<OrderAnalytics orders={mockOrders} />);

    // Assert
    // Check if summary cards are rendered
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // Total orders count

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$589.50')).toBeInTheDocument(); // Sum of all order totals

    expect(screen.getByText('Average Order Value')).toBeInTheDocument();
    expect(screen.getByText('$147.38')).toBeInTheDocument(); // Total revenue / Total orders

    expect(screen.getByText('Completed Orders')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Count of completed orders
  });

  it('renders charts for data visualization', () => {
    // Arrange
    render(<OrderAnalytics orders={mockOrders} />);

    // Assert - Check if charts are rendered
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('bar').length).toBeGreaterThan(0);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('line').length).toBeGreaterThan(0);

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('pie').length).toBeGreaterThan(0);
  });

  it('shows status distribution section', () => {
    // Arrange
    render(<OrderAnalytics orders={mockOrders} />);

    // Assert
    expect(screen.getByText('Order Status Distribution')).toBeInTheDocument();

    // Check for different statuses
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('displays top products section', () => {
    // Arrange
    render(<OrderAnalytics orders={mockOrders} />);

    // Assert
    expect(screen.getByText('Top Products')).toBeInTheDocument();

    // Check for product names and quantities
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('5 units')).toBeInTheDocument(); // Total quantity for Product 1 (2+3)

    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('1 unit')).toBeInTheDocument();

    expect(screen.getByText('Product 3')).toBeInTheDocument();
    expect(screen.getByText('1 unit')).toBeInTheDocument();
  });

  it('renders revenue over time chart', () => {
    // Arrange
    render(<OrderAnalytics orders={mockOrders} />);

    // Assert
    expect(screen.getByText('Revenue Over Time')).toBeInTheDocument();
  });

  it('handles empty orders array gracefully', () => {
    // Arrange
    render(<OrderAnalytics orders={[]} />);

    // Assert - Should show empty state
    expect(screen.getByText('No order data available')).toBeInTheDocument();
    expect(
      screen.getByText("Once orders start coming in, you'll see analytics here.")
    ).toBeInTheDocument();
  });

  it('allows filtering by date range', () => {
    // Arrange - Mock the current date
    const mockDate = new Date('2025-03-15T12:00:00Z');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

    // Render with date filter props
    render(
      <OrderAnalytics
        orders={mockOrders}
        startDate={new Date('2025-03-14T00:00:00Z')}
        endDate={new Date('2025-03-15T23:59:59Z')}
      />
    );

    // Assert - Should only include orders in the date range
    // Only 2 orders are in the date range (March 14-15)
    expect(screen.getByText('2')).toBeInTheDocument(); // Total orders count
    expect(screen.getByText('$354.50')).toBeInTheDocument(); // Sum of filtered order totals
  });

  it('shows loading state when loading prop is true', () => {
    // Arrange
    render(<OrderAnalytics orders={[]} loading={true} />);

    // Assert
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    expect(screen.queryByText('No order data available')).not.toBeInTheDocument();
  });

  it('updates when orders data changes', () => {
    // Arrange - Render with initial orders
    const { rerender } = render(<OrderAnalytics orders={[mockOrders[0]]} />);

    // Initial assert
    expect(screen.getByText('1')).toBeInTheDocument(); // Total orders count
    expect(screen.getByText('$118.50')).toBeInTheDocument(); // Revenue

    // Act - Update with more orders
    rerender(<OrderAnalytics orders={mockOrders} />);

    // Assert after update
    expect(screen.getByText('4')).toBeInTheDocument(); // Updated total orders count
    expect(screen.getByText('$589.50')).toBeInTheDocument(); // Updated revenue
  });
});
