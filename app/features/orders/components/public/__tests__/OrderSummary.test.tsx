import { render, screen } from '@testing-library/react';
import { OrderSummary } from '../OrderSummary';
import { type Order, OrderStatus, PaymentStatus } from '../../../types';
import { vi } from 'vitest';

// Mock the remix Link component
vi.mock('@remix-run/react', () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock formatDate to ensure consistent tests
vi.mock('~/lib/utils', () => ({
  formatDate: vi.fn().mockImplementation((_date: string) => 'March 15, 2025'),
  formatCurrency: vi.fn().mockImplementation((amount: number) => `${amount.toFixed(2)}`),
}));

describe('OrderSummary', () => {
  // Mock order data for tests
  const mockOrder: Order = {
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
        imageUrl: 'product1.jpg',
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
      {
        id: 'item-2',
        orderId: 'order-123',
        productId: 'product-2',
        name: 'Test Product 2',
        sku: 'TP2',
        quantity: 1,
        unitPrice: 50.0,
        totalPrice: 50.0,
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
    ],
    createdAt: '2025-03-15T12:00:00Z',
    updatedAt: '2025-03-15T12:00:00Z',
  };

  it('renders the order summary with order number and date', () => {
    // Arrange
    render(<OrderSummary order={mockOrder} />);

    // Assert
    expect(screen.getByText(mockOrder.orderNumber)).toBeInTheDocument();
    expect(screen.getByText('March 15, 2025')).toBeInTheDocument();
  });

  it('displays order status with appropriate styling', () => {
    // Arrange
    render(<OrderSummary order={mockOrder} />);

    // Assert
    const statusBadge = screen.getByText('Processing');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('bg-blue-100');
    expect(statusBadge).toHaveClass('text-blue-800');
  });

  it('shows the correct number of items and total amount', () => {
    // Arrange
    render(<OrderSummary order={mockOrder} />);

    // Assert
    expect(screen.getByText('3 items')).toBeInTheDocument(); // 2 + 1 = 3 items
    expect(screen.getByText('$118.50')).toBeInTheDocument();
  });

  it('provides a link to view the order details', () => {
    // Arrange
    render(<OrderSummary order={mockOrder} />);

    // Assert
    const viewLink = screen.getByText('View Details');
    expect(viewLink).toBeInTheDocument();
    // Use proper Testing Library queries
    expect(screen.getByRole('link', { name: 'View Details' })).toHaveAttribute(
      'href',
      `/account/orders/${mockOrder.id}`
    );
  });

  it('shows at least one product image or placeholder', () => {
    // Arrange
    render(<OrderSummary order={mockOrder} />);

    // Assert
    const image = screen.getByAltText('Product thumbnail');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'product1.jpg');
  });

  it('handles orders with different statuses correctly', () => {
    // Test with different order statuses
    const statuses: OrderStatus[] = ['pending', 'completed', 'cancelled', 'refunded', 'failed'];

    statuses.forEach(status => {
      // Arrange
      const testOrder = { ...mockOrder, status };

      // Act
      const { unmount } = render(<OrderSummary order={testOrder} />);

      // Assert
      const statusText = status.charAt(0).toUpperCase() + status.slice(1);
      expect(screen.getByText(statusText)).toBeInTheDocument();

      // Clean up before next test
      unmount();
    });
  });

  it('does not show tracking information if not available', () => {
    // Arrange
    render(<OrderSummary order={mockOrder} />);

    // Assert
    expect(screen.queryByText('Track Order')).not.toBeInTheDocument();
  });

  it('shows tracking information when available', () => {
    // Arrange
    const orderWithTracking = {
      ...mockOrder,
      metadata: {
        tracking: {
          number: '1Z999AA10123456784',
          carrier: 'UPS',
          url: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
        },
      },
    };

    render(<OrderSummary order={orderWithTracking} />);

    // Assert
    const trackLink = screen.getByText('Track Order');
    expect(trackLink).toBeInTheDocument();
    // Use proper Testing Library queries
    expect(screen.getByRole('link', { name: 'Track Order' })).toHaveAttribute(
      'href',
      'https://www.ups.com/track?tracknum=1Z999AA10123456784'
    );
  });

  it('truncates long product names correctly', () => {
    // Arrange
    const orderWithLongProductName = {
      ...mockOrder,
      items: [
        {
          ...mockOrder.items[0],
          name: 'This is an extremely long product name that should be truncated in the order summary view because it would take up too much space',
        },
      ],
    };

    render(<OrderSummary order={orderWithLongProductName} />);

    // Assert
    // Check that the name is truncated with ellipsis
    const nameElement = screen.getByText(/This is an extremely long product/);
    expect(nameElement).toBeInTheDocument();
    expect(nameElement.textContent?.length).toBeLessThan(
      orderWithLongProductName.items[0].name.length
    );
    expect(nameElement.textContent?.endsWith('...')).toBe(true);
  });
});
