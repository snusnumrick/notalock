import { render, screen, fireEvent } from '@testing-library/react';
import { OrdersTable } from '../OrdersTable';
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
}));

describe('OrdersTable', () => {
  // Mock orders data for tests
  const mockOrders: Order[] = [
    {
      id: 'order-123',
      orderNumber: 'NO-20250315-ABCD',
      userId: 'user-123',
      email: 'customer1@example.com',
      status: 'pending' as OrderStatus,
      paymentStatus: 'pending' as PaymentStatus,
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
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
      notes: 'Customer requested gift wrapping',
      createdAt: '2025-03-15T12:00:00Z',
      updatedAt: '2025-03-15T12:00:00Z',
    },
    {
      id: 'order-456',
      orderNumber: 'NO-20250315-EFGH',
      userId: 'user-456',
      email: 'customer2@example.com',
      status: 'completed' as OrderStatus,
      paymentStatus: 'paid' as PaymentStatus,
      shippingAddress: {
        firstName: 'Jane',
        lastName: 'Smith',
        address1: '456 Oak Ave',
        city: 'Othertown',
        state: 'NY',
        postalCode: '67890',
        country: 'US',
      },
      shippingMethod: 'Express Shipping',
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
          quantity: 4,
          unitPrice: 50.0,
          totalPrice: 200.0,
          createdAt: '2025-03-15T12:00:00Z',
          updatedAt: '2025-03-15T12:00:00Z',
        },
      ],
      createdAt: '2025-03-14T12:00:00Z',
      updatedAt: '2025-03-15T12:00:00Z',
    },
  ];

  it('renders a table with correct headers', () => {
    // Arrange
    render(<OrdersTable orders={mockOrders} />);

    // Assert
    expect(screen.getByText('Order #')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('displays order information correctly', () => {
    // Arrange
    render(<OrdersTable orders={mockOrders} />);

    // Assert
    expect(screen.getByText('NO-20250315-ABCD')).toBeInTheDocument();
    expect(screen.getByText('NO-20250315-EFGH')).toBeInTheDocument();
    expect(screen.getByText('customer1@example.com')).toBeInTheDocument();
    expect(screen.getByText('customer2@example.com')).toBeInTheDocument();
    expect(screen.getByText('$118.50')).toBeInTheDocument();
    expect(screen.getByText('$236.00')).toBeInTheDocument();
  });

  it('renders status badges with appropriate styling', () => {
    // Arrange
    render(<OrdersTable orders={mockOrders} />);

    // Assert
    const pendingBadge = screen.getByText('Pending');
    expect(pendingBadge).toHaveClass('bg-yellow-100');
    expect(pendingBadge).toHaveClass('text-yellow-800');

    const completedBadge = screen.getByText('Completed');
    expect(completedBadge).toHaveClass('bg-green-500');
    expect(completedBadge).toHaveClass('text-white');

    const pendingPaymentBadge = screen.getByText('Pending', {
      selector: '.bg-yellow-100.text-yellow-800',
    });
    expect(pendingPaymentBadge).toBeInTheDocument();

    const paidBadge = screen.getByText('Paid');
    expect(paidBadge).toHaveClass('bg-green-100');
    expect(paidBadge).toHaveClass('text-green-800');
  });

  it('renders a dropdown for status when onStatusChange is provided', () => {
    // Arrange
    const handleStatusChange = vi.fn();
    render(<OrdersTable orders={mockOrders} onStatusChange={handleStatusChange} />);

    // Assert
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
  });

  it('calls onStatusChange when status is changed', async () => {
    // Arrange
    const handleStatusChange = vi.fn();
    render(<OrdersTable orders={mockOrders} onStatusChange={handleStatusChange} />);

    // Get the first select element
    const selects = screen.getAllByRole('combobox');
    const firstSelect = selects[0];

    // Act
    fireEvent.click(firstSelect);

    // Wait for the select content to be visible
    const completedOption = await screen.findByText('Completed', { selector: '[role="option"]' });
    fireEvent.click(completedOption);

    // Assert
    expect(handleStatusChange).toHaveBeenCalledWith('order-123', 'completed');
  });

  it('includes view and details buttons for each order', () => {
    // Arrange
    render(<OrdersTable orders={mockOrders} />);

    // Assert
    expect(screen.getAllByText('View')).toHaveLength(2);
    expect(screen.getAllByText('Details')).toHaveLength(2);

    // Check links
    const detailsLinks = screen.getAllByRole('link', { name: 'Details' });
    expect(detailsLinks[0]).toHaveAttribute('href', '/admin/orders/order-123');
    expect(detailsLinks[1]).toHaveAttribute('href', '/admin/orders/order-456');
  });

  it('toggles order details when view button is clicked', () => {
    // Arrange
    render(<OrdersTable orders={mockOrders} />);

    // Assert - initially no details are visible
    expect(screen.queryByText('Order Items')).not.toBeInTheDocument();

    // Act - click the first view button
    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);

    // Assert - details are now visible
    expect(screen.getByText('Order Items')).toBeInTheDocument();
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();

    // Act - click the view button again (should now say "Hide")
    const hideButton = screen.getByText('Hide');
    fireEvent.click(hideButton);

    // Assert - details are hidden again
    expect(screen.queryByText('Order Items')).not.toBeInTheDocument();
  });

  it('displays expanded order details correctly', () => {
    // Arrange
    render(<OrdersTable orders={mockOrders} />);

    // Act - click view button to show details
    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);

    // Assert - check for order details
    expect(screen.getByText('Shipping Address')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('Subtotal:')).toBeInTheDocument();
    expect(screen.getByText('$100.00', { selector: 'div > span' })).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Customer requested gift wrapping')).toBeInTheDocument();
  });

  it('shows a loading message when loading prop is true', () => {
    // Arrange
    render(<OrdersTable orders={[]} loading={true} />);

    // Assert
    expect(screen.getByText('Loading orders...')).toBeInTheDocument();
  });

  it('shows a message when no orders are found', () => {
    // Arrange
    render(<OrdersTable orders={[]} />);

    // Assert
    expect(screen.getByText('No orders found.')).toBeInTheDocument();
  });
});
