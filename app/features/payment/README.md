# Payment Integration Module

This module provides a flexible, provider-agnostic approach to processing payments in the Notalock application. It supports multiple payment providers (Square, Stripe) with a consistent interface.

## Architecture

The payment integration follows a provider pattern:

- **Interface**: All payment providers implement the `PaymentProviderInterface`
- **Service**: The `PaymentService` acts as a facade for multiple providers
- **Providers**: Concrete implementations for Square, Stripe, and a mock provider
- **UI Components**: Reusable payment form components for each provider
- **API**: RESTful endpoints for payment operations
- **Webhooks**: Handlers for payment status updates

## Directory Structure

```
payment/
├── components/            # UI components
│   ├── PaymentSelector.tsx
│   └── providers/         # Provider-specific components
│       ├── SquarePaymentForm.tsx
│       └── StripePaymentForm.tsx
├── config/                # Configuration
│   └── paymentConfig.server.ts
├── errors/                # Error handling
│   └── PaymentError.ts
├── providers/             # Provider implementations
│   ├── PaymentProviderInterface.ts
│   ├── SquarePaymentProvider.ts
│   └── StripePaymentProvider.ts
├── receipts/              # Receipt generation
│   └── ReceiptGenerator.ts
├── types/                 # TypeScript type definitions
│   └── index.ts
├── utils/                 # Utility functions
│   └── sdkLoader.ts
├── PaymentService.ts      # Main service facade
├── initializePayment.server.ts # Server initialization
└── README.md
```

## Key Components

### PaymentProviderInterface

Interface that all payment providers must implement, ensuring consistent behavior:

```typescript
interface PaymentProviderInterface {
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

### PaymentService

Service facade that manages different payment providers:

```typescript
class PaymentService {
  // Register providers
  registerProvider(provider: PaymentProviderInterface): void;
  
  // Get providers
  getAvailableProviders(): { id: string; name: string }[];
  getProvider(providerId: string): PaymentProviderInterface | null;
  
  // Set active provider
  setActiveProvider(providerId: string, config?: Record<string, any>): Promise<boolean>;
  setDefaultProvider(providerId: string): void;
  
  // Payment operations
  createPayment(amount: PaymentAmount, options?: PaymentOptions): Promise<...>;
  processPayment(paymentIntentId: string, paymentInfo: PaymentInfo): Promise<PaymentResult>;
  verifyPayment(paymentId: string, providerId?: string): Promise<PaymentResult>;
  cancelPayment(paymentId: string, providerId?: string): Promise<...>;
  refundPayment(paymentId: string, amount?: number, providerId?: string): Promise<...>;
  
  // Client configuration
  getClientConfig(providerId?: string): Record<string, any>;
}
```

## API Endpoints

The module exposes the following API endpoints:

- `POST /api/payment/create-intent`: Create a payment intent
- `POST /api/payment/process`: Process a payment
- `GET /api/payment/verify`: Verify payment status
- `POST /api/payment/refund`: Refund a payment
- `GET /api/payment/receipt`: Generate a payment receipt
- `GET /api/payment/methods`: Get available payment methods

## Webhooks

Webhook handlers for payment providers:

- `/api/webhooks/square`: Square webhook handler
- `/api/webhooks/stripe`: Stripe webhook handler

## Error Handling

The module provides robust error handling with specific error types:

- `PaymentError`: Base class for payment errors
- `PaymentConfigurationError`: Configuration errors
- `PaymentValidationError`: Validation errors
- `PaymentProcessingError`: Processing errors
- `PaymentDeclinedError`: Payment declined errors
- `PaymentAuthorizationError`: Authorization required errors

## Client-Side Integration

The module provides client-side components for payment forms:

- `PaymentSelector`: Component for selecting payment methods
- `SquarePaymentForm`: Square-specific payment form
- `StripePaymentForm`: Stripe-specific payment form

## Receipt Generation

The module includes a receipt generation system:

- `ReceiptGenerator`: Generates HTML and PDF receipts
- Receipt endpoint: `/api/payment/receipt?paymentId=&orderId=`

## Usage Examples

### Server-Side Initialization

```typescript
import { initializePaymentProviders } from '~/features/payment/initializePayment.server';

// In entry.server.tsx
initializePaymentProviders().catch((error) => {
  console.error("Failed to initialize payment providers:", error);
});
```

### Creating a Payment Intent

```typescript
import { getPaymentService } from '~/features/payment/PaymentService';

// Create a payment intent
const paymentService = getPaymentService();
const result = await paymentService.createPayment(
  {
    value: 100.00,
    currency: 'USD',
    items: [
      { name: 'Product 1', price: 50.00, quantity: 2 }
    ]
  },
  {
    orderReference: 'ORD-12345',
    description: 'Order #12345'
  }
);
```

### Processing a Payment

```typescript
// Process a payment
const paymentResult = await paymentService.processPayment(
  paymentIntentId,
  {
    provider: 'square',
    type: 'credit_card',
    paymentMethodId: 'tok_123456',
    billingInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      address: {
        line1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US'
      }
    }
  }
);
```

### Client-Side Integration

```tsx
import { PaymentSelector } from '~/features/payment/components/PaymentSelector';

function CheckoutPage() {
  const [selectedProvider, setSelectedProvider] = useState('square');
  const [selectedType, setSelectedType] = useState('credit_card');
  
  const handlePaymentChange = (type, provider) => {
    setSelectedType(type);
    setSelectedProvider(provider);
  };
  
  const handlePaymentMethodCreated = (paymentMethodId, provider) => {
    // Process payment with the created payment method
  };
  
  return (
    <PaymentSelector
      onPaymentTypeChange={handlePaymentChange}
      onPaymentMethodCreated={handlePaymentMethodCreated}
      clientSecret={clientSecret}
      amount={100.00}
      currency="USD"
      selectedProvider={selectedProvider}
      selectedType={selectedType}
    />
  );
}
```

## Configuration

Configuration is done through environment variables. See `docs/features/payment-integration.env.md` for details.

## Security Considerations

This module is designed with security in mind:

- No card data is ever stored on our servers
- All payment information is tokenized
- PCI DSS compliance is maintained through the provider pattern
- Webhook signatures are verified
- Errors are handled securely

For more details, see `docs/features/payment-security.md`.

## Testing

Use the mock provider for testing:

```typescript
// Set the active provider to 'mock'
const paymentService = getPaymentService();
await paymentService.setActiveProvider('mock');

// Create a test payment
const result = await paymentService.createPayment({
  value: 100.00,
  currency: 'USD'
});

// Process the test payment
const paymentResult = await paymentService.processPayment(
  result.paymentIntentId!,
  {
    provider: 'mock',
    type: 'credit_card',
    paymentMethodId: 'mock_token'
  }
);
```

## Extending with New Providers

To add a new payment provider:

1. Create a new class implementing `PaymentProviderInterface`
2. Register the provider with `PaymentService`
3. Add UI components for the provider
4. Configure environment variables
