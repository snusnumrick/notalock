# Checkout Flow

> **Related Documentation**
> - [Checkout Feature Overview](../features/checkout.md) - General feature description and database schema
> - [Checkout API Documentation](../api/checkout-api.md) - API endpoints and service architecture
> - [Checkout Fixes](./checkout-fixes.md) - Recent fixes to the checkout system
> - [Error Handling Guidelines](./error-handling.md) - General error handling patterns
> - [Payment Integration](../features/payment-integration.md) - Payment gateway integration
> - [Payment Security](../features/payment-security.md) - Payment security and PCI compliance

## Overview

The checkout flow in Notalock follows a multi-step process:

1. **Information Step**: Customer enters shipping address (route: `_layout.checkout.information.tsx`)
2. **Shipping Step**: Customer selects a shipping method (route: `_layout.checkout.shipping.tsx`)
3. **Payment Step**: Customer provides payment information (route: `_layout.checkout.payment.tsx`)
4. **Review Step**: Customer reviews their order before placing it (route: `_layout.checkout.review.tsx`)
5. **Confirmation Step**: Order is placed and confirmation is shown (route: `_layout.checkout.confirmation.tsx`)

The main checkout route (`_layout.checkout.tsx`) serves as a router that redirects to the appropriate step based on the checkout session state.

## Key Components

### Route Structure

- **`_layout.checkout.tsx`**: Main checkout router that redirects to the appropriate step
- **`_layout.checkout.information.tsx`**: Information step for collecting shipping address
- **`_layout.checkout.shipping.tsx`**: Shipping step for selecting shipping method
- **`_layout.checkout.payment.tsx`**: Payment step for collecting payment details
- **`_layout.checkout.review.tsx`**: Review step for order confirmation
- **`_layout.checkout.confirmation.tsx`**: Order confirmation page

### Data Management

- **CheckoutService**: Manages checkout sessions and order creation
- **CartService**: Handles cart operations and item management
- **Database Tables**: Uses `checkout_sessions`, `orders`, and `order_items` tables

### UI Components

- **CheckoutSteps**: Navigation component showing progress through checkout
- **AddressForm**: Form for collecting shipping/billing addresses
- **PaymentSelector**: Interface for selecting and processing payments through Square or Stripe
- **SquarePaymentForm**: Square-specific payment form using Square Web Payments SDK
- **StripePaymentForm**: Stripe-specific payment form using Stripe Elements
- **OrderSummary**: Shows cart items and order totals

## Error Handling 

The checkout flow implements robust error handling following our [error handling guidelines](./error-handling.md):

1. **Virtual Sessions**: When database operations fail, the system creates virtual sessions that exist only for the current request but allow the checkout to continue
2. **Graceful Degradation**: Each step can recover from errors in previous steps
3. **Response Errors**: Route actions throw Response objects with appropriate status codes
4. **Error Boundaries**: Each checkout page has an ErrorBoundary component to handle various error types
5. **Timeout Protection**: Loaders have built-in timeouts to prevent hanging
6. **Fallback Redirection**: Routes redirect to appropriate fallback pages when needed
7. **User Feedback**: Clear error messages guide the user on how to proceed

## Special Considerations

### Guest Checkout

Guest checkout is fully supported without requiring user accounts:
- Uses anonymous cart IDs stored in cookies/localStorage
- Requires an email address during the information step
- Creates an order with guest_email field populated

### RLS Policies

Supabase Row-Level Security (RLS) policies control access to checkout data:
- Authenticated users can access their own checkout data
- Anonymous users can access guest checkout data
- Migration `20250307000000_fix_checkout_sessions_policy.sql` adds policies for guest checkout
- Migration `20250307010000_add_checkout_session_indexes.sql` adds indexes and duplicate prevention

### Duplicate Sessions

