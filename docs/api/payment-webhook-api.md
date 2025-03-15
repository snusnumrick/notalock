# Payment Webhook API

This document outlines the webhook endpoints for payment status updates from various payment providers.

## Overview

Payment webhooks are used to receive real-time updates from payment providers about payment status changes. These webhooks allow your application to respond to payment events without having to poll the payment provider's API.

## Webhook Endpoints

### Square Webhooks

**Endpoint**: `/api/webhooks/square`

This endpoint receives and processes webhooks from Square.

#### Request

- **Method**: `POST`
- **Headers**:
  - `x-square-hmacsha256-signature`: HMAC signature for validating webhook authenticity

#### Supported Events

- `payment.updated`: Triggered when a payment's status changes
- `payment.created`: Triggered when a new payment is created
- `refund.updated`: Triggered when a refund's status changes
- `refund.created`: Triggered when a new refund is created

#### Security Implementation

Each webhook request is verified by:
1. Extracting the signature from request headers
2. Computing the HMAC-SHA256 signature of the request body using the webhook signature key
3. Comparing the computed signature with the one provided in the request header
4. Rejecting requests with invalid signatures

#### Response

- **Success**: `200 OK` with JSON body `{ "status": "success" }`
- **Authentication Failure**: `401 Unauthorized` with error message
- **Invalid Request**: `400 Bad Request` with error message
- **Server Error**: `500 Internal Server Error` with error message

### Stripe Webhooks

**Endpoint**: `/api/webhooks/stripe`

This endpoint receives and processes webhooks from Stripe.

#### Request

- **Method**: `POST`
- **Headers**:
  - `stripe-signature`: Signature for validating webhook authenticity

#### Supported Events

- `payment_intent.succeeded`: Triggered when a payment intent succeeds
- `payment_intent.payment_failed`: Triggered when a payment intent fails
- `charge.refunded`: Triggered when a charge is refunded

#### Security Implementation

Each webhook request is verified by:
1. Extracting the signature from request headers
2. Using Stripe's verification method to validate the signature
3. Constructing the event object from the payload and signature
4. Rejecting requests with invalid signatures

#### Response

- **Success**: `200 OK` with JSON body `{ "status": "success" }`
- **Authentication Failure**: `401 Unauthorized` with error message
- **Invalid Request**: `400 Bad Request` with error message
- **Server Error**: `500 Internal Server Error` with error message

## Webhook Processing Flow

1. Receive webhook event from payment provider
2. Verify webhook signature
3. Parse event data
4. Handle event based on event type:
   - For payment success: Update order status to "paid"
   - For payment failure: Update order status to "payment_failed"
   - For refunds: Create refund record and update order
5. Return appropriate response to payment provider

## Testing Webhooks

### Square Webhook Testing

1. Use Square Developer Dashboard to send test webhooks
2. Use a tool like ngrok to expose your local development server to the internet
3. Configure Square to send webhooks to your ngrok URL
4. Verify webhooks are received and processed correctly

### Stripe Webhook Testing

1. Use Stripe CLI for local webhook testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
2. Use Stripe Developer Dashboard to send test webhooks
3. Verify webhooks are received and processed correctly

## Implementation Example

```typescript
// Square webhook handler example
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }
  
  // Extract signature
  const signature = request.headers.get('x-square-hmacsha256-signature');
  if (!signature) {
    return json({ error: 'Missing signature' }, { status: 401 });
  }
  
  // Get request body
  const payload = await request.text();
  
  try {
    // Verify signature
    const isValid = verifySquareSignature(payload, signature);
    if (!isValid) {
      return json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Parse event
    const event = JSON.parse(payload);
    
    // Handle event based on type
    if (event.type === 'payment.updated') {
      await handlePaymentUpdate(event.data.object);
    }
    
    return json({ status: 'success' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Security Considerations

- **Signature Verification**: Always verify webhook signatures to ensure authenticity
- **HTTPS**: Always use HTTPS for webhook endpoints
- **Request Validation**: Validate the structure and content of webhook payloads
- **Idempotency**: Handle webhook events idempotently to prevent duplicate processing
- **Logging**: Log webhook events for audit and troubleshooting purposes
- **Rate Limiting**: Implement rate limiting to prevent abuse

## Related Documentation

- [Square Webhooks Documentation](https://developer.squareup.com/docs/webhooks/overview)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Payment API](./payment-api.md)
