# Testing Payment Integration

This guide explains how to test the payment integration in the Notalock platform.

## Overview

The payment system is designed to be testable without making real charges. Both Square and Stripe provide testing environments and test card numbers that you can use to validate the payment flow.

## Environment Setup

Before testing, ensure you have the correct environment variables set up:

```bash
# Use sandbox/test environments
SQUARE_ENVIRONMENT=sandbox
STRIPE_ENVIRONMENT=test

# Use test API keys
SQUARE_ACCESS_TOKEN=your_sandbox_access_token
SQUARE_APP_ID=your_sandbox_app_id
SQUARE_LOCATION_ID=your_sandbox_location_id

STRIPE_SECRET_KEY=your_test_secret_key
STRIPE_PUBLISHABLE_KEY=your_test_publishable_key
```

## Testing with Mock Provider

The simplest way to test the payment flow is to use the built-in mock provider:

1. Set `DEFAULT_PAYMENT_PROVIDER=mock` in your `.env` file
2. Go through the checkout flow on your development server
3. Enter any test card information on the payment page
4. The mock provider will simulate a successful payment

This approach is useful for testing the UI flow without making any API calls to payment providers.

## Testing with Square Sandbox

To test with Square's sandbox environment:

1. Set `DEFAULT_PAYMENT_PROVIDER=square` in your `.env` file
2. Ensure `SQUARE_ENVIRONMENT=sandbox` is set
3. Go through the checkout flow
4. Use one of the following test cards:

| Card Type | Card Number | Expiration | CVV | ZIP |
|-----------|-------------|------------|-----|-----|
| Visa | 4111 1111 1111 1111 | Any future date | Any 3 digits | Any 5 digits |
| Mastercard | 5105 1051 0510 5100 | Any future date | Any 3 digits | Any 5 digits |
| Amex | 3782 822463 10005 | Any future date | Any 4 digits | Any 5 digits |
| Discover | 6011 0000 0000 0004 | Any future date | Any 3 digits | Any 5 digits |
| Diners Club | 3056 9309 0259 04 | Any future date | Any 3 digits | Any 5 digits |
| JCB | 3566 0020 2036 0505 | Any future date | Any 3 digits | Any 5 digits |

### Testing Specific Scenarios in Square

You can test specific scenarios using these card numbers:

| Scenario | Card Number |
|----------|-------------|
| Successful charge | 4111 1111 1111 1111 |
| Declined card (insufficient funds) | 4000 0000 0000 0002 |
| Declined card (card_declined) | 4000 0000 0000 0010 |
| Declined card (incorrect_cvc) | 4000 0000 0000 0101 |
| Declined card (expired_card) | 4000 0000 0000 0069 |
| 3D Secure required | 4000 0000 0000 0341 |

## Testing with Stripe Test Mode

To test with Stripe's test environment:

1. Set `DEFAULT_PAYMENT_PROVIDER=stripe` in your `.env` file
2. Ensure `STRIPE_ENVIRONMENT=test` is set
3. Go through the checkout flow
4. Use one of the following test cards:

| Card Type | Card Number | Expiration | CVV | ZIP |
|-----------|-------------|------------|-----|-----|
| Visa (Success) | 4242 4242 4242 4242 | Any future date | Any 3 digits | Any 5 digits |
| Visa (Decline) | 4000 0000 0000 0002 | Any future date | Any 3 digits | Any 5 digits |
| Mastercard (Success) | 5555 5555 5555 4444 | Any future date | Any 3 digits | Any 5 digits |
| Amex (Success) | 3782 822463 10005 | Any future date | Any 4 digits | Any 5 digits |
| Discover (Success) | 6011 1111 1111 1117 | Any future date | Any 3 digits | Any 5 digits |

### Testing Specific Scenarios in Stripe

You can test specific scenarios using these card numbers:

| Scenario | Card Number |
|----------|-------------|
| 3D Secure authentication required | 4000 0025 0000 3155 |
| 3D Secure authentication fails | 4000 0000 0000 3220 |
| Charge succeeds but disputes can be created | 4000 0000 0000 2230 |
| Card declined (insufficient funds) | 4000 0000 0000 9995 |
| Card declined (incorrect CVC) | 4000 0000 0000 0127 |
| Card declined (expired card) | 4000 0000 0000 0069 |
| Card declined (processing error) | 4000 0000 0000 0119 |

## Testing Webhooks

### Square Webhooks

To test Square webhooks locally:

1. Install ngrok: `npm install -g ngrok`
2. Start your local server: `npm run dev`
3. Start ngrok: `ngrok http 3000`
4. Copy the ngrok HTTPS URL (e.g., `https://1234-abcd.ngrok.io`)
5. In the Square Developer Dashboard, add a webhook subscription:
   - URL: `https://your-ngrok-url/api/webhooks/square`
   - Events: `payment.updated`, `refund.created`, etc.
6. Process a test payment
7. Check your application logs for webhook events

### Stripe Webhooks

To test Stripe webhooks locally:

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to your Stripe account: `stripe login`
3. Start forwarding events to your local server:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```
4. In a separate terminal, trigger test events:
   ```bash
   stripe trigger payment_intent.succeeded
   ```
5. Check your application logs for webhook events

## Automated Testing

### Unit Tests

Unit tests for payment providers use mocked API responses:

```typescript
// Example unit test for SquarePaymentProvider
import { SquarePaymentProvider } from '../providers/SquarePaymentProvider';
import { mockSquareApiClient } from '../__mocks__/square';

jest.mock('square', () => mockSquareApiClient);

describe('SquarePaymentProvider', () => {
  let provider: SquarePaymentProvider;
  
  beforeEach(() => {
    provider = new SquarePaymentProvider();
    provider.initialize({
      accessToken: 'test_token',
      applicationId: 'test_app_id',
      locationId: 'test_location_id',
      environment: 'sandbox',
    });
  });
  
  it('should create a payment intent', async () => {
    const result = await provider.createPayment({
      value: 100,
      currency: 'USD',
    });
    
    expect(result.clientSecret).toBeDefined();
    expect(result.paymentIntentId).toBeDefined();
  });
});
```

### Integration Tests

Integration tests validate the full payment flow:

```typescript
// Example integration test for payment flow
import { test, expect } from '@playwright/test';

test('completes checkout with mock payment provider', async ({ page }) => {
  // Navigate to product page
  await page.goto('/products/example-product');
  
  // Add to cart
  await page.click('button:text("Add to Cart")');
  
  // Go to checkout
  await page.click('a:text("Checkout")');
  
  // Fill shipping information
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'User');
  // ... fill other fields ...
  await page.click('button:text("Continue to Shipping")');
  
  // Select shipping method
  await page.click('input[name="shippingMethod"][value="standard"]');
  await page.click('button:text("Continue to Payment")');
  
  // Fill payment information
  await page.fill('input[name="cardholderName"]', 'Test User');
  await page.fill('input[name="cardNumber"]', '4111 1111 1111 1111');
  await page.fill('input[name="expiryDate"]', '12/25');
  await page.fill('input[name="cvv"]', '123');
  await page.click('button:text("Complete Order")');
  
  // Verify success
  await expect(page.locator('h1:text("Order Confirmed")')).toBeVisible();
});
```

## Testing Different Device Sizes

The payment forms should be tested on different device sizes to ensure responsive design:

1. Desktop (1920x1080)
2. Laptop (1366x768)
3. Tablet (768x1024)
4. Mobile (375x667)

## Common Issues and Solutions

### Issue: Payment form not loading

**Solution**: Check browser console for errors. Ensure the provider's SDK is loaded correctly.

### Issue: Payment fails with authentication error

**Solution**: Check API keys in environment variables. Ensure you're using the correct keys for the environment (sandbox/test vs. production).

### Issue: Webhook not being received

**Solution**: Check ngrok/Stripe CLI logs. Verify webhook URL and signature verification.

### Issue: Payment appears successful but no order created

**Solution**: Check for errors in the order creation process. Verify that the payment intent ID is being passed correctly.

## Performance Testing

Test the payment form's loading and processing times:

1. **Initial Load**: Time to load the payment form
2. **Tokenization**: Time to tokenize a card
3. **Confirmation**: Time to confirm a payment

## Security Testing

Validate the security of your payment implementation:

1. **HTTPS**: Ensure all payment-related requests use HTTPS
2. **CSP**: Verify Content Security Policy allows necessary domains
3. **API Keys**: Confirm no API keys are exposed client-side
4. **Error Messages**: Check that error messages don't reveal sensitive information

## Related Documentation

- [Payment Integration](../features/payment-integration.md) - Payment gateway integration
- [Payment API Documentation](../api/payment-api.md) - Payment API endpoints and usage
- [Payment Security](../features/payment-security.md) - Payment security and PCI compliance
- [Extending Payment Providers](./extending-payment-providers.md) - Guide to adding new payment providers
