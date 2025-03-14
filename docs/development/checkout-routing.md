# Checkout Routing Structure

> **Related Documentation**
> - [Checkout Flow Implementation](./checkout-flow.md) - Complete checkout flow details
> - [Checkout Feature Overview](../features/checkout.md) - General feature description
> - [Code Organization](./code-organization.md) - General code organization guidelines

## Overview

The Notalock checkout system uses a consistent route structure to handle the multi-step checkout process. Each step of the checkout flow has its own dedicated route file, with a main checkout route acting as a router to direct users to the appropriate step.

## Route Files

| Route File | Purpose | URL Path |
|------------|---------|----------|
| `_layout.checkout.tsx` | Main checkout router | `/checkout` |
| `_layout.checkout.information.tsx` | Information step (shipping address) | `/checkout/information` |
| `_layout.checkout.shipping.tsx` | Shipping method selection | `/checkout/shipping` |
| `_layout.checkout.payment.tsx` | Payment information | `/checkout/payment` |
| `_layout.checkout.review.tsx` | Order review | `/checkout/review` |
| `_layout.checkout.confirmation.tsx` | Order confirmation | `/checkout/confirmation` |

## Main Checkout Router

The main checkout route (`_layout.checkout.tsx`) serves as a router that:

1. Examines the URL for a session ID parameter
2. If a session ID is present, loads the checkout session
3. Redirects to the appropriate step based on the session's current step
4. If no session ID or step is found, redirects to the information step

```typescript
// Simplified example of the main checkout router
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session');
  
  if (sessionId) {
    const session = await getCheckoutSession(sessionId);
    if (session) {
      const currentStep = session.currentStep || 'information';
      return redirect(`/checkout/${currentStep}?session=${sessionId}`);
    }
  }
  
  return redirect('/checkout/information');
};
```

## Step Routes

Each step route:

1. Verifies the checkout session exists and is valid
2. Manages loading state and error handling
3. Renders the appropriate UI for that step
4. Processes form submissions specific to that step
5. Redirects to the next step when complete

Example route pattern:

```typescript
// Sample structure of a checkout step route
export const loader = async ({ request }) => {
  // Load checkout session and validate
  // Handle timeouts and errors
  // Return session and step-specific data
};

export const action = async ({ request }) => {
  // Process form submission
  // Update checkout session
  // Redirect to next step
};

export default function CheckoutStepPage() {
  // Render step UI
}

export function ErrorBoundary() {
  // Handle errors gracefully
}
```

## Navigation Between Steps

The checkout flow ensures proper navigation between steps:

1. **Forward Navigation**: Form submissions in each step update the session and redirect to the next step
2. **Backward Navigation**: UI "Back" buttons link to previous steps with the session ID preserved
3. **Direct Access**: The main checkout router ensures users are directed to the appropriate step
4. **Validation**: Each step validates that required previous steps are completed

## URL Structure

The URL patterns for the checkout flow follow these conventions:

- Initial entry: `/checkout`
- First step: `/checkout/information`
- With session: `/checkout/information?session=123`
- Next steps: `/checkout/shipping?session=123`

The session ID is preserved in the URL to maintain state across page navigation.

## Authentication Handling

The checkout system handles both authenticated and guest users:

- **Authenticated Users**: Session is associated with the user ID
- **Guest Users**: Session is associated with an anonymous cart ID
- **Session Preservation**: Both use the same URL pattern with session ID

## Development Guidelines

When working with the checkout routes:

1. Always redirect through the main checkout router when entering the checkout flow
2. Maintain consistent URL patterns across steps
3. All step routes should follow the same pattern for loaders, actions, and error handling
4. Preserve the session ID in URLs for navigation between steps
5. Each step should have its own dedicated ErrorBoundary
6. Use timeouts in loaders to prevent hanging during data fetch issues

## Testing Checkout Routes

When testing the checkout flow:

1. Test each step individually with mock data
2. Test the step sequence with session preservation
3. Test error scenarios and proper fallback behavior
4. Test session timeout recovery
5. Test both authenticated and guest checkout paths
