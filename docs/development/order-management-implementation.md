# Order Management Implementation Guide

This guide provides detailed information for developers working with the Order Management system in Notalock.

## Architecture Overview

The Order Management system follows the service-oriented architecture pattern used throughout Notalock:

1. **Database Layer** - Supabase tables for orders, order_items, and order_status_history
2. **Type Definitions** - TypeScript interfaces and types in `/src/types/orders.ts`
3. **Service Layer** - OrderService class in `/src/services/OrderService.ts`
4. **API Layer** - RESTful endpoints in `/src/app/api/orders/*`
5. **UI Components** - Admin interface in `/src/app/(admin)/orders/*`

## Database Schema

The order management database schema consists of three main tables:

### orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES auth.users(id) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'created',
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  shipping_address JSONB,
  billing_address JSONB,
  metadata JSONB,
  payment_intent_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### order_items

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### order_status_history

```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Type Definitions

The main TypeScript interfaces for orders are defined in `/src/types/orders.ts`:

```typescript
export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  shipping_address?: Address;
  billing_address?: Address;
  metadata?: Record<string, any>;
  payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
}

export type OrderStatus = 
  | 'created' 
  | 'pending' 
  | 'paid' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'canceled'
  | 'payment_failed';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes?: string;
  created_at: string;
}

export interface CreateOrderData {
  customer_id: string;
  shipping_address?: Address;
  billing_address?: Address;
  metadata?: Record<string, any>;
}
```

## Order Service

The `OrderService` class in `/src/services/OrderService.ts` provides the core functionality for the Order Management system:

```typescript
class OrderService {
  /**
   * Creates a new order from cart contents
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    // Create order record
    // Transfer cart items to order items
    // Calculate total amount
    // Record initial status
    // Return order details
  }

  /**
   * Retrieves an order by ID with items and status history
   */
  async getOrder(id: string): Promise<Order> {
    // Fetch order details
    // Include order items
    // Include status history
    // Return complete order
  }

  /**
   * Gets orders for a specific customer
   */
  async getOrdersByCustomer(customerId: string, options?: OrderQueryOptions): Promise<Order[]> {
    // Fetch orders for customer
    // Apply filtering options
    // Return customer orders
  }

  /**
   * Gets all orders with pagination (admin only)
   */
  async getAllOrders(page: number, limit: number, filters?: OrderFilters): Promise<PaginatedResult<Order>> {
    // Fetch paginated orders
    // Apply filters
    // Calculate pagination
    // Return paginated result
  }

  /**
   * Updates an order's status and records in history
   */
  async updateOrderStatus(id: string, status: OrderStatus, notes?: string): Promise<Order> {
    // Update order status
    // Record in status history
    // Return updated order
  }

  /**
   * Process a payment webhook event and update order status
   */
  async processPaymentWebhook(paymentEvent: PaymentEvent): Promise<void> {
    // Extract order ID from payment event
    // Determine appropriate status based on event type
    // Update order status
  }
}

export default new OrderService();
```

## API Endpoints

The Order Management system exposes the following API endpoints:

### GET/POST /api/orders

Located in `/src/app/api/orders/route.ts`:

```typescript
// GET handler
export async function GET(request: Request) {
  // Authenticate user
  // Parse query parameters
  // Call OrderService to get orders
  // Return response
}

// POST handler
export async function POST(request: Request) {
  // Authenticate user
  // Parse request body
  // Validate input
  // Call OrderService to create order
  // Return response
}
```

### GET/PATCH /api/orders/[id]

Located in `/src/app/api/orders/[id]/route.ts`:

```typescript
// GET handler
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Authenticate user
  // Validate access rights
  // Call OrderService to get order
  // Return response
}

