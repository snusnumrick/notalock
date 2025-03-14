# Checkout API

> **Related Documentation**
> - [Checkout Feature Overview](../features/checkout.md) - General feature description and database schema
> - [Checkout Flow Implementation](../development/checkout-flow.md) - Developer implementation details
> - [Checkout Fixes](../development/checkout-fixes.md) - Recent fixes to the checkout system

The Checkout API provides endpoints and services for handling the checkout process in the Notalock platform. It handles the multi-step checkout flow, including information collection, shipping method selection, payment processing, and order creation. The implementation focuses on reliability and robustness, with multiple fallback mechanisms to ensure customers can complete their purchases seamlessly.

## Checkout Flow

The checkout process consists of the following steps:

1. **Information**: Collect shipping address and contact information
2. **Shipping**: Select shipping method
3. **Payment**: Enter payment details
4. **Review**: Review order details before submission
5. **Confirmation**: Display order confirmation

Each step has corresponding API endpoints and validation processes, and the system maintains the state of the checkout session throughout the flow.

## Service Architecture

### Client-Side Components

- **Checkout Steps Component**: Shows progress in the checkout flow
- **Checkout Route Components**: Handle specific checkout steps
- **Address Form Component**: Collection of shipping/billing information
- **Order Summary Component**: Shows cart contents and totals

### Server-Side Components

- **Checkout Service**: Main service handling checkout operations
- **Checkout Session Management**: Tracks the state of checkout process
- **Cart Validation**: Ensures cart has valid items before checkout
- **Address Validation**: Validates shipping and billing addresses
- **Payment Processing**: Handles payment method selection and processing

## Key Features

- **Multi-step Checkout**: Logical progression through checkout steps
- **Session Persistence**: Maintains checkout state across page reloads
- **Cart Validation**: Multiple fallback mechanisms for finding valid carts with items
- **Anonymous Checkout**: Supports guest checkout with cookie-based tracking
- **Error Recovery**: Graceful handling of errors with helpful redirects
- **Responsive Design**: Works across mobile and desktop devices

## Checkout Session Model

The checkout session tracks the state of the checkout process.

| Field             | Type       | Description                                          |
|-------------------|------------|------------------------------------------------------|
| id                | string     | Unique identifier for the checkout session           |
| cartId            | string     | Reference to the shopping cart                       |
| userId            | string     | User ID for authenticated users (null for guests)    |
| guestEmail        | string     | Email for guest checkout (null for authenticated)    |
| currentStep       | string     | Current checkout step                                |
| shippingAddress   | object     | Shipping address information                         |
| billingAddress    | object     | Billing address information                          |
| shippingMethod    | string     | Selected shipping method                             |
| shippingOption    | object     | Details of selected shipping option                  |
| shippingCost      | number     | Cost of shipping                                     |
| paymentMethod     | string     | Selected payment method                              |
| paymentInfo       | object     | Payment details (sensitive info excluded)            |
| subtotal          | number     | Cart subtotal                                        |
| tax               | number     | Tax amount                                           |
| total             | number     | Order total                                          |
| createdAt         | timestamp  | When the checkout session was created                |
| updatedAt         | timestamp  | When the checkout session was last updated           |

## Routes and Loaders

The checkout process is implemented using Remix route loaders and actions.

### Main Checkout Routes

- **`/checkout`**: Information step (shipping address)
- **`/checkout/shipping`**: Shipping method selection
- **`/checkout/payment`**: Payment information
- **`/checkout/review`**: Order review
- **`/checkout/confirmation`**: Order confirmation

### Loader Functions

Loader functions retrieve data for each checkout step.

#### `checkoutInfoLoader`

Loads data for the information step, including cart items and checkout session.

```typescript
export async function checkoutInfoLoader({ request }: LoaderFunctionArgs) {
  // Validate cart has items
  // Get or create checkout session
  // Return checkout session and cart items
}
```

#### `checkoutShippingLoader`

Loads data for the shipping step, including shipping options.

```typescript
export async function checkoutShippingLoader({ request }: LoaderFunctionArgs) {
  // Validate cart has items
  // Get checkout session by session ID
  // Get shipping options
  // Return checkout session and shipping options
}
```

#### `checkoutPaymentLoader`

Loads data for the payment step.

```typescript
export async function checkoutPaymentLoader({ request }: LoaderFunctionArgs) {
  // Validate cart has items
  // Get checkout session by session ID
  // Return checkout session
}
```

#### `checkoutReviewLoader`

Loads data for the review step, including updated cart items.

