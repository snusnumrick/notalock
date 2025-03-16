import { render, screen } from '@testing-library/react';
import { OrdersList } from '../OrdersList';
import { type Order, OrderStatus, PaymentStatus } from '../../../types';
import { vi } from 'vitest';

// Mock the OrderSummary component
vi.mock('../OrderSummary', () => ({
  OrderSummary: ({ order }: any) => (
    <div data-testid="order-summary" data-order-id={order.id}>
      <span>{order.orderNumber}</span>
      <span>{order.status}</span>
    </div>
  ),
}));

describe('OrdersList', () => {
  // Mock orders data for tests
  const mockOrders: Order[] = [
    {
      id: 'order-123',
      orderNumber: 'NO-20250315-ABCD',
      userId: 'user-123',
      email: 'customer@example.com',
      status: 'processing' as OrderStatus,
      paymentStatus: 'pending' as PaymentStatus,
      shippingCost: 10.0,
      taxAmount: 8.5,
      subtotalAmount: 100.0,
      totalAmount: 118.5,
      items: [
        {
          id: 'item-1',
          orderId: 'order-123',
          productId: 'product-1',
          name: 'Test Product 1',
          sku: 'TP1',
          quantity: 2,
          unitPrice: 25.0,
          totalPrice: 50.0,
          createdAt: '2025-03-15T12:00:00Z',
          updatedAt: '2025-03-15T12:00:00Z',
        },
      ],
      createdAt: '2025-03-15T12:00:00Z',
      updatedAt: '2025-03-15T12:00:00Z',
    },
    {
      id: 'order-456',
      orderNumber: 'NO-20250314-EFGH',
      userId: 'user-123',
      email: 'customer@example.com',
      status: 'completed' as OrderStatus,
      paymentStatus: 'paid' as PaymentStatus,
      shippingCost: 20.0,
      taxAmount: 16.0,
      subtotalAmount: 200.0,
      totalAmount: 236.0,
      items: [
        {
          id: 'item-3',
          orderId: 'order-456',
          productId: 'product-3',
          name: 'Test Product 3',
          sku: 'TP3',
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
  ];

  it('renders a list of orders using OrderSummary components', () => {
    // Arrange
    render(<OrdersList orders={mockOrders} />);

    // Assert
    const orderSummaries = screen.getAllByTestId('order-summary');
    expect(orderSummaries).toHaveLength(2);
    expect(orderSummaries[0]).toHaveAttribute('data-order-id', 'order-123');
    expect(orderSummaries[1]).toHaveAttribute('data-order-id', 'order-456');
  });

  it('renders orders in the correct order (newest first)', () => {
    // Arrange
    render(<OrdersList orders={mockOrders} />);

    // Assert
    const orderSummaries = screen.getAllByTestId('order-summary');

    // The most recent order (by createdAt) should appear first
    expect(orderSummaries[0]).toHaveAttribute('data-order-id', 'order-123'); // March 15
    expect(orderSummaries[1]).toHaveAttribute('data-order-id', 'order-456'); // March 14
  });

  it('displays a message when there are no orders', () => {
    // Arrange
    render(<OrdersList orders={[]} />);

    // Assert
    expect(screen.getByText('You have no orders yet.')).toBeInTheDocument();
    expect(screen.getByText('Browse our products to place your first order.')).toBeInTheDocument();
  });

  it('shows a button to browse products when no orders exist', () => {
    // Arrange
    render(<OrdersList orders={[]} />);

    // Assert
    const browseButton = screen.getByText('Browse Products');
    expect(browseButton).toBeInTheDocument();
    // Use proper Testing Library queries
    expect(screen.getByRole('link', { name: 'Browse Products' })).toHaveAttribute(
      'href',
      '/products'
    );
  });

  it('shows a loading state when loading prop is true', () => {
    // Arrange
    render(<OrdersList orders={[]} loading={true} />);

    // Assert
    expect(screen.getByText('Loading your orders...')).toBeInTheDocument();
  });

  it('does not show loading state or empty message when orders exist', () => {
    // Arrange
    render(<OrdersList orders={mockOrders} loading={false} />);

    // Assert
    expect(screen.queryByText('Loading your orders...')).not.toBeInTheDocument();
    expect(screen.queryByText('You have no orders yet.')).not.toBeInTheDocument();
  });

  it('accepts and renders a custom title', () => {
    // Arrange
    render(<OrdersList orders={mockOrders} title="Recent Orders" />);

    // Assert
    expect(screen.getByText('Recent Orders')).toBeInTheDocument();
  });

  it('limits the number of orders displayed when limit prop is provided', () => {
    // Arrange
    render(<OrdersList orders={mockOrders} limit={1} />);

    // Assert
    const orderSummaries = screen.getAllByTestId('order-summary');
    expect(orderSummaries).toHaveLength(1);
    expect(orderSummaries[0]).toHaveAttribute('data-order-id', 'order-123');
  });

  it('shows a "View All Orders" link when there are more orders than the limit', () => {
    // Arrange
    render(<OrdersList orders={mockOrders} limit={1} />);

    // Assert
    const viewAllLink = screen.getByText('View All Orders');
    expect(viewAllLink).toBeInTheDocument();
    // Use proper Testing Library queries
    expect(screen.getByRole('link', { name: 'View All Orders' })).toHaveAttribute(
      'href',
      '/account/orders'
    );
  });

  it('does not show "View All Orders" link when all orders are shown', () => {
    // Arrange
    render(<OrdersList orders={mockOrders} limit={10} />);

    // Assert
    expect(screen.queryByText('View All Orders')).not.toBeInTheDocument();
  });
});
