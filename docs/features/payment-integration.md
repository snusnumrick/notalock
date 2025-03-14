# Payment Integration

## Overview

The Notalock payment integration system provides a flexible, provider-agnostic approach to processing payments. The implementation uses a provider interface pattern that allows easy switching between different payment providers like Square and Stripe.

## Key Features

- Abstracted payment provider interface
- Multiple provider implementations (Square, Stripe)
- Mock provider for testing
- Consistent API across all providers
- Easy configuration
- Client-side components for payment form collection

## Technical Implementation

### Provider Interface Pattern

The payment system is built around a core `PaymentProviderInterface` that all payment providers must implement:

```typescript
export interface PaymentProviderInterface {
  readonly provider: string;
  readonly displayName: string;
  
  initialize(config: Record<string, any>): Promise<boolean>;
  createPayment(amount: PaymentAmount, options?: PaymentOptions): Promise<...>;
  processPayment(paymentIntentId: string, paymentInfo: PaymentInfo): Promise<PaymentResult>;
  verifyPayment(paymentId: string): Promise<PaymentResult>;
  cancelPayment(paymentId: string): Promise<{ success: boolean; error?: string }>;
  refundPayment(paymentId: string, amount?: number): Promise<...>;
  getClientConfig(): Record<string, any>;
}
```

This interface ensures all providers implement the same core functionality while allowing provider-specific details to be encapsulated within each implementation.

### Directory Structure

```
app/features/payment/
├── types/               # Payment-related type definitions
├── providers/           # Payment provider implementations
│   ├── PaymentProviderInterface.ts
│   ├── SquarePaymentProvider.ts
│   └── StripePaymentProvider.ts
├── components/          # Payment UI components
│   └── PaymentSelector.tsx
├── PaymentService.ts    # Facade service for payment operations
└── index.ts            # Public API exports
```

### Provider Implementations

The system includes implementations for:

1. **Square**: Uses Square Web Payments SDK for secure payment processing
2. **Stripe**: Uses Stripe Elements for secure payment collection
3. **Mock**: For testing and development without real payment processing

Each implementation encapsulates provider-specific logic while conforming to the common interface.

### Payment Service

The `PaymentService` acts as a facade for the different payment providers:

```typescript
export class PaymentService {
  private providers: Map<string, PaymentProviderInterface> = new Map();
  private activeProvider: PaymentProviderInterface | null = null;
  private defaultProvider: string = 'mock';
  
  // Methods for managing providers and processing payments
}
```

This service allows for:
- Registering multiple payment providers
- Selecting the active provider
- Processing payments through the selected provider
- Handling provider-specific configuration

## Integration with Checkout Process

The payment system integrates with the checkout process through:

1. The `PaymentSelector` component in the payment step
2. The checkout action handlers that process payment information
3. Order creation that includes payment provider details

### Usage Example

```tsx
// In checkout payment page
import { PaymentSelector } from '~/features/payment/components/PaymentSelector';

// Component usage
<PaymentSelector
  onPaymentTypeChange={handlePaymentChange}
  selectedProvider={selectedPaymentProvider}
  selectedType={selectedPaymentMethod}
  errors={actionData?.errors}
/>

// Processing in action handler
const paymentInfo = {
  type: paymentType,
  provider: paymentProvider,
  cardholderName: formData.get('cardholderName')?.toString(),
  // Other details...
};
```

## Adding a New Payment Provider

To add a new payment provider:

1. Create a new class implementing `PaymentProviderInterface`
2. Register the provider with `PaymentService`
3. Add provider-specific UI components if needed
4. Configure the provider in your application

Example:

```typescript
// 1. Create provider implementation
export class NewPaymentProvider implements PaymentProviderInterface {
  // Implement all required methods
}

// 2. Register with PaymentService
const paymentService = getPaymentService();
paymentService.registerProvider(new NewPaymentProvider());

// 3. Set as active if desired
paymentService.setActiveProvider('new-provider', config);
```

## Testing Payment Providers

The system includes a mock provider for testing without real payment processing:

```typescript
// Use mock provider
const paymentService = getPaymentService();
paymentService.setActiveProvider('mock');

// Process a test payment
const result = await paymentService.processPayment('test-intent', {
  type: 'credit_card',
  provider: 'mock',
  // Other details...
});
```

## Configuration

Payment providers can be configured through environment variables or settings:

```
# .env file example
SQUARE_APP_ID=sandbox-sq0idb-...
SQUARE_LOCATION_ID=LRZHQZDY2BNV0
SQUARE_API_KEY=EAAAEOx0YRNI9H0u...

STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Default provider
DEFAULT_PAYMENT_PROVIDER=square
```

## Future Enhancements

- Add PayPal Express Checkout integration
- Implement saved payment methods for registered users
- Add Apple Pay / Google Pay support
- Implement subscription payment handling
- Add payment analytics and reporting