```typescript
export async function checkoutReviewLoader({ request }: LoaderFunctionArgs) {
  // Validate cart has items
  // Get checkout session by session ID
  // Return checkout session and cart items
}
```

#### `checkoutConfirmationLoader`

Loads data for the confirmation step, including order details.

```typescript
export async function checkoutConfirmationLoader({ request }: LoaderFunctionArgs) {
  // Get order by order ID
  // Return order details
}
```

### Action Functions

Action functions process form submissions for each checkout step.

#### `checkoutInfoAction`

Processes shipping information form submission.

```typescript
export async function checkoutInfoAction({ request }: ActionFunctionArgs) {
  // Validate address form data
  // Update checkout session with shipping address
  // Redirect to shipping step
}
```

#### `checkoutShippingAction`

Processes shipping method selection.

```typescript
export async function checkoutShippingAction({ request }: ActionFunctionArgs) {
  // Get selected shipping method
  // Update checkout session with shipping method
  // Calculate shipping cost, tax, and total
  // Redirect to payment step
}
```

#### `checkoutPaymentAction`

Processes payment information form submission.

```typescript
export async function checkoutPaymentAction({ request }: ActionFunctionArgs) {
  // Validate payment form data
  // Update checkout session with payment information
  // Redirect to review step
}
```

#### `checkoutPlaceOrderAction`

Processes the final order submission.

```typescript
export async function checkoutPlaceOrderAction({ request }: ActionFunctionArgs) {
  // Create order from checkout session
  // Process payment (or dummy processing for testing)
  // Update cart status to completed
  // Redirect to confirmation page
}
```

## Cart Validation Process

The `validateCartForCheckout` function ensures the cart has valid items before proceeding with checkout:

1. First, attempts to get cart items using the cart service
2. If no items are found, tries to get cart by anonymous ID from cookie
3. If still no items, checks any known cart IDs from logs
4. Finally, scans all active carts for any with items
5. If no cart with items is found, redirects to the cart page

This robust validation ensures users never proceed to checkout with an empty cart.

## Error Handling

The checkout process includes comprehensive error handling:

- **Timeout Protection**: Maximum checkout loading time to prevent hanging
- **Row-Level Security Handling**: Multiple approaches to work with database permissions
- **Virtual Sessions**: Fallback to memory-only sessions when database operations fail
- **Graceful Redirects**: Redirects users to appropriate pages when errors occur
- **Detailed Logging**: Extensive logging for troubleshooting

## Cookie and Session Management

The checkout process uses cookies to maintain consistent cart and session state:

- **Anonymous Cart ID**: Stored in `notalock_anonymous_cart` cookie
- **Session Timeout**: 30 minutes of inactivity
- **Cross-Page Consistency**: Same cart ID used throughout checkout
- **Cart Prioritization**: System prioritizes carts with items over empty carts

## Implementation Details

### Cart Loading Strategy

To ensure robust cart retrieval, the system follows this strategy:

1. Try to get cart items through normal cart service
2. If that fails, lookup cart by anonymous ID in cookie
3. Check specific known cart IDs as a fallback
4. Scan recent active carts for any with items
5. Only redirect to cart if all attempts find no items

### Checkout Session Creation

Creating a checkout session follows these steps:

1. Try to use RPC function if available
2. If that fails, try minimal database insert
3. Then update with remaining fields
4. If that fails, create virtual session in memory
5. Use virtual session for current request

### Virtual Sessions

When database operations fail, the system uses virtual sessions:

- Not stored in the database but maintained in memory
- Contain all necessary checkout information
- Enable checkout process to continue despite database issues
- Recreated on page reload from cart data

## Future Enhancements

Planned enhancements to the Checkout API include:

1. **Square Payment Integration**: Full integration with Square payment processing
2. **Address Validation**: Real-time validation of shipping addresses
3. **Tax Calculation Service**: Integration with tax calculation services
4. **Enhanced Guest Checkout**: Improved experience for non-registered users
5. **Performance Optimization**: Faster checkout with improved caching
6. **Analytics Integration**: Detailed checkout flow analytics and abandonment tracking

## Related Documentation

- [Checkout Feature Overview](../features/checkout.md) - Complete feature documentation
- [Checkout Flow Implementation](../development/checkout-flow.md) - Developer implementation details
- [Checkout Fixes](../development/checkout-fixes.md) - Recent fixes and improvements
- [Cart API](./cart-api.md) - API for managing shopping cart functionality
- [Payment API](./payment-api.md) - API for processing payments
- [Shipping API](./shipping-api.md) - API for shipping options and rates
