import { render, screen, fireEvent, within } from '@testing-library/react';
import { OrderDetail } from '../OrderDetail';
import { type Order, OrderStatus, OrderStatusHistory, PaymentStatus } from '../../../types';
import { vi, beforeAll } from 'vitest';

// Mock scrollIntoView which is missing from JSDOM
beforeAll(() => {
  // Add scrollIntoView mock to the Element prototype if it doesn't exist
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  }
});

// Mock cva from class-variance-authority
vi.mock('class-variance-authority', () => ({
  cva: () => {
    // Return a function that returns className string when called
    const fn = () => 'mock-cva-class';
    // Add a variants property to the function
    fn.variants = { variant: {} };
    // Add a defaultVariants to the function
    fn.defaultVariants = { variant: 'default' };
    return fn;
  },
}));

// Mock UI components
vi.mock('~/components/ui/badge', () => ({
  Badge: ({ className, children }: any) => <div className={className}>{children}</div>,
  badgeVariants: () => 'mock-badge-variants-class',
}));

vi.mock('~/components/ui/label', () => ({
  Label: ({ htmlFor, children }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock('~/components/ui/textarea', () => ({
  Textarea: ({ id, className, value, onChange, placeholder }: any) => (
    <textarea
      id={id}
      className={className}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  ),
}));

vi.mock('~/components/ui/card', () => ({
  Card: ({ className, children }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ className, children }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ className, children }: any) => <div className={className}>{children}</div>,
  CardContent: ({ className, children }: any) => <div className={className}>{children}</div>,
  CardDescription: ({ className, children }: any) => <div className={className}>{children}</div>,
}));

vi.mock('~/components/ui/button', () => ({
  Button: ({ className, children, variant, onClick, asChild }: any) => {
    // If asChild is true, return the children directly
    if (asChild) {
      return children;
    }
    return (
      <button className={`${className} ${variant || ''}`} onClick={onClick}>
        {children}
      </button>
    );
  },
}));

vi.mock('~/components/ui/select', () => ({
  Select: ({
    children,
    onValueChange,
    defaultValue,
    'aria-labelledby': ariaLabelledBy,
    id,
  }: any) => {
    // Create a custom handler that can be called from tests
    const handleValueChange = (e: any) => {
      if (onValueChange) {
        onValueChange(e.target.dataset.value);
      }
    };

    return (
      <div data-testid="select-mock" className="mock-select">
        <select defaultValue={defaultValue} id={id} aria-labelledby={ariaLabelledBy}>
          {children}
        </select>
        <div className="test-select-options">
          {/* Create buttons for each value that we need in tests */}
          <button data-value="completed" data-testid="option-completed" onClick={handleValueChange}>
            Set Completed
          </button>
          <button data-value="paid" data-testid="option-paid" onClick={handleValueChange}>
            Set Paid
          </button>
        </div>
      </div>
    );
  },
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children, 'aria-labelledby': ariaLabelledBy }: any) => (
    <div aria-labelledby={ariaLabelledBy}>{children}</div>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('~/components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableHead: ({ children, className }: any) => <th className={className}>{children}</th>,
  TableCell: ({ children, className }: any) => <td className={className}>{children}</td>,
}));

vi.mock('~/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button role="tab" data-value={value}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div role="tabpanel" data-value={value}>
      {children}
    </div>
  ),
}));

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

