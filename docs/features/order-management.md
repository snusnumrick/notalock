# Order Management

The Order Management feature in Notalock handles the creation, processing, and tracking of customer orders, providing a complete solution for order lifecycle management.

## Overview

The Order Management system is integrated with the checkout process and payment system to provide a seamless experience for both customers and administrators. The system maintains a detailed record of all orders, their items, and status history.

## Key Components

### Database Schema

The order data is stored in three main tables:

1. **orders** - Main order information including:
   - Order ID
   - Customer ID
   - Order status
   - Total amount
   - Currency
   - Timestamps
   - Shipping information
   - Billing information
   - Payment intent ID
   - Metadata (for additional order information)

2. **order_items** - Line items within an order:
   - Product ID
   - Order ID
   - Quantity
   - Price
   - Product metadata

3. **order_status_history** - Track order status changes:
   - Order ID
   - Status
   - Timestamp
   - Notes (optional)

### Order Creation Process

When a customer completes checkout, the system:

1. Creates a new order record with status "created"
2. Transfers items from the cart to order_items
3. Calculates the final total
4. Initiates the payment process
5. Updates the order status based on payment events

### Order Status Management

Orders progress through various statuses throughout their lifecycle:

1. **created** - Initial order creation
2. **pending** - Payment initiated but not completed
3. **paid** - Payment successfully processed
4. **processing** - Order is being prepared
5. **shipped** - Order has been shipped
6. **delivered** - Order has been delivered
7. **canceled** - Order has been canceled
8. **payment_failed** - Payment processing failed

Each status change is recorded in the order_status_history table, providing a complete audit trail.

### Payment Integration

The Order Management system is tightly integrated with payment providers:

- Payment provider references are associated with orders via the payment_intent_id
- Payment webhooks update order status automatically
- Payment failures trigger appropriate status updates

### Order Retrieval and Display

Customers can:
- View their order history
- Check the status of specific orders
- See detailed information about each order

Administrators can:
- View all orders in the system
- Filter and search orders
- Update order status
- Access detailed order information

## Admin Interface

The admin interface provides the following capabilities:

1. **Order Dashboard** - Overview of recent orders and their statuses at `/admin/orders`
2. **Order List** - Complete list of orders with filtering options
3. **Order Detail** - Detailed view of a specific order with:
   - Customer information
   - Order items
   - Payment details
   - Status history
   - Shipping information
4. **Order Management** - Ability to update order status and add notes

## API Integration

The Order Management system exposes API endpoints for:
- Creating orders
- Retrieving order information
- Updating order status
- Searching and filtering orders

These APIs can be used for integration with external systems or for building custom interfaces.

For detailed API documentation, see [Orders API](../api/orders-api.md).

## Integration with Other Features

### Checkout Integration

The Order Management system is tightly integrated with the [Checkout feature](./checkout.md):

- Orders are created as the final step of the checkout process
- Checkout data is used to populate order information
- Order confirmation is displayed after checkout completion

### Payment Integration

The Order Management system works closely with the [Payment Integration](./payment-integration.md) feature:

- Payment status updates trigger order status changes
- Order IDs are included in payment metadata
- Payment receipts are linked to order records

## Implementation Details

### TypeScript Interfaces

The Order Management system uses the following TypeScript interfaces:

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
```

### OrderService Class

The `OrderService` class provides methods for:

- Creating orders from cart data
- Retrieving orders by ID or customer
- Updating order status
- Processing payment webhooks to update order status

## Future Enhancements

Planned enhancements to the Order Management system include:

1. Advanced filtering and reporting
2. Order cancellation and refund processing
3. Automated email notifications for order status changes
4. Return and exchange processing
5. Integration with inventory management

## Related Documentation

- [Orders API Documentation](../api/orders-api.md)
- [Checkout Feature](./checkout.md)
- [Payment Integration](./payment-integration.md)
