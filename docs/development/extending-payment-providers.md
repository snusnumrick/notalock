# Extending Payment Providers

This guide explains how to extend the Notalock payment system with new payment providers.

## Overview

The Notalock payment system is designed with a provider-based architecture that makes it easy to add new payment processors. All payment providers implement a common interface, allowing the system to work with different providers in a consistent way.

## Architecture

The payment system follows a provider pattern:

```
┌─────────────────┐      ┌────────────────────┐
│  PaymentService │─────▶│PaymentProviderInterface│
└─────────────────┘      └────────────────────┘
                               ▲        ▲
                               │        │
                 ┌─────────────┘        └────────────┐
                 │                                   │
        ┌────────────────┐               ┌─────────────────┐
        │SquareProvider  │               │StripeProvider   │
        └────────────────┘               └─────────────────┘
```

1. The `PaymentService` acts as a facade for all payment operations
2. Each payment provider implements the `PaymentProviderInterface`
3. Provider implementations handle provider-specific details
4. The service selects the appropriate provider at runtime

## Step 1: Create a Provider Implementation

To add a new payment provider, start by creating a new class that implements the `PaymentProviderInterface`:

```typescript
// app/features/payment/providers/NewPaymentProvider.ts
import type { 
  PaymentAmount, 
  PaymentInfo, 
  PaymentOptions, 
  PaymentResult 
} from '../types';
import type { PaymentProviderInterface } from './PaymentProviderInterface';

/**
 * New payment provider implementation
 */
export class NewPaymentProvider implements PaymentProviderInterface {
  readonly provider = 'new_provider';  // Unique identifier for this provider
  readonly displayName = 'New Payment Provider';  // User-friendly name
  
  // Provider-specific properties
  private apiKey?: string;
  private otherConfig?: string;
  
  /**
   * Initialize the provider with configuration
   */
  async initialize(config: Record<string, any>): Promise<boolean> {
    // Extract and validate configuration
    this.apiKey = config.apiKey;
    this.otherConfig = config.otherConfig;
    
    // Perform any necessary setup (API client initialization, etc.)
    
    // Return true if initialization was successful
    return true;
  }
  
  /**
   * Create a payment intent/transaction
   */
  async createPayment(
    amount: PaymentAmount,
    options?: PaymentOptions
  ): Promise<{ clientSecret?: string; paymentIntentId?: string; error?: string }> {
    // Implement provider-specific logic for creating a payment intent
    
    return {
      clientSecret: 'provider_specific_client_secret',
      paymentIntentId: 'provider_specific_payment_intent_id',
    };
  }
  
  /**
   * Process a payment with the provided payment information
   */
  async processPayment(
    paymentIntentId: string,
    paymentInfo: PaymentInfo
  ): Promise<PaymentResult> {
    // Implement provider-specific logic for processing a payment
    
    return {
      success: true,
      paymentId: 'provider_specific_payment_id',
      paymentIntentId,
      status: 'completed',
      providerData: {
        provider: this.provider,
        // Other provider-specific data
      },
    };
  }
  
  /**
   * Verify the status of a payment
   */
  async verifyPayment(paymentId: string): Promise<PaymentResult> {
    // Implement provider-specific logic for verifying a payment
    
    return {
      success: true,
      paymentId,
      status: 'completed',
      providerData: {
        provider: this.provider,
        // Other provider-specific data
      },
    };
  }
  
  /**
   * Cancel/void a payment
   */
  async cancelPayment(
    paymentId: string
  ): Promise<{ success: boolean; error?: string }> {
    // Implement provider-specific logic for canceling a payment
    
    return {
      success: true,
    };
  }
  
  /**
   * Refund a payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    // Implement provider-specific logic for refunding a payment
    
    return {
      success: true,
      refundId: 'provider_specific_refund_id',
    };
  }
  
  /**
   * Get client-side configuration for the payment provider
   */
  getClientConfig(): Record<string, any> {
    // Return configuration needed for client-side integration
    return {
      // Provider-specific client configuration
    };
  }
}
```

## Step 2: Create UI Components

Create UI components for the new payment provider:

```typescript
// app/features/payment/components/providers/NewPaymentForm.tsx
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';

interface NewPaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onPaymentMethodCreated: (paymentMethodId: string) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}

export function NewPaymentForm({
  clientSecret,
  amount,
  currency,
  onPaymentMethodCreated,
  onError,
  isProcessing,
}: NewPaymentFormProps) {
  // Implement provider-specific payment form
  
  const handleSubmitPayment = async () => {
    try {
      // Provider-specific payment processing logic
      
      // Call the callback with the payment method ID
      onPaymentMethodCreated('provider_specific_payment_method_id');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'An error occurred');
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Provider-specific form fields */}
        
        <Button 
          type="button" 
          className="w-full mt-4" 
          onClick={handleSubmitPayment}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : `Pay ${currency} ${amount.toFixed(2)}`}
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Step 3: Update Configuration

Add configuration for the new payment provider in the server configuration:

```typescript
// app/features/payment/config/paymentConfig.server.ts

// Add interface for the new provider configuration
export interface NewProviderConfig {
  apiKey: string;
  otherConfig: string;
  // Other provider-specific configuration
}

// Update the PaymentConfig interface
export interface PaymentConfig {
  square: SquareConfig | null;
  stripe: StripeConfig | null;
  newProvider: NewProviderConfig | null;
  defaultProvider: 'square' | 'stripe' | 'new_provider' | 'mock';
}

// Update the loadPaymentConfig function
export function loadPaymentConfig(): PaymentConfig {
  // Existing code...
  
  // Load new provider configuration
  const newProviderConfig: NewProviderConfig | null = process.env.NEW_PROVIDER_API_KEY
    ? {
        apiKey: process.env.NEW_PROVIDER_API_KEY,
        otherConfig: process.env.NEW_PROVIDER_OTHER_CONFIG || '',
        // Other provider-specific configuration
      }
    : null;
  
  // Determine default provider
  let defaultProvider: 'square' | 'stripe' | 'new_provider' | 'mock' = 'mock';
  
  if (process.env.DEFAULT_PAYMENT_PROVIDER) {
    if (process.env.DEFAULT_PAYMENT_PROVIDER === 'square' && squareConfig) {
      defaultProvider = 'square';
    } else if (process.env.DEFAULT_PAYMENT_PROVIDER === 'stripe' && stripeConfig) {
      defaultProvider = 'stripe';
    } else if (process.env.DEFAULT_PAYMENT_PROVIDER === 'new_provider' && newProviderConfig) {
      defaultProvider = 'new_provider';
    }
  } else {
    // Auto-select first available provider
    if (squareConfig) defaultProvider = 'square';
    else if (stripeConfig) defaultProvider = 'stripe';
    else if (newProviderConfig) defaultProvider = 'new_provider';
  }
  
  return {
    square: squareConfig,
    stripe: stripeConfig,
    newProvider: newProviderConfig,
    defaultProvider,
  };
}

// Update the getClientPaymentConfig function
export function getClientPaymentConfig() {
  const config = loadPaymentConfig();
  
  return {
    availableProviders: [
      ...(config.square ? [{ id: 'square', name: 'Square' }] : []),
      ...(config.stripe ? [{ id: 'stripe', name: 'Stripe' }] : []),
      ...(config.newProvider ? [{ id: 'new_provider', name: 'New Provider' }] : []),
      { id: 'mock', name: 'Test Mode' },
    ],
    defaultProvider: config.defaultProvider,
    // Only include public keys, never include secret keys
    square: config.square ? { /* ... */ } : null,
    stripe: config.stripe ? { /* ... */ } : null,
    newProvider: config.newProvider ? {
      // Only public configuration, no secrets
      publicData: 'public_value',
    } : null,
  };
}
```

## Step 4: Register the Provider

Register the new provider in the `PaymentService`:

```typescript
// app/features/payment/PaymentService.ts
import { NewPaymentProvider } from './providers/NewPaymentProvider';

// Inside the PaymentService constructor:
constructor() {
  // Register built-in providers
  this.registerProvider(new SquarePaymentProvider());
  this.registerProvider(new StripePaymentProvider());
  this.registerProvider(new NewPaymentProvider());
  this.registerMockProvider();
}
```

## Step 5: Update the PaymentSelector Component

Update the `PaymentSelector` component to include the new provider:

```typescript
// app/features/payment/components/PaymentSelector.tsx
import { NewPaymentForm } from './providers/NewPaymentForm';

