# Payment API

The Payment API provides endpoints for processing payments using multiple payment providers (Square, Stripe, etc.). It handles payment initialization, processing, verification, refunds, and related operations.

## Base URL

All endpoints are relative to the base URL: `/api/payment`

## Endpoints

### Create Payment Intent

Initializes a payment intent or transaction.

```
POST /api/payment/create-intent
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| amount | number | The amount to charge |
| currency | string | Currency code (e.g., 'USD', 'EUR') |
| provider | string | Payment provider to use (e.g., 'square', 'stripe') |

#### Response

```json
{
  "success": true,
  "clientSecret": "string",
  "paymentIntentId": "string",
  "provider": "string"
}
```

### Process Payment

Processes a payment with the provided payment information.

```
POST /api/payment/process
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| paymentIntentId | string | The payment intent ID |
| paymentMethodId | string | Payment method ID (if applicable) |
| provider | string | Payment provider used |
| type | string | Payment method type |
| billingInfo | object | Billing information |

#### Response

```json
{
  "success": true,
  "paymentId": "string",
  "status": "completed",
  "error": null
}
```

### Verify Payment

Checks the status of a payment.

```
GET /api/payment/verify/:paymentId
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| paymentId | string | The payment ID to verify |

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| provider | string | (Optional) Payment provider used |

#### Response

```json
{
  "success": true,
  "status": "completed",
  "paymentId": "string",
  "error": null
}
```

### Cancel Payment

Cancels or voids a payment.

```
POST /api/payment/cancel
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| paymentId | string | The payment ID to cancel |
| provider | string | Payment provider used |

#### Response

```json
{
  "success": true,
  "error": null
}
```

### Refund Payment

Issues a refund for a payment.

```
POST /api/payment/refund
```

#### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| paymentId | string | The payment ID to refund |
| amount | number | (Optional) Amount to refund (defaults to full payment) |
| provider | string | Payment provider used |
| reason | string | (Optional) Reason for refund |

#### Response

```json
{
  "success": true,
  "refundId": "string",
  "error": null
}
```

### Get Available Payment Methods

Retrieves available payment methods.

```
GET /api/payment/methods
```

#### Response

```json
{
  "methods": [
    {
      "id": "credit_card",
      "name": "Credit Card",
      "providers": ["square", "stripe"]
    },
    {
      "id": "paypal",
      "name": "PayPal",
      "providers": ["paypal"]
    }
  ]
}
```

## Error Responses

All endpoints return a standard error format in case of failure:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `PAYMENT_FAILED`: Payment processing failed
- `INVALID_PAYMENT_INTENT`: Invalid payment intent ID
- `PROVIDER_ERROR`: Error from payment provider
- `VALIDATION_ERROR`: Invalid request parameters
- `AUTHORIZATION_ERROR`: Missing or invalid authorization

## Authentication

All payment API endpoints require authentication except for the client-side initialization endpoints. Admin-level endpoints require appropriate permissions.

## Related Documentation

- [Payment Integration](../features/payment-integration.md)
- [Checkout Process](../features/checkout.md)
