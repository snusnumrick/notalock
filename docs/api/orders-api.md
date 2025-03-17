# Orders API

The Orders API provides endpoints for creating, retrieving, and managing orders in the Notalock platform.

## Endpoints

### GET /api/orders

Retrieves a list of orders for the current user or all orders for admin users.

**Authentication Required:** Yes

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `status` (optional): Filter by order status
- `fromDate` (optional): Filter by orders created after this date
- `toDate` (optional): Filter by orders created before this date

**Response:**
```json
{
  "orders": [
    {
      "id": "order_123",
      "status": "pending",
      "created_at": "2023-12-01T12:00:00Z",
      "total_amount": 99.99,
      "currency": "usd",
      "items": [
        {
          "product_id": "prod_123",
          "quantity": 1,
          "price": 99.99
        }
      ]
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 10
  }
}
```

### GET /api/orders/analytics

Retrieves order analytics data for reporting purposes.

**Authentication Required:** Yes (Admin only)

**Query Parameters:**
- `fromDate` (optional): Filter by orders created after this date
- `toDate` (optional): Filter by orders created before this date

**Response:**
```json
{
  "orders": [
    // Array of orders with complete data for analytics
  ],
  "dateFrom": "2023-01-01",
  "dateTo": "2023-12-31"
}
```

### GET /api/orders/:id

Retrieves a specific order by ID.

**Authentication Required:** Yes

**URL Parameters:**
- `id`: Order ID

**Response:**
```json
{
  "id": "order_123",
  "status": "pending",
  "created_at": "2023-12-01T12:00:00Z",
  "updated_at": "2023-12-01T12:00:00Z",
  "total_amount": 99.99,
  "currency": "usd",
  "customer_id": "cust_123",
  "shipping_address": {
    "line1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94105",
    "country": "US"
  },
  "items": [
    {
      "product_id": "prod_123",
      "name": "Premium Subscription",
      "quantity": 1,
      "price": 99.99
    }
  ],
  "status_history": [
    {
      "status": "created",
      "timestamp": "2023-12-01T12:00:00Z"
    },
    {
      "status": "pending",
      "timestamp": "2023-12-01T12:00:01Z"
    }
  ]
}
```

### POST /api/orders

Creates a new order based on the current cart contents.

**Authentication Required:** Yes

**Request Body:**
```json
{
  "shipping_address": {
    "line1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94105",
    "country": "US"
  },
  "billing_address": {
    "line1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94105",
    "country": "US"
  },
  "metadata": {
    "notes": "Please deliver before 5pm"
  }
}
```

**Response:**
```json
{
  "id": "order_123",
  "status": "created",
  "created_at": "2023-12-01T12:00:00Z",
  "total_amount": 99.99,
  "currency": "usd",
  "payment_intent_id": "pi_123456789",
  "payment_link": "https://checkout.stripe.com/pay/cs_test_123"
}
```

### PATCH /api/orders/:id

Updates an order's status or information.

**Authentication Required:** Yes (Admin only)

**URL Parameters:**
- `id`: Order ID

**Request Body:**
```json
{
  "status": "shipped",
  "notes": "Package shipped via UPS with tracking #123456789"
}
```

**Response:**
```json
{
  "id": "order_123",
  "status": "shipped",
  "updated_at": "2023-12-01T15:00:00Z"
}
```

### POST /api/orders/create

Creates a new order from an existing checkout session.

**Authentication Required:** Yes for user-owned checkout sessions, guest checkout allowed

**Request Body:**
```json
{
  "checkoutId": "checkout-123",
  "paymentIntentId": "pi_123456789",
  "paymentMethodId": "pm_123456789",
  "paymentProvider": "stripe"
}
```

**Required Parameters:**
- `checkoutId`: ID of the checkout session

**Optional Parameters:**
- `paymentIntentId`: ID of the payment intent if payment was processed
- `paymentMethodId`: ID of the payment method used
- `paymentProvider`: Name of the payment provider

**Response:**
```json
{
  "success": true,
  "orderId": "order-123",
  "orderNumber": "NO-20250315-ABCD"
}
```

**Error Responses:**
- `400 Bad Request`: Missing checkout ID
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: User does not have permission to access the checkout session
- `404 Not Found`: Checkout session not found
- `500 Internal Server Error`: Order creation failed

## Webhooks

The Orders API integrates with payment provider webhooks to automatically update order status based on payment events.

### Stripe Webhook Integration

The `/api/webhooks/stripe` endpoint processes Stripe payment events and updates order status accordingly:

- `payment_intent.succeeded` → Order status set to "paid"
- `payment_intent.payment_failed` → Order status set to "payment_failed"

## Order Status Flow

Orders typically progress through the following statuses:

1. `created` - Initial order creation
2. `pending` - Payment initiated but not completed
3. `paid` - Payment successfully processed
4. `processing` - Order is being prepared
5. `shipped` - Order has been shipped
6. `delivered` - Order has been delivered
7. `canceled` - Order has been canceled
8. `payment_failed` - Payment processing failed

## Error Responses

The API may return the following error codes:

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - User does not have permission to access the resource
- `404 Not Found` - Order not found
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "error": {
    "code": "order_not_found",
    "message": "The requested order could not be found"
  }
}
```