// Inside the PaymentSelector component:
return (
  <div className="space-y-4">
    {/* ... existing code ... */}
    
    <TabsContent value="credit_card">
      {activeProvider === 'square' && providerConfig.applicationId && (
        <SquarePaymentForm
          {/* ... */}
        />
      )}

      {activeProvider === 'stripe' && providerConfig.publishableKey && clientSecret && (
        <StripePaymentForm
          {/* ... */}
        />
      )}
      
      {activeProvider === 'new_provider' && providerConfig.publicData && (
        <NewPaymentForm
          clientSecret={clientSecret || ''}
          amount={amount}
          currency={currency}
          onPaymentMethodCreated={handlePaymentMethodCreated}
          onError={handlePaymentError}
          isProcessing={isProcessing}
        />
      )}

      {activeProvider === 'mock' && (
        {/* ... */}
      )}
    </TabsContent>
    
    {/* ... existing code ... */}
  </div>
);
```

## Step 6: Add Environment Variables

Define the necessary environment variables for the new provider:

```bash
# .env file
NEW_PROVIDER_API_KEY=your_api_key
NEW_PROVIDER_OTHER_CONFIG=other_config_value
```

Document these variables in the environment variables guide:

```markdown
# Environment Variables for New Provider

## New Provider Configuration
- `NEW_PROVIDER_API_KEY` - API key for New Provider
- `NEW_PROVIDER_OTHER_CONFIG` - Other configuration for New Provider
```

## Step 7: Create Webhook Handler (if needed)

If the provider uses webhooks for status updates, create a webhook handler:

```typescript
// app/routes/api/webhooks/new-provider.ts
import { type ActionFunctionArgs, json } from '@remix-run/node';
import { getPaymentService } from '~/features/payment/PaymentService';
import { updateOrderStatusFromPayment } from '~/features/orders/api/actions.server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }
  
  // Get the raw request body
  const payload = await request.text();
  
  try {
    // Parse the webhook payload
    const webhookEvent = JSON.parse(payload);
    
    // Process the webhook event
    if (webhookEvent.type === 'payment.updated') {
      // Handle payment update
    }
    
    // Return success response
    return json({ status: 'success' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export default function NewProviderWebhookRoute() {
  return null;
}
```

## Step 8: Add Tests

Create tests for the new payment provider:

```typescript
// app/features/payment/providers/__tests__/NewPaymentProvider.test.ts
import { NewPaymentProvider } from '../NewPaymentProvider';

describe('NewPaymentProvider', () => {
  let provider: NewPaymentProvider;
  
  beforeEach(() => {
    provider = new NewPaymentProvider();
    // Initialize provider with test configuration
    provider.initialize({
      apiKey: 'test_api_key',
      otherConfig: 'test_other_config',
    });
  });
  
  test('should create a payment intent', async () => {
    const result = await provider.createPayment({
      value: 100,
      currency: 'USD',
    });
    
    expect(result.clientSecret).toBeDefined();
    expect(result.paymentIntentId).toBeDefined();
    expect(result.error).toBeUndefined();
  });
  
  // Add more tests for other methods
});
```

## Step 9: Update Documentation

Update the payment documentation to include the new provider:

```markdown
# Payment Providers

The system supports the following payment providers:

- **Square**: For processing payments with Square
- **Stripe**: For processing payments with Stripe
- **New Provider**: For processing payments with New Provider
- **Mock**: For testing without real payments
```

## Best Practices

1. **Error Handling**: Implement robust error handling in your provider
2. **Security**: Never log sensitive payment information
3. **Testing**: Create comprehensive tests for your provider
4. **Documentation**: Document provider-specific behavior and configuration
5. **Client Integration**: Provide clear examples for client-side integration

## Common Challenges

1. **API Differences**: Payment providers have different APIs and concepts
2. **Authentication**: Each provider has different authentication requirements
3. **Webhook Formats**: Webhook payloads and verification methods vary
4. **Error Mapping**: Map provider-specific errors to standard error codes
5. **Feature Parity**: Ensure all required features are supported

## Conclusion

By following this guide, you can extend the Notalock payment system to support new payment providers. The provider-based architecture makes it easy to add, remove, or switch between payment providers without affecting the rest of the application.

## Related Documentation

- [Payment Integration](../features/payment-integration.md) - Payment gateway integration
- [Payment API Documentation](../api/payment-api.md) - Payment API endpoints and usage
- [Payment Webhook API](../api/payment-webhook-api.md) - Payment webhook handlers
- [Payment Security](../features/payment-security.md) - Payment security and PCI compliance