// PATCH handler
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  // Authenticate user
  // Validate admin rights
  // Parse request body
  // Call OrderService to update order
  // Return response
}
```

## Payment Webhook Integration

Payment webhooks are processed by the `/src/app/api/webhooks/stripe/route.ts` endpoint, which calls the `OrderService.processPaymentWebhook` method to update order status based on payment events:

```typescript
export async function POST(request: Request) {
  // Verify webhook signature
  // Parse event data
  // Determine event type
  // For payment-related events:
  //   Call OrderService.processPaymentWebhook
  // Return success response
}
```

## Admin UI

The admin interface for order management is implemented in:

### Orders List View

Located in `/src/app/(admin)/orders/page.tsx`:

```typescript
export default function OrdersPage() {
  // Fetch orders with pagination
  // Implement filtering controls
  // Render orders table
  // Handle pagination
}
```

### Order Detail View

Located in `/src/app/(admin)/orders/[id]/page.tsx`:

```typescript
export default function OrderDetailPage({ params }: { params: { id: string } }) {
  // Fetch order details
  // Render order information
  // Render order items
  // Render status history
  // Implement status update form
}
```

## Integration with Checkout

The Order Management system is integrated with the checkout process in `/src/app/checkout/confirmation/page.tsx`:

```typescript
export default function CheckoutConfirmationPage() {
  // Get order ID from query parameter
  // Fetch order details
  // Display order confirmation
  // Show order summary
}
```

And in `/src/app/api/checkout/route.ts`:

```typescript
export async function POST(request: Request) {
  // Process checkout data
  // Create order using OrderService
  // Create payment intent
  // Return checkout session info
}
```

## Working with Orders

### Creating an Order

```typescript
import { OrderService } from '@/services/OrderService';
import { CartService } from '@/services/CartService';

// Get the current user
const user = await getUser();

// Get the current cart
const cart = await CartService.getCart(user.id);

// Create an order from the cart
const order = await OrderService.createOrder({
  customer_id: user.id,
  shipping_address: shippingAddress,
  billing_address: billingAddress,
  metadata: {
    notes: "Please deliver before 5pm"
  }
});

// Order is created with status 'created'
return order;
```

### Updating Order Status

```typescript
import { OrderService } from '@/services/OrderService';

// Update order status
const updatedOrder = await OrderService.updateOrderStatus(
  orderId,
  'shipped',
  'Package shipped via UPS with tracking number 123456789'
);
```

### Retrieving Customer Orders

```typescript
import { OrderService } from '@/services/OrderService';

// Get current user
const user = await getUser();

// Get all orders for the customer
const orders = await OrderService.getOrdersByCustomer(user.id, {
  status: ['paid', 'processing', 'shipped']  // Optional filter
});
```

### Admin Order List with Filtering

```typescript
import { OrderService } from '@/services/OrderService';

// Get orders with pagination and filtering
const paginatedOrders = await OrderService.getAllOrders(
  page,           // Page number
  10,             // Items per page
  {
    status: filterStatus,
    fromDate: filterFromDate,
    toDate: filterToDate
  }
);
```

## Error Handling

The Order Management system follows the project's standard error handling practices:

1. Service methods throw typed errors that include error codes
2. API endpoints catch errors and return appropriate HTTP status codes
3. UI components display user-friendly error messages

Common error scenarios:

- Order not found
- Authorization failures
- Invalid input data
- Database operation failures

For detailed information on error handling, see the [Error Handling Guide](./error-handling.md).

## Testing

The Order Management system includes tests at multiple levels:

1. **Unit Tests** - For testing OrderService methods in isolation
2. **API Tests** - For testing order API endpoints
3. **Integration Tests** - For testing the complete order flow
4. **E2E Tests** - For testing the admin interface

For detailed information on testing, see the [Testing Guide](./testing.md).

## Best Practices

1. Always use the OrderService methods to interact with orders, don't modify the database directly
2. Record notes when updating order status to maintain a clear audit trail
3. Handle payment events asynchronously to avoid blocking the checkout process
4. Use the TypeScript interfaces to ensure type safety when working with order data
5. Implement proper error handling for order operations

## Related Documentation

- [Checkout Flow](./checkout-flow.md)
- [Payment Integration](./extending-payment-providers.md)
- [Testing Payment Integration](./testing-payment-integration.md)
- [Order Management Feature](../features/order-management.md)
- [Orders API Documentation](../api/orders-api.md)
