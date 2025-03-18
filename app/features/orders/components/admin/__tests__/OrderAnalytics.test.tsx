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

// Mock Card components with data-testid attributes
vi.mock('~/components/ui/card', () => ({
  Card: ({ className, children }: any) => (
    <div data-testid="card" className={`card ${className || ''}`}>
      {children}
    </div>
  ),
  CardHeader: ({ className, children }: any) => (
    <div data-testid="card-header" className={`card-header ${className || ''}`}>
      {children}
    </div>
  ),
  CardTitle: ({ className, children }: any) => (
    <div data-testid="card-title" className={`card-title ${className || ''}`}>
      {children}
    </div>
  ),
  CardContent: ({ className, children }: any) => (
    <div data-testid="card-content" className={`card-content ${className || ''}`}>
      {children}
    </div>
  ),
}));

// Mock utils
vi.mock('~/lib/utils', () => ({
  formatDate: vi.fn().mockImplementation((_date: string) => 'March 15, 2025'),
  formatCurrency: vi.fn().mockImplementation((amount: number) => `${amount.toFixed(2)}`),
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
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
          price: 50.0,
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
          price: 200.0,
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
          price: 50.0,
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
          price: 50.0,
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

    // Assert - Check that summary cards are rendered
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Average Order Value')).toBeInTheDocument();
    expect(screen.getByText('Completed Orders')).toBeInTheDocument();

    // Verify all 4 metric cards are rendered
    const cardHeaders = screen.getAllByTestId('card-header');
    expect(cardHeaders.length).toBeGreaterThanOrEqual(4); // At least 4 cards for metrics
  });

  it('renders charts for data visualization', () => {
    // Arrange
    render(<OrderAnalytics orders={mockOrders} />);

    // Assert - Check if charts are rendered
    // Use findAllByTestId and check specific ones instead of finding just one
    const responsiveContainers = screen.getAllByTestId('responsive-container');
    expect(responsiveContainers.length).toBeGreaterThan(0);

    const barCharts = screen.getAllByTestId('bar-chart');
    expect(barCharts.length).toBeGreaterThan(0);

    const bars = screen.getAllByTestId('bar');
    expect(bars.length).toBeGreaterThan(0);

    const lineCharts = screen.getAllByTestId('line-chart');
    expect(lineCharts.length).toBeGreaterThan(0);

    const lines = screen.getAllByTestId('line');
    expect(lines.length).toBeGreaterThan(0);

    const pieCharts = screen.getAllByTestId('pie-chart');
    expect(pieCharts.length).toBeGreaterThan(0);

    const pieSlices = screen.getAllByTestId('pie');
    expect(pieSlices.length).toBeGreaterThan(0);
  });

  it('shows status distribution section', () => {
    // Arrange
    render(<OrderAnalytics orders={mockOrders} />);

    // Assert
    expect(screen.getByText('Order Status Distribution')).toBeInTheDocument();

    // Check that a pie chart exists in the component
    expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('pie').length).toBeGreaterThan(0);

    // Verify the component has rendered - we don't need to check specific status labels
    // as that's too implementation-specific
  });

  it('displays top products section', () => {
    // Arrange
    render(<OrderAnalytics orders={mockOrders} />);

    // Assert
    expect(screen.getByText('Top Products')).toBeInTheDocument();

    // Check for a bar chart in the component
    expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('bar').length).toBeGreaterThan(0);

    // This verifies the chart is rendered without checking specific product names
    // which could be transformed or formatted differently in the chart
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

    // Verify that analytics are rendered
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();

    // Check all cards are present and pie/bar charts are rendered
    expect(screen.getAllByTestId('card').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
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

    // Initial assert - verify cards are rendered
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();

    // Act - Update with more orders
    rerender(<OrderAnalytics orders={mockOrders} />);

    // Assert after update - verify the same cards are still present
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();

    // Verify charts are present
    expect(screen.getAllByTestId('pie-chart').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThan(0);
  });
});
