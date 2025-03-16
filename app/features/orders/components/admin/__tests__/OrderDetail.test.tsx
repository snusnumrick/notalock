import { render, screen, fireEvent, within } from '@testing-library/react';
import { OrderDetail } from '../OrderDetail';
import { type Order, OrderStatus, PaymentStatus } from '../../../types';
import { vi } from 'vitest';

// Mock the remix Link component
vi.mock('@remix-run/react', () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useActionData: vi.fn().mockReturnValue(null),
  useSubmit: vi.fn(),
  Form: ({ children, method, action, onSubmit }: any) => (
    <form method={method} action={action} onSubmit={onSubmit}>
      {children}
    </form>
  ),
}));

// Mock formatDate to ensure consistent tests
vi.mock('~/lib/utils', () => ({
  formatDate: vi.fn().mockImplementation((_date: string) => 'March 15, 2025'),
  formatCurrency: vi.fn().mockImplementation((amount: number) => `$${amount.toFixed(2)}`),
}));

describe('Admin OrderDetail', () => {
  // Mock order data for tests
  const mockOrder: Order = {
    id: 'order-123',
    orderNumber: 'NO-20250315-ABCD',
    userId: 'user-123',
    email: 'customer@example.com',
    status: 'processing' as OrderStatus,
    paymentStatus: 'pending' as PaymentStatus,
    paymentIntentId: 'pi_123456',
    paymentMethodId: 'pm_123456',
    paymentProvider: 'stripe',
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
    billingAddress: {
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
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
    ],
    statusHistory: [
      {
        id: 'history-1',
        orderId: 'order-123',
        status: 'pending',
        notes: 'Order created',
        createdAt: '2025-03-15T11:00:00Z',
      },
      {
        id: 'history-2',
        orderId: 'order-123',
        status: 'processing',
        notes: 'Payment received',
        createdAt: '2025-03-15T12:00:00Z',
      },
    ],
    notes: 'Customer requested gift wrapping',
    createdAt: '2025-03-15T11:00:00Z',
    updatedAt: '2025-03-15T12:00:00Z',
  };

  // Mock functions for component props
  const mockOnStatusChange = vi.fn();
  const mockOnPaymentStatusChange = vi.fn();
  const mockOnAddNote = vi.fn();

  it('renders order details with header information', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Assert - Check header content
    expect(screen.getByText(`Order #${mockOrder.orderNumber}`)).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('displays customer information correctly', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Assert - Check customer section
    expect(screen.getByText('Customer Information')).toBeInTheDocument();
    expect(screen.getByText('customer@example.com')).toBeInTheDocument();
    expect(screen.getByText('User ID: user-123')).toBeInTheDocument();
  });

  it('shows shipping and billing addresses', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Assert - Check addresses
    expect(screen.getByText('Shipping Address')).toBeInTheDocument();
    expect(screen.getByText('Billing Address')).toBeInTheDocument();
    expect(screen.getAllByText('John Doe')).toHaveLength(2); // Both in shipping and billing
    expect(screen.getAllByText('123 Main St')).toHaveLength(2);
    expect(screen.getAllByText('Apt 4B')).toHaveLength(2);
    expect(screen.getAllByText('Anytown, CA 12345')).toHaveLength(2);
  });

  it('displays payment information', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Assert - Check payment info
    expect(screen.getByText('Payment Information')).toBeInTheDocument();
    expect(screen.getByText('Provider:')).toBeInTheDocument();
    expect(screen.getByText('stripe')).toBeInTheDocument();
    expect(screen.getByText('Payment Intent ID:')).toBeInTheDocument();
    expect(screen.getByText('pi_123456')).toBeInTheDocument();
    expect(screen.getByText('Payment Method ID:')).toBeInTheDocument();
    expect(screen.getByText('pm_123456')).toBeInTheDocument();
  });

  it('renders order items table with correct information', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Assert - Check order items
    expect(screen.getByText('Order Items')).toBeInTheDocument();
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    expect(screen.getByText('SKU: TP1')).toBeInTheDocument();
    expect(screen.getByText('SKU: TP2')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Quantity
    expect(screen.getByText('1')).toBeInTheDocument(); // Quantity
    expect(screen.getByText('$25.00')).toBeInTheDocument(); // Unit price
    expect(screen.getByText('$50.00')).toBeInTheDocument(); // Unit price and total price
  });

  it('shows order total summary correctly', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Assert - Check order summary
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('Subtotal:')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('Shipping:')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('Tax:')).toBeInTheDocument();
    expect(screen.getByText('$8.50')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('$118.50')).toBeInTheDocument();
  });

  it('displays status history with timestamps', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Assert - Check status history
    expect(screen.getByText('Status History')).toBeInTheDocument();
    expect(screen.getByText('Order created')).toBeInTheDocument();
    expect(screen.getByText('Payment received')).toBeInTheDocument();
    expect(screen.getAllByText('March 15, 2025').length).toBeGreaterThanOrEqual(2);
  });

  it('shows order notes section', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Assert - Check notes section
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Customer requested gift wrapping')).toBeInTheDocument();
  });

  it('contains status update controls for admins', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Assert - Check admin controls
    expect(screen.getByLabelText('Order Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Payment Status')).toBeInTheDocument();

    // Check if update buttons exist
    expect(screen.getByText('Update Status')).toBeInTheDocument();
    expect(screen.getByText('Update Payment Status')).toBeInTheDocument();
  });

  it('calls onStatusChange when status is updated', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Act - Change order status
    const statusSelect = screen.getByLabelText('Order Status');
    fireEvent.change(statusSelect, { target: { value: 'completed' } });

    const updateButton = screen.getByText('Update Status');
    fireEvent.click(updateButton);

    // Assert
    expect(mockOnStatusChange).toHaveBeenCalledWith('completed', expect.any(Object));
  });

  it('calls onPaymentStatusChange when payment status is updated', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Act - Change payment status
    const paymentStatusSelect = screen.getByLabelText('Payment Status');
    fireEvent.change(paymentStatusSelect, { target: { value: 'paid' } });

    const updateButton = screen.getByText('Update Payment Status');
    fireEvent.click(updateButton);

    // Assert
    expect(mockOnPaymentStatusChange).toHaveBeenCalledWith('paid', expect.any(Object));
  });

  it('calls onAddNote when a new note is added', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Act - Add a note
    const noteInput = screen.getByLabelText('Add a note');
    fireEvent.change(noteInput, { target: { value: 'New test note' } });

    const addButton = screen.getByText('Add Note');
    fireEvent.click(addButton);

    // Assert
    expect(mockOnAddNote).toHaveBeenCalledWith('New test note', expect.any(Object));
  });

  it('provides a link to print invoice', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Assert - Check invoice link
    const printLink = screen.getByText('Print Invoice');
    expect(printLink).toBeInTheDocument();
    expect(within(printLink).getByRole('link')).toHaveAttribute(
      'href',
      `/api/orders/${mockOrder.id}/invoice?print=true`
    );
  });

  it('provides a back button to return to orders list', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Assert - Check back button
    const backButton = screen.getByText('Back to Orders');
    expect(backButton).toBeInTheDocument();
    expect(within(backButton).getByRole('link')).toHaveAttribute('href', '/admin/orders');
  });
});
