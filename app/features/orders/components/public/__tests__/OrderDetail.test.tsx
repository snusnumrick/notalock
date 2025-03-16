import { render, screen } from '@testing-library/react';
import { OrderDetail } from '../OrderDetail';
import { type Order, OrderStatus, PaymentStatus } from '../../../types';
import { formatDate } from '~/lib/utils';
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
}));

describe('OrderDetail', () => {
  // Mock order data for tests
  const mockOrder: Order = {
    id: 'order-123',
    orderNumber: 'NO-20250315-ABCD',
    userId: 'user-123',
    email: 'customer@example.com',
    status: 'processing' as OrderStatus,
    paymentStatus: 'pending' as PaymentStatus,
    paymentIntentId: 'pi_123456',
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      address2: 'Apt 4B',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'US',
      phone: '555-123-4567',
    },
    shippingMethod: 'Standard Shipping',
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
        options: [
          { name: 'Color', value: 'Blue' },
          { name: 'Size', value: 'Medium' },
        ],
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
        imageUrl: null,
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
    ],
    createdAt: '2025-03-15T12:00:00Z',
    updatedAt: '2025-03-15T12:00:00Z',
  };

  it('renders the order header with order number and date', () => {
    // Arrange
    render(<OrderDetail order={mockOrder} />);

    // Assert
    expect(screen.getByText(`Order #${mockOrder.orderNumber}`)).toBeInTheDocument();
    expect(screen.getByText(/Placed on/)).toBeInTheDocument();
    expect(formatDate).toHaveBeenCalledWith(mockOrder.createdAt);
  });

  it('displays the order status with appropriate styling', () => {
    // Arrange
    render(<OrderDetail order={mockOrder} />);

    // Assert
    const statusBadge = screen.getByText('Processing');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('bg-blue-100');
    expect(statusBadge).toHaveClass('text-blue-800');
  });

  it('renders all order items with correct information', () => {
    // Arrange
    render(<OrderDetail order={mockOrder} />);

    // Assert
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    expect(screen.getByText('SKU: TP1')).toBeInTheDocument();
    expect(screen.getByText('SKU: TP2')).toBeInTheDocument();

    // Check quantities and prices
    expect(screen.getByText('2 × $25.00')).toBeInTheDocument();
    expect(screen.getByText('1 × $50.00')).toBeInTheDocument();
  });

  it('displays product options when available', () => {
    // Arrange
    render(<OrderDetail order={mockOrder} />);

    // Assert
    expect(screen.getByText('Color: Blue, Size: Medium')).toBeInTheDocument();
  });

  it('shows "No image" placeholder when image URL is not available', () => {
    // Arrange
    render(<OrderDetail order={mockOrder} />);

    // Assert
    expect(screen.getByText('No image')).toBeInTheDocument();
  });

  it('renders order summary with correct totals', () => {
    // Arrange
    render(<OrderDetail order={mockOrder} />);

    // Assert
    expect(screen.getByText('$100.00', { selector: ':not(div) > span' })).toBeInTheDocument(); // Subtotal
    expect(screen.getByText('$10.00', { selector: ':not(div) > span' })).toBeInTheDocument(); // Shipping
    expect(screen.getByText('$8.50', { selector: ':not(div) > span' })).toBeInTheDocument(); // Tax
    expect(screen.getByText('$118.50', { selector: ':not(div) > span' })).toBeInTheDocument(); // Total
  });

  it('displays shipping information when available', () => {
    // Arrange
    render(<OrderDetail order={mockOrder} />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Apt 4B')).toBeInTheDocument();
    expect(screen.getByText('Anytown, CA 12345')).toBeInTheDocument();
    expect(screen.getByText('US')).toBeInTheDocument();
    expect(screen.getByText('Phone: 555-123-4567')).toBeInTheDocument();
  });

  it('shows shipping method', () => {
    // Arrange
    render(<OrderDetail order={mockOrder} />);

    // Assert
    expect(screen.getByText('Shipping Method')).toBeInTheDocument();
    expect(screen.getByText('Standard Shipping')).toBeInTheDocument();
  });

  it('displays order information section with complete details', () => {
    // Arrange
    render(<OrderDetail order={mockOrder} />);

    // Assert
    expect(screen.getByText('Order Number')).toBeInTheDocument();
    expect(screen.getByText(mockOrder.orderNumber)).toBeInTheDocument();
    expect(screen.getByText('Order Date')).toBeInTheDocument();
    expect(screen.getByText('Order Status')).toBeInTheDocument();
    expect(screen.getByText('Payment Status')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Payment Reference')).toBeInTheDocument();
    expect(screen.getByText('pi_123456')).toBeInTheDocument();
  });

  it('shows cancel button for orders in pending or processing status', () => {
    // Arrange
    render(<OrderDetail order={mockOrder} />);

    // Assert
    const cancelButton = screen.getByText('Cancel Order');
    expect(cancelButton).toBeInTheDocument();
    // Use proper Testing Library queries
    expect(screen.getByRole('link', { name: 'Cancel Order' })).toHaveAttribute(
      'href',
      `/api/orders/${mockOrder.id}/cancel`
    );
  });

  it('does not show cancel button for completed orders', () => {
    // Arrange
    const completedOrder = {
      ...mockOrder,
      status: 'completed' as OrderStatus,
    };

    render(<OrderDetail order={completedOrder} />);

    // Assert
    expect(screen.queryByText('Cancel Order')).not.toBeInTheDocument();
  });

  it('includes a link to view invoice', () => {
    // Arrange
    render(<OrderDetail order={mockOrder} />);

    // Assert
    const invoiceLink = screen.getByText('View Invoice');
    expect(invoiceLink).toBeInTheDocument();
    // Use proper Testing Library queries
    expect(screen.getByRole('link', { name: 'View Invoice' })).toHaveAttribute(
      'href',
      `/api/orders/${mockOrder.id}/invoice`
    );
  });

  it('includes a link to go back to orders', () => {
    // Arrange
    render(<OrderDetail order={mockOrder} />);

    // Assert
    const backLink = screen.getByText('Back to Orders');
    expect(backLink).toBeInTheDocument();
    // Use proper Testing Library queries
    expect(screen.getByRole('link', { name: 'Back to Orders' })).toHaveAttribute(
      'href',
      '/account/orders'
    );
  });

  it('displays fallback when shipping address is not available', () => {
    // Arrange
    const orderWithoutShipping = {
      ...mockOrder,
      shippingAddress: undefined,
    };

    render(<OrderDetail order={orderWithoutShipping} />);

    // Assert
    expect(screen.getByText('No shipping information available')).toBeInTheDocument();
  });
});
