# Anonymous Carts

## Overview

The Notalock store allows both anonymous (not logged in) and authenticated users to create and manage shopping carts.

## Implementation Details

The cart system uses a hybrid approach that combines database storage with client-side state management:

1. For **authenticated users**, carts are stored in the Supabase database with RLS policies that allow them to manage their own carts using their auth.uid().

2. For **anonymous users**, we use a cookie-based approach:
   - A unique anonymous ID is generated and stored in a cookie
   - Cart data is stored in the database with this anonymous ID
   - Client-side state in localStorage provides a backup and enables optimistic UI updates
   - This approach ensures persistence across sessions

## How it Works

### Anonymous Users

- When an anonymous user adds items to the cart:
  - A unique anonymous ID is generated and stored in a cookie
  - Cart items are stored in the database using CartServiceRPC
  - Cart items are also stored in localStorage under 'notalock_cart_data'
  - When the page loads, cart items are retrieved from both sources:
    - First, from localStorage for immediate display
    - Then from the server for accuracy and synchronization

### Cart Removal Features

- The cart system implements multiple approaches for item removal:
  - Client-side immediate updates for responsive user experience
  - Server-side RPC functions for database operations
  - Direct database operations as fallbacks
  - Emergency cart clearing endpoint for resilience
  - Event-based synchronization to maintain consistency

### Authenticated Users

- Authenticated users' carts are fully stored in the database
- Standard Supabase queries are used with RLS policies
- The client-side state management still provides optimistic UI updates

## Important Files

- `app/features/cart/api/cartServiceRPC.ts` - Handles cart operations via RPC functions for both authenticated and anonymous users
- `app/features/cart/context/CartContext.tsx` - Main source of truth for cart state in the application
- `app/features/cart/hooks/useCart.ts` - Wrapper hook for CartContext, providing backward compatibility with legacy code
- `app/routes/api.cart.tsx` - Main cart API endpoint
- `app/routes/api.direct-cart-remove.tsx` - Specialized endpoint for reliable item removal
- `app/routes/api.emergency-cart-clear.tsx` - Nuclear option for clearing problematic carts

## Merging Carts During Authentication

When an anonymous user signs in, their local cart items should be transferred to their authenticated user cart. This feature needs to be implemented in the authentication flow.
