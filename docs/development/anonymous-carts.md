# Anonymous Carts

## Overview

The Notalock store allows both anonymous (not logged in) and authenticated users to create and manage shopping carts.

## Implementation Details

Anonymous carts work differently than authenticated carts:

1. For **authenticated users**, carts are stored in the Supabase database with RLS policies that allow them to manage their own carts using their auth.uid().

2. For **anonymous users**, we use a client-side only approach:
   - Cart IDs and cart items are stored in localStorage
   - No attempt is made to create anonymous carts in the database
   - This approach avoids RLS policy issues completely

## How it Works

### Anonymous Users

- When an anonymous user adds items to the cart:
  - Items are stored in localStorage under 'notalock_cart_data'
  - A unique cart ID is generated and stored in localStorage under 'anonymousCartId'
  - When the page loads, cart items are retrieved from localStorage

### Authenticated Users

- Authenticated users' carts are fully stored in the database
- Standard Supabase queries are used with RLS policies

## Important Files

- `app/features/cart/api/cartService.ts` - Handles cart operations for both authenticated and anonymous users
- `app/features/cart/context/CartContext.tsx` - Manages cart state in the React application

## Merging Carts During Authentication

When an anonymous user signs in, their local cart items should be transferred to their authenticated user cart. This feature needs to be implemented in the authentication flow.