The system prevents and handles duplicate checkout sessions:
- Only one active session per cart is allowed
- A database trigger marks duplicates as 'migrated'
- A function `fix_duplicate_checkout_sessions()` cleans up existing duplicates

## Troubleshooting

If you encounter checkout flow issues:

1. **Check Session Persistence**: Verify session IDs are consistent between steps
2. **Validate RLS Policies**: Ensure database policies allow the correct operations
3. **Review Server Logs**: Look for detailed error messages with session IDs
4. **Examine Cart Items**: Verify cart items are properly attached to checkout sessions
5. **Check for Duplicates**: Use `SELECT * FROM check_duplicate_checkout_sessions()` to find duplicate sessions

## Recent Fixes (March 2025)

Recent fixes have addressed these issues:

1. **Route Structure Standardization**: Refactored checkout routes for a consistent structure
2. **Information Step Separation**: Created dedicated route for information step (`_layout.checkout.information.tsx`)
3. **Checkout Router Implementation**: Transformed main checkout route into router for step redirection
4. **RLS Policy Improvements**: Added policies for anonymous users to access checkout_sessions
5. **Error Recovery**: Enhanced error handling throughout the checkout flow
6. **Multiple Cart Prevention**: Improved CartService to better handle cart IDs
7. **UI Reliability**: Added robust error boundaries and user feedback
8. **Session Management**: Added database indexes and constraints for checkout sessions

## Testing

When testing the checkout flow:
- Test both authenticated and guest checkouts
- Test error scenarios (e.g., database failures, validation errors)
- Verify the flow works with empty carts (should redirect to cart page)
- Check mobile responsiveness of all checkout pages
- Verify order confirmation emails are sent correctly
- Test navigation between steps (forward and backward)

## Performance Considerations

The checkout flow is optimized for performance:
- Caches cart ID to reduce database queries
- Uses optimized queries to find carts with items
- Implements client-side form validation to reduce server round-trips
- Lazy-loads payment components when needed

## Integration Points

The checkout flow integrates with several other systems:

1. **Authentication**: For identifying logged-in users
2. **Cart System**: For retrieving cart items and totals
3. **Payment Gateway**: For processing payments with Square and Stripe
4. **Inventory**: For verifying stock availability (future enhancement)
5. **Email Service**: For sending order confirmations

## Future Enhancements

Planned improvements for the checkout flow:

1. **Address Validation**: Add address validation and normalization
2. **Tax Calculation**: Integrate with tax calculation service
3. **Saved Addresses**: Allow users to save and reuse addresses
4. **Order Tracking**: Provide order status and tracking information
5. **Abandoned Cart Recovery**: Implement reminders for incomplete checkouts

## Debugging

For advanced debugging of checkout issues:

```javascript
// Enable checkout debug mode in browser console
localStorage.setItem('notalock_checkout_debug', 'true');

// View checkout session details
console.log(window.checkoutSessionData);

// Clear checkout cache (for testing)
localStorage.removeItem('current_cart_id');
localStorage.removeItem('notalock_anonymous_cart');

// Log current checkout step
console.log('Current route path:', window.location.pathname);
console.log('Current checkout step:', document.querySelector('.checkout-step.active')?.textContent);
```

## Related Documentation

- [Checkout Feature Overview](../features/checkout.md) - Complete feature documentation
- [Checkout API Documentation](../api/checkout-api.md) - API endpoints and service architecture
- [Checkout Fixes](./checkout-fixes.md) - Recent fixes and improvements
- [Error Handling Guidelines](./error-handling.md) - Error handling patterns and best practices
- [Cart System](./cart-system.md) - Cart functionality documentation
- [Supabase Integration](./supabase-integration.md) - Supabase database integration
- [Payment Integration](../features/payment-integration.md) - Payment gateway integration
- [Payment API Documentation](../api/payment-api.md) - Payment API endpoints and usage
- [Payment Webhook API](../api/payment-webhook-api.md) - Payment webhook handlers
