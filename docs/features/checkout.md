# Checkout Feature

> **Related Documentation**
> - [Checkout Flow Implementation](../development/checkout-flow.md) - Developer implementation details
> - [Checkout API Documentation](../api/checkout-api.md) - API endpoints and service architecture
> - [Checkout Fixes](../development/checkout-fixes.md) - Recent fixes to the checkout system

The Checkout feature enables customers to complete their purchases through a streamlined, multi-step process that handles shipping information, payment processing, and order creation.

## Overview

The checkout process is designed to guide customers smoothly from their shopping cart to order completion with minimal friction. It supports both guest and authenticated user checkouts, handles various payment methods, and provides a consistent experience across devices.

## Key Components

### User Interface Components

- **Checkout Steps Indicator**: Shows progress through the checkout flow
- **Shipping Address Form**: Collects shipping information
- **Shipping Method Selection**: Presents shipping options with costs
- **Payment Information Form**: Securely collects payment details
- **Order Review**: Shows final order details before submission
- **Order Confirmation**: Provides confirmation and order details

### Backend Components

- **Checkout Service**: Orchestrates the checkout process
- **Checkout Session Management**: Maintains the state of checkout
- **Cart Validation**: Ensures valid cart contents before checkout
- **Order Creation Service**: Converts checkout sessions to orders

## Checkout Flow

The checkout process follows these steps:

1. **Cart to Checkout**: Transition from cart to checkout router, which redirects to the information step
2. **Information Step**: Collect shipping address and contact details (route: `_layout.checkout.information.tsx`)
3. **Shipping Step**: Select shipping method and calculate costs (route: `_layout.checkout.shipping.tsx`)
4. **Payment Step**: Enter payment information and billing address (route: `_layout.checkout.payment.tsx`)
5. **Review Step**: Review complete order details before submission (route: `_layout.checkout.review.tsx`)
6. **Order Creation**: Process payment and create the order
7. **Confirmation Step**: Display order confirmation and details (route: `_layout.checkout.confirmation.tsx`)

Each step has its own dedicated route, with the main checkout route (`_layout.checkout.tsx`) serving as a router to direct users to the appropriate step.

## Features and Capabilities

### Multi-step Process

The checkout is divided into logical steps with dedicated routes:

- Clear progression through the checkout flow with consistent route structure
- Ability to navigate back to previous steps using the browser's back button or UI navigation
- Visual indicator of current step and completion status in the CheckoutSteps component
- Data validation at each step with appropriate error handling
- Main checkout route that intelligently redirects to the current step

### Guest Checkout

Allows customers to complete purchases without creating an account:

- Email capture for order tracking
- No authentication required
- Option to create account after purchase

### Persistent Sessions

Maintains checkout state across page reloads and sessions:

- Cookie-based anonymous identification
- Database-stored checkout sessions
- Multiple fallback mechanisms

### Cart Validation

Robust cart validation ensures checkout only proceeds with valid items:

- Checks for valid cart items before proceeding
- Multiple fallback mechanisms for finding carts with items
- Redirects to cart if no valid items are found

### Address Management

Comprehensive address collection and validation:

- Form validation for required fields
- Format validation for postal codes, emails, and phone numbers
- Option to use same address for shipping and billing

### Shipping Methods

Multiple shipping options with dynamic pricing:

- Standard, express, and overnight shipping
- Shipping cost calculation
- Estimated delivery dates

### Payment Processing

Secure payment handling with multiple options:

- Credit card payments (through Square)
- Alternative payment methods (e.g., PayPal)
- Secure storage of payment information

### Order Review

Detailed order review before final submission:

- Line items with quantities and prices
- Shipping and billing addresses
- Payment method information
- Order totals with tax and shipping

### Order Confirmation

Clear order confirmation with all necessary details:

- Order number for reference
- Order summary
- Shipping and billing information
- Estimated delivery date

## Technical Implementation

### Robust Error Handling

The checkout system implements comprehensive error handling:

- Timeout protection to prevent hanging
- Row-level security compatibility
- Virtual sessions when database operations fail
- Graceful redirects to appropriate pages
- Detailed logging for troubleshooting

### Session Management

Checkout sessions track the state of the checkout process:

- Stored in database with unique session ID
- Associated with cart and/or user
- Contains all necessary checkout information
- Updated at each step of the process

### Cart Prioritization

The system prioritizes finding carts with items:

- First checks for carts with the matching anonymous ID
- Then scans recent carts for any with items
- Only creates new carts when necessary

### Database Integration

Checkout data is stored in several database tables:

- `checkout_sessions`: Stores checkout progress and details
- `carts`: Manages cart state and items
- `orders`: Stores completed orders
- `order_items`: Stores items in completed orders

## User Experience Considerations

### Responsive Design

The checkout is fully responsive across devices:

- Mobile-friendly forms
- Appropriate input types for mobile
- Streamlined layout on smaller screens

### Error Messages

Clear, helpful error messages at each step:

- Field-level validation messages
- Summary error messages for each step
- Friendly, non-technical language

### Performance Optimization

Fast, responsive checkout experience:

- Minimal page reloads
- Optimistic UI updates
- Efficient data loading

### Security Measures

Secure handling of sensitive information:

- HTTPS for all checkout pages
- No storage of complete credit card details
- PCI compliance for payment processing

## Database Schema

### Checkout Sessions Table

```sql
CREATE TABLE checkout_sessions (
  id UUID PRIMARY KEY,
  cart_id UUID REFERENCES carts(id),
  user_id UUID REFERENCES auth.users(id),
  guest_email TEXT,
  current_step TEXT NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  shipping_method TEXT,
  shipping_option JSONB,
  shipping_cost NUMERIC(10,2),
  payment_method TEXT,
  payment_info JSONB,
  subtotal NUMERIC(10,2),
  tax NUMERIC(10,2),
  total NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Orders Table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  checkout_session_id UUID REFERENCES checkout_sessions(id),
  cart_id UUID REFERENCES carts(id),
  user_id UUID REFERENCES auth.users(id),
  guest_email TEXT,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  shipping_method TEXT NOT NULL,
  shipping_cost NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  tax NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

## Configuration Options

The checkout feature includes several configuration options:

- Shipping method availability and pricing
- Tax rate configuration
- Payment method availability
- Field validation rules
- Required vs. optional fields

## Related Documentation

- [Checkout Flow Implementation](../development/checkout-flow.md) - Developer implementation details
- [Checkout API Documentation](../api/checkout-api.md) - API endpoints and services
- [Checkout Fixes](../development/checkout-fixes.md) - Recent fixes and improvements
- [Cart Feature Documentation](./cart.md) - Shopping cart functionality
- [Payment Integration Documentation](./payment-integration.md) - Payment provider integration
