# Payment Integration Environment Variables

This document outlines the required environment variables for configuring payment providers in the Notalock application.

## Environment Configuration

Add the following variables to your `.env` file for payment integration:

```bash
# Default payment provider
# Options: square, stripe, mock
DEFAULT_PAYMENT_PROVIDER=mock

# Square Configuration
# -------------------
# Square API Access Token (from Developer Dashboard)
SQUARE_ACCESS_TOKEN=your_square_access_token
# Square Application ID
SQUARE_APP_ID=your_square_application_id
# Square Location ID
SQUARE_LOCATION_ID=your_square_location_id
# Square Environment (sandbox or production)
SQUARE_ENVIRONMENT=sandbox
# Square Webhook Signature Key (for verifying webhooks)
SQUARE_WEBHOOK_SIGNATURE_KEY=your_square_webhook_key

# Stripe Configuration
# -------------------
# Stripe Secret API Key
STRIPE_SECRET_KEY=your_stripe_secret_key
# Stripe Publishable API Key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
# Stripe Environment (test or live)
STRIPE_ENVIRONMENT=test
```

## Setting Up Square

1. **Create a Square Developer Account**:
   - Go to [Square Developer Dashboard](https://developer.squareup.com/)
   - Sign up or log in to your account
   - Create a new application

2. **Configure Square Application**:
   - Navigate to your application in the Dashboard
   - Switch between "Sandbox" and "Production" using the toggle
   - Copy the Application ID and Location ID from the Sandbox or Production environment
   - Generate an Access Token for the appropriate environment

3. **Configure Webhooks**:
   - In your Square Developer Dashboard, navigate to your application
   - Go to the "Webhooks" section
   - Add a webhook URL: `https://your-domain.com/api/webhooks/square`
   - Subscribe to the following notification types:
     - `payment.created`
     - `payment.updated`
     - `payment.completed`
     - `refund.created`
     - `refund.updated`
   - Copy the webhook signature key for verifying webhooks

4. **Enable Payment Processing**:
   - Ensure your Square account is set up for payment processing
   - For production, complete the onboarding process in the Square Dashboard

## Setting Up Stripe

1. **Create a Stripe Account**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Sign up or log in to your account

2. **Get API Keys**:
   - In the Stripe Dashboard, navigate to "Developers" > "API keys"
   - Use the "Test" toggle to switch between test and live environments
   - Copy your Publishable key and Secret key
   - Note: Never expose your Secret key in client-side code

3. **Configure Webhooks**:
   - In the Stripe Dashboard, navigate to "Developers" > "Webhooks"
   - Add a new endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Subscribe to the following events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
   - Copy the webhook signing secret

4. **Enable Payment Methods**:
   - In the Stripe Dashboard, go to "Settings" > "Payment methods"
   - Enable the payment methods you want to support (credit cards, etc.)
   - For production, complete the onboarding process with Stripe

## Testing

### Square Test Cards

Use these test cards in the Square sandbox environment:

- **Visa**: `4111 1111 1111 1111`
- **Mastercard**: `5105 1051 0510 5100`
- **American Express**: `3782 822463 10005`
- **Discover**: `6011 0000 0000 0004`
- **JCB**: `3566 0020 2036 0505`

Use any CVV (e.g., `123`) and any future expiration date (e.g., `12/25`).

### Stripe Test Cards

Use these test cards in the Stripe test environment:

- **Visa (Success)**: `4242 4242 4242 4242`
- **Visa (Requires Authentication)**: `4000 0025 0000 3155`
- **Visa (Declined)**: `4000 0000 0000 0002`
- **Mastercard**: `5555 5555 5555 4444`
- **American Express**: `3782 822463 10005`

Use any CVC (e.g., `123`) and any future expiration date (e.g., `12/25`).

## Troubleshooting

### Square

- **API Errors**: Check error logs for specific error codes returned by Square
- **Webhook Issues**: Verify the webhook URL is correctly configured and the signature key is set
- **Sandbox Mode**: Ensure you're using sandbox credentials when testing

### Stripe

- **API Errors**: Review error messages in the Stripe Dashboard under "Developers" > "Logs"
- **Webhook Issues**: Use the webhook tester in the Stripe Dashboard to send test events
- **Payment Method Issues**: Some payment methods may require additional configuration in your Stripe Dashboard

## Production Considerations

Before going to production:

1. **PCI Compliance**: Ensure your implementation follows PCI-DSS guidelines
2. **SSL/TLS**: Ensure your website uses HTTPS
3. **Error Handling**: Implement robust error handling and monitoring
4. **Testing**: Thoroughly test all payment flows before going live
5. **Compliance**: Review and implement necessary legal compliance (terms, privacy policy, etc.)