// Mock utils with all required functions
vi.mock('~/lib/utils', () => ({
  formatDate: vi.fn().mockImplementation((_date: string) => 'March 15, 2025'),
  formatCurrency: vi.fn().mockImplementation((amount: number) => `${amount.toFixed(2)}`),
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '), // Simple implementation of cn for className merging
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
        price: 25.0,
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
        price: 50.0,
        imageUrl: '',
        options: [],
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
    ],
    statusHistory: [
      {
        id: 'history-1',
        status: 'pending',
        notes: 'Order created',
        createdAt: '2025-03-15T11:00:00Z',
      } as OrderStatusHistory,
      {
        id: 'history-2',
        status: 'processing',
        notes: 'Payment received',
        createdAt: '2025-03-15T12:00:00Z',
      } as OrderStatusHistory,
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
    // Use a flexible text matcher for the order number heading
    const orderHeading = screen.getByText(content => {
      return content.includes('Order') && content.includes(mockOrder.orderNumber);
    });
    expect(orderHeading).toBeInTheDocument();

    // Look for status badges - use getByRole with name for more specificity
    // First check if there are any badge elements containing these statuses
    const allBadges = screen.getAllByText(/Processing|Pending/);
    expect(allBadges.length).toBeGreaterThan(0);

    // Alternatively, check if the status values exist somewhere in the document
    expect(screen.getAllByText('Processing').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
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

    // Use flexible matcher for email that might include "Email:" prefix
    const emailElement = screen.getByText(content => {
      return content.includes('customer@example.com');
    });
    expect(emailElement).toBeInTheDocument();

    // Use flexible matcher for user ID that might be combined with other text
    const userIdElement = screen.getByText(content => {
      return content.includes('user-123');
    });
    expect(userIdElement).toBeInTheDocument();
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
    expect(screen.getByText('Payment Method')).toBeInTheDocument(); // The actual heading in the component
    expect(screen.getByText('stripe')).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument(); // Status text is included

    // Check transaction details
    expect(screen.getByText('Transaction Details')).toBeInTheDocument();

    // Use more flexible custom text matcher functions
    const paymentIntentText = screen.getByText(content => {
      return content.includes('Payment Intent ID') && content.includes('pi_123456');
    });
    expect(paymentIntentText).toBeInTheDocument();

    const paymentMethodText = screen.getByText(content => {
      return content.includes('Payment Method ID') && content.includes('pm_123456');
    });
    expect(paymentMethodText).toBeInTheDocument();
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
    // Look specifically for the CardTitle with 'Order Items' text
    const orderItemsHeadings = screen.getAllByText('Order Items');
    // The second one should be the CardTitle
    const orderItemsCardTitle = orderItemsHeadings[1];
    expect(orderItemsCardTitle).toBeInTheDocument();

    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    expect(screen.getByText('TP1')).toBeInTheDocument(); // SKU without prefix
    expect(screen.getByText('TP2')).toBeInTheDocument(); // SKU without prefix
    expect(screen.getByText('2')).toBeInTheDocument(); // Quantity
    expect(screen.getByText('1')).toBeInTheDocument(); // Quantity

    // Check prices using more specific selectors
    const priceText = screen.getAllByText('$25.00');
    expect(priceText.length).toBeGreaterThan(0);

    // Rather than checking exact $50.00 values which appear multiple times,
    // just verify we have the expected number of them
    const fiftyDollarText = screen.getAllByText('$50.00');
    expect(fiftyDollarText).toHaveLength(3); // 1 for Product 1 total, 2 for Product 2 (unit and total)
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

  it('shows order history and notes form', () => {
    // Arrange
    render(
      <OrderDetail
        order={mockOrder}
        onStatusChange={mockOnStatusChange}
        onPaymentStatusChange={mockOnPaymentStatusChange}
        onAddNote={mockOnAddNote}
      />
    );

    // Assert - First find the history tab and click it to make the notes section visible
    const historyTab = screen.getByRole('tab', { name: /history/i });
    fireEvent.click(historyTab);

    // Check for the order history heading
    expect(screen.getByText('Order History')).toBeInTheDocument();

    // Check for the order note content
    expect(screen.getByText('Customer requested gift wrapping')).toBeInTheDocument();

    // Check for the note form heading and input
    expect(screen.getByText('Add New Note')).toBeInTheDocument();
    expect(screen.getByLabelText('Add a note')).toBeInTheDocument();
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

    // Assert - Check admin controls for status selects
    // Find the status label and the corresponding select
    const statusLabels = screen.getAllByText(/Status/);
    const orderStatusLabel = statusLabels.find(el => el.textContent === 'Order Status');
    const paymentStatusLabel = statusLabels.find(el => el.textContent === 'Payment Status');

    expect(orderStatusLabel).toBeInTheDocument();
    expect(paymentStatusLabel).toBeInTheDocument();

    // Look for the Select components via their test ID
    const selectElements = screen.getAllByTestId('select-mock');
    expect(selectElements.length).toBeGreaterThanOrEqual(2);

    // The OrderStatusSelector component replaces the Update Status button
    expect(screen.getByTestId('order-status-container')).toBeInTheDocument();
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

    // Act - Find the order status selector container
    const container = screen.getByTestId('order-status-container');
    expect(container).toBeInTheDocument();

    // Now find the button within this specific container
    const completedOption = within(container).getByText('Set Completed');
    fireEvent.click(completedOption);

    // Click option triggers the status change immediately in the test mock

    // Assert
    expect(mockOnStatusChange).toHaveBeenCalledWith('completed', mockOrder.id);
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

    // Act - First find the Update Payment Status button to locate the right section
    const updateButton = screen.getByText('Update Payment Status');
    // Find the container using testId instead of DOM traversal
    const container = screen.getByTestId('payment-status-container'); // Make sure to add this data-testid to your component
    expect(container).toBeInTheDocument();

    // Now find the button within this specific container
    const paidOption = within(container).getByText('Set Paid');
    fireEvent.click(paidOption);

    // Click the update button
    fireEvent.click(updateButton);

    // Assert
    expect(mockOnPaymentStatusChange).toHaveBeenCalledWith('paid', mockOrder.id);
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
    expect(mockOnAddNote).toHaveBeenCalledWith('New test note', mockOrder.id);
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

    // Get the link directly using getByRole
    const anchor = screen.getByRole('link', { name: /print invoice/i });
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute('href', `/api/orders/${mockOrder.id}/invoice?print=true`);
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

    // Find the anchor by its role and text content
    const anchor = screen.getByRole('link', { name: 'Back to Orders' });
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute('href', '/admin/orders');
  });
});
