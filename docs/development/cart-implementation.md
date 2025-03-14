# Cart Implementation

## Architecture Overview

The Notalock cart system has been refactored to use a simplified architecture with a single source of truth. This document outlines the current implementation and best practices.

## Key Components

### CartContext (Single Source of Truth)

`app/features/cart/context/CartContext.tsx` serves as the central source of truth for cart state in the application. It:

- Initializes cart data from server or localStorage
- Manages cart state updates
- Handles cart operations (add, update, remove, clear)
- Synchronizes cart state between localStorage and UI components
- Dispatches events to notify components of cart changes

### useCart Hook (Compatibility Layer)

`app/features/cart/hooks/useCart.ts` is a thin wrapper around CartContext that provides backward compatibility with existing code. Rather than managing its own state, it now:

- Uses CartContext's state and methods
- Serves as an adapter for components that haven't been updated to use CartContext directly
- Maintains the same API interface for backward compatibility

### CartServiceRPC (Server Integration)

`app/features/cart/api/cartServiceRPC.ts` handles server-side cart operations:

- Communicates with Supabase database
- Manages anonymous cart IDs
- Handles cart creation, updates, and removal in the database
- Works with both anonymous and authenticated users

## Event System

The cart system uses custom events to notify components of changes:

- `CART_COUNT_EVENT_NAME` ('cart-count-update'): Updates cart count indicators
- `CART_INDICATOR_EVENT_NAME` ('cart-indicator-update'): Direct updates to header indicators
- `cart-cleared`: Notifies when a cart has been completely cleared

Events now include timestamps and use debouncing to prevent event loops and rapid-fire updates.

## Initialization Flow

1. When the application loads, CartContext initializes first
2. It prioritizes server-provided cart data (from root loader)
3. If no server data is available, it falls back to localStorage
4. After initialization, it sets up event listeners to maintain synchronization
5. Each component that needs cart data uses either CartContext or the useCart hook

## Best Practices

### Using Cart State

```tsx
// Recommended approach - use CartContext directly
import { useCart } from '~/features/cart/context/CartContext';

function MyComponent() {
  const { cartItems, addToCart, removeCartItem } = useCart();
  
  // Use cart data and methods...
}
```

### Preventing Event Loops

- Always include timestamps in cart update events
- Use debouncing for event handlers that might fire frequently
- Check for meaningful changes before updating state
- Avoid unnecessary event dispatching

### State Updates

- Update React state first for optimistic UI updates
- Then update localStorage
- Finally, make API calls to update the server
- Always verify operations completed successfully

### Error Handling

- Implement robust error handling at all levels
- Provide fallbacks for failed operations
- Always maintain UI consistency regardless of API failures

## Known Issues and Solutions

### Cart Clearing on Page Reload

**Problem:** Cart would clear itself when refreshing pages, particularly the products page.

**Solution:** This was fixed by:
1. Making CartContext the single source of truth
2. Adding initialization guards
3. Preventing event loops with debouncing
4. Adding timestamp tracking for events
5. Removing redundant event dispatching

### Synchronization Between Components

**Problem:** Multiple components responding to the same events could cause inconsistent state.

**Solution:**
1. All components now use the same CartContext
2. Event handlers have debouncing to prevent rapid updates
3. Components verify they have the latest data before updating

## Troubleshooting

If you encounter cart issues:

1. Check browser console for errors and cart-related log messages
2. Verify localStorage contents under `notalock_cart_data` key
3. Confirm the CartContext is initialized correctly
4. Check event listeners are not duplicated
5. Verify API calls to cart endpoints are succeeding

## Future Improvements

1. Remove deprecated cart-related events and code patterns
2. Complete migration to CartContext as the single source of truth
3. Improve cart merging during authentication
4. Add more robust testing for cart edge cases
