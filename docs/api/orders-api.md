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

### GET /api/orders/:id/status

Retrieves information about an order's status, including allowed status transitions.

**Authentication Required:** Yes (Admin only)

**URL Parameters:**
- `id`: Order ID

**Response:**
```json
{
  "order": {
    "id": "order_123",
    "status": "processing",
    "// other order properties...": ""
  },
  "currentStatus": "processing",
  "allowedTransitions": ["paid", "completed", "cancelled", "failed"]
}
```

**Error Responses:**
- `400 Bad Request`: Missing order ID
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: User does not have admin permissions
- `404 Not Found`: Order not found
- `500 Internal Server Error`: Server error

### PUT /api/orders/:id/status

Updates an order's status. This endpoint enforces status transition validation based on business rules.

**Authentication Required:** Yes (Admin only)

**URL Parameters:**
- `id`: Order ID

**Request Body:**
```json
{
  "status": "completed",
  "notes": "Order completed and delivered"
}
```

**Required Parameters:**
- `status`: New order status (one of: pending, processing, paid, completed, cancelled, refunded, failed)

**Optional Parameters:**
- `notes`: Additional notes about the status change

**Response:**
```json
{
  "id": "order_123",
  "status": "completed",
  "updated_at": "2025-03-15T15:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Missing or invalid status
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: User does not have admin permissions
- `404 Not Found`: Order not found
- `405 Method Not Allowed`: Request method not supported
- `422 Unprocessable Entity`: Invalid status transition with detailed information about allowed transitions
```json
{
  "error": "Invalid status transition: Cannot change from processing to cancelled",
  "currentStatus": "processing",
  "requestedStatus": "cancelled",
  "allowedTransitions": ["paid", "completed", "failed"]
}
```
- `500 Internal Server Error`: Status update failed

### POST /api/orders/:id/update-payment-status

Updates an order's payment status.

**Authentication Required:** Yes (Admin only) or valid payment webhook signature

**URL Parameters:**
- `id`: Order ID

**Request Body:**
```json
{
  "paymentStatus": "paid",
  "notes": "Payment confirmed via bank transfer"
}
```

**Required Parameters:**
- `paymentStatus`: New payment status (one of: pending, paid, failed, refunded)

**Optional Parameters:**
- `notes`: Additional notes about the payment status change

**Response:**
```json
{
  "success": true,
  "message": "Order payment status updated to paid",
  "order": {
    "id": "order_123",
    "status": "paid",
    "paymentStatus": "paid",
    "updated_at": "2025-03-15T15:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing or invalid payment status
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: User does not have admin permissions
- `404 Not Found`: Order not found
- `405 Method Not Allowed`: Request method not supported
- `422 Unprocessable Entity`: Invalid payment status transition
- `500 Internal Server Error`: Payment status update failed

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

1. `pending` - Initial order creation
2. `processing` - Order is being prepared
3. `paid` - Payment successfully processed
4. `completed` - Order has been delivered
5. `cancelled` - Order has been canceled
6. `refunded` - Order has been refunded
7. `failed` - Order processing failed

### Order Status Transition Rules

The following transitions are enforced by the API:

- From `pending`: Can transition to `processing`, `paid`, `cancelled`, or `failed`
- From `processing`: Can transition to `paid`, `completed`, `cancelled`, or `failed`
- From `paid`: Can transition to `processing`, `completed`, or `refunded`
- From `completed`: Can transition only to `refunded`
- From `cancelled`: No further transitions allowed
- From `refunded`: No further transitions allowed
- From `failed`: Can transition to `pending` or `processing`

### Payment Status Transition Rules

- From `pending`: Can transition to `processing`, `paid`, `failed`, or `cancelled`
- From `processing`: Can transition to `paid`, `failed`, or `cancelled`
- From `paid`: Can transition only to `refunded`
- From `failed`: Can transition to `pending` or `processing`
- From `refunded`: No further transitions allowed
- From `cancelled`: Can transition only to `pending`

## Error Responses

The API may return the following error codes:

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - User does not have permission to access the resource
- `404 Not Found` - Order not found
- `405 Method Not Allowed` - Request method not supported 
- `422 Unprocessable Entity` - Valid request but business rules prevent processing (e.g., invalid status transition)
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "error": "Descriptive error message",
  "message": "Additional details if available",
  "// For status transition errors": "",
  "currentStatus": "current order status",
  "requestedStatus": "requested status",
  "allowedTransitions": ["list", "of", "allowed", "transitions"]
}
```

## Client-Side Usage Examples

### Fetching Allowed Status Transitions

Using the Fetch API:

```javascript
// Example: Get allowed status transitions
async function getOrderStatusOptions(orderId) {
  try {
    const response = await fetch(`/api/orders/${orderId}/status`);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const data = await response.json();
    return data.allowedTransitions || [];
  } catch (error) {
    console.error('Error fetching status options:', error);
    return [];
  }
}
```

### Updating Order Status

Using the Fetch API:

```javascript
// Example: Update an order status using fetch
async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: newStatus,
        notes: 'Status updated by admin',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Special handling for status transition errors
      if (response.status === 422) {
        const allowedOptions = errorData.allowedTransitions || [];
        throw new Error(
          `Invalid status transition. You can change from ${errorData.currentStatus} to: ${allowedOptions.join(', ')}`
        );
      }
      
      throw new Error(errorData.error || `Failed to update: ${response.status}`);
    }

    const data = await response.json();
    console.log('Status updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}
```

### Updating Payment Status

Using the Fetch API:

```javascript
// Example: Update payment status using fetch
async function updatePaymentStatus(orderId, newPaymentStatus) {
  try {
    const response = await fetch(`/api/orders/${orderId}/update-payment-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentStatus: newPaymentStatus,
        notes: 'Payment status updated by admin',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update: ${response.status}`);
    }

    const data = await response.json();
    console.log('Payment status updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}
```