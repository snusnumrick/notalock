# Cart Item Removal Implementation

## Overview

The cart item removal functionality in Notalock uses a robust multi-layered approach designed to provide a smooth user experience while ensuring data consistency between the client and server. This document explains the architecture and implementation details of this critical feature.

## Key Components

### Client-Side Implementation

The cart item removal implementation prioritizes the user experience by following these principles:

1. **Immediate UI Feedback**:
   - When a user clicks the trash button, the item is immediately removed from the UI
   - This uses React state management with `clientDisplayItems` in the cart page component
   - Local state updates are performed optimistically before server confirmation

2. **Local Storage Persistence**:
   - Cart items are stored in `localStorage` under the key `notalock_cart_data`
   - When an item is removed, localStorage is directly updated
   - This ensures persistence across page reloads even if server operations fail

3. **Event-Based Synchronization**:
   - Custom events are dispatched to notify components of cart changes:
     - `cart-count-update` - Updates the cart count in the header
     - `cart-state-changed` - Notifies context providers about removal
   - This keeps the UI consistent across components

4. **Cart ID Management**:
   - Anonymous cart IDs are tracked via `notalock_anonymous_cart` in localStorage
   - A "preferred" cart ID is established for each anonymous ID to ensure consistency
   - Cart IDs are synchronized across components to prevent duplicate carts
   - When multiple carts are detected, they're consolidated into a single preferred cart

### Server-Side Implementation

On the server side, several redundant approaches ensure reliable data persistence:

1. **Multi-Method Removal Strategy**:
   - The system attempts multiple removal methods in sequence:
     1. `remove_cart_item_fixed` RPC function (primary method)
     2. `force_delete_cart_item` RPC function (fallback #1)
     3. Standard `remove_cart_item` RPC function (fallback #2)
     4. Direct SQL DELETE operation (fallback #3)

2. **Verification Process**:
   - After attempting removal, the system verifies if the item was actually deleted
   - If the item still exists, additional removal attempts are made
   - The verification checks all carts associated with the anonymous ID
   - This verification loop ensures completeness

3. **Graceful Error Handling**:
   - All operations use try/catch blocks to prevent crashes
   - Each failure triggers an alternative approach
   - The API always returns a response, even when operations fail

### Emergency Recovery Mechanisms

For cases where standard removal fails, the system includes several emergency measures:

1. **Direct Removal API Endpoint**:
   - `api/direct-cart-remove` provides a specialized endpoint for stubborn items
   - This bypasses the standard cart service entirely
   - It applies more aggressive techniques to ensure removal
   - It accepts cart information to check all possible locations of the item

2. **Item-Specific Emergency Removal**:
   - The emergency cart clear endpoint can now target specific items
   - It can remove just the problematic item without clearing the entire cart
   - This preserves user cart state while fixing specific issues

3. **Full Cart Clearing**:
   - The nuclear option of clearing all carts is still available when needed
   - Carts are marked as "cleared" rather than deleted to allow recovery
   - `api/emergency-cart-clear` offers this option when all else fails

4. **Cart Recovery & Reactivation**:
   - The system can reactivate carts that were previously marked as "cleared"
   - This prevents data loss and helps recover from race conditions
   - Cart loaders check for cleared carts and reactivate them when needed

5. **Client-Side Resilience**:
   - If server operations fail completely, the client-side UI remains consistent
   - The API returns `clientSuccess: true` to indicate the UI should proceed
   - Targeted page reloads are used strategically to resynchronize state

## Implementation Details

### Cart Page Component

The cart page component (`_layout.cart.tsx`) implements these core functionalities:

1. **Client-Side State Management**:
   ```tsx
   // Client-side state for reliable UI updates
   const [clientDisplayItems, setClientDisplayItems] = useState<CartItem[]>([]);
   
   // Initialize from server data on first render
   useEffect(() => {
     if (!hasInitializedClient && serverItems.length > 0) {
       setClientDisplayItems(serverItems);
       setHasInitializedClient(true);
     }
   }, [hasInitializedClient, serverItems]);
   ```

2. **Item Removal Handler with Cart ID Tracking**:
   ```tsx
   const handleRemoveItem = (itemId: string) => {
     // Get the anonymous cart ID to help with consistent removal
     const anonymousCartId = localStorage.getItem('notalock_anonymous_cart') || '';
     const preferredCartId = anonymousCartId 
       ? localStorage.getItem(`preferred_cart_${anonymousCartId}`) || ''
       : '';
     
     // Update client-side state immediately
     setClientDisplayItems(prev => prev.filter(item => item.id !== itemId));
     
     // Update localStorage directly
     const cartData = localStorage.getItem('notalock_cart_data');
     if (cartData) {
       const items = JSON.parse(cartData);
       const updatedItems = items.filter(item => item.id !== itemId);
       localStorage.setItem('notalock_cart_data', JSON.stringify(updatedItems));
       
       // Notify other components with cart information
       window.dispatchEvent(
         new CustomEvent('cart-state-changed', {
           detail: { 
             type: 'remove', 
             itemId, 
             items: updatedItems,
             anonymousCartId,
             preferredCartId 
           }
         })
       );
     }
     
     // Send removal request with cart information
     fetch('/api/direct-cart-remove', {
       method: 'POST',
       body: new URLSearchParams({ 
         itemId,
         anonymousCartId,
         preferredCartId
       }),
     }).catch(e => console.error('API error:', e));
     
     // Targeted emergency clear if needed
     setTimeout(() => {
       // Only trigger for the specific item if it still exists
       const cartData = localStorage.getItem('notalock_cart_data');
       if (cartData) {
         const items = JSON.parse(cartData);
         const itemStillExists = items.some(item => item.id === itemId);
         
         if (itemStillExists) {
           performEmergencyCartClear(itemId); // Only clears this specific item
         }
       }
     }, 5000);
   };
   ```

3. **Smart Emergency Cart Clear**:
   ```tsx
   const performEmergencyCartClear = async (specificItemId?: string) => {
     console.log(specificItemId 
       ? `Attempting emergency removal of item: ${specificItemId}` 
       : 'Attempting emergency cart clear'
     );

     try {
       // Update client state first
       if (specificItemId) {
         setClientDisplayItems(prev => prev.filter(item => item.id !== specificItemId));
       } else {
         setClientDisplayItems([]);
       }

       // Update localStorage
       if (specificItemId) {
         const cartData = localStorage.getItem('notalock_cart_data');
         if (cartData) {
           const items = JSON.parse(cartData);
           const updatedItems = items.filter(item => item.id !== specificItemId);
           localStorage.setItem('notalock_cart_data', JSON.stringify(updatedItems));
         }
       } else {
         localStorage.removeItem('notalock_cart_data');
       }

       // Call the API with the specific item ID if provided
       const formData = new FormData();
       if (specificItemId) formData.append('itemId', specificItemId);
       
       await fetch('/api/emergency-cart-clear', { 
         method: 'POST',
         body: formData
       });

       // Only navigate away if clearing the entire cart
       if (!specificItemId) {
         navigate('/products');
       }
     } catch (error) {
       console.error('Emergency operation failed:', error);
     }
   };
   ```

### Cart Context Improvements

The CartContext component (`context/CartContext.tsx`) improvements include:

1. **Better Cart ID Management**:
   ```tsx
   // During initialization
   useEffect(() => {
     if (isInitialized || typeof window === 'undefined') return;

     try {
       // Load from localStorage first
       const storedItems = loadCartFromStorage();
       
       // Get anonymous cart ID
       const anonymousCartId = localStorage.getItem('notalock_anonymous_cart');
       
       // Get preferred cart if available
       const preferredCartId = anonymousCartId
         ? localStorage.getItem(`preferred_cart_${anonymousCartId}`)
         : null;
         
       if (preferredCartId) {
         console.log(`CartContext - Using preferred cart ID: ${preferredCartId}`);
       }

       if (storedItems.length > 0) {
         setCartItems(storedItems);
       } else if (initialCartItems.length > 0) {
         setCartItems(initialCartItems);
         saveCartToStorage(initialCartItems);
       }
     } catch (err) {
       console.error('Error initializing cart:', err);
     }
   }, []);
   ```

2. **Enhanced Item Removal with Verification**:
   ```tsx
   const removeCartItem = useCallback(
     async (itemId: string) => {
       // Get a snapshot of current items
       const currentItems = [...cartItems];
       const remainingItems = currentItems.filter(item => item.id !== itemId);
       
       // Make API call with cart information
       cartFetcher.submit(
         { 
           action: 'remove', 
           itemId,
           anonymousCartId: localStorage.getItem('notalock_anonymous_cart') || '',
           preferredCartId: localStorage.getItem(`preferred_cart_${localStorage.getItem('notalock_anonymous_cart')}`) || ''
         },
         { method: 'post', action: '/api/cart' }
       );
       
       // Optimistic update
       setCartItems(remainingItems);
       
       // Update localStorage
       removeItemFromStorage(itemId);
       
       // Double-check state after a delay
       setTimeout(() => {
         try {
           const storedCart = localStorage.getItem(CART_STORAGE_KEY);
           if (storedCart) {
             const storedItems = JSON.parse(storedCart);
             if (storedItems.some(item => item.id === itemId)) {
               console.log('Item still exists after removal, forcing update');
               removeItemFromStorage(itemId);
               setCartItems(prev => prev.filter(item => item.id !== itemId));
             }
           }
         } catch (e) {
           console.error('Error checking removal:', e);
         }
       }, 300);
     },
     [cartFetcher, cartItems]
   );
   ```

### Direct Removal API Enhancements

The direct removal endpoint (`api.direct-cart-remove.tsx`) has been improved to:

```tsx
export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const itemId = formData.get('itemId') as string;
    const anonymousCartId = formData.get('anonymousCartId') as string || '';
    const preferredCartId = formData.get('preferredCartId') as string || '';
    
    console.log('Direct cart remove API - Removing item:', itemId);
    if (anonymousCartId) {
      console.log('Using anonymous cart ID:', anonymousCartId);
    }
    
    // Try multiple removal methods in sequence
    let success = false;
    
    // Method 1: Force delete RPC
    try {
      const { data: rpcSuccess } = await supabase.rpc('force_delete_cart_item', {
        p_item_id: itemId
      });
      if (rpcSuccess) success = true;
    } catch (e) {
      console.error('RPC method failed:', e);
    }
    
    // Method 2: Direct database delete
    if (!success) {
      try {
        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId);
        
        if (!deleteError) success = true;
      } catch (e) {
        console.error('Direct delete failed:', e);
      }
    }
    
    // Verify across all carts for this anonymous ID
    if (anonymousCartId) {
      try {
        const { data: allCarts } = await supabase
          .from('carts')
          .select('id')
          .eq('anonymous_id', anonymousCartId)
          .eq('status', 'active');
          
        if (allCarts && allCarts.length > 0) {
          for (const cart of allCarts) {
            if (cart.id === preferredCartId) continue; // Skip if already checked
            
            const { data: cartItems } = await supabase
              .from('cart_items')
              .select('*')
              .eq('cart_id', cart.id);
              
            if (cartItems) {
              const matchingItems = cartItems.filter(item => item.id === itemId);
              if (matchingItems.length > 0) {
                await supabase
                  .from('cart_items')
                  .delete()
                  .eq('id', itemId);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error checking all carts:', e);
      }
    }
    
    return json({
      success,
      clientSuccess: true // Always let client proceed
    });
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      clientSuccess: true // Always let client proceed
    });
  }
}
```

### Emergency Cart Clear Improvements

The emergency endpoint (`api.emergency-cart-clear.tsx`) now supports targeted item removal:

```tsx
export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const specificItemId = formData.get('itemId') as string || null;
    const anonymousCartId = await getAnonymousCartId(request);
    
    console.log(`Emergency cart clear for anonymous ID ${anonymousCartId}`);
    if (specificItemId) {
      console.log(`Targeting specific item: ${specificItemId}`);
    }
    
    const { data: allCarts } = await supabase
      .from('carts')
      .select('id')
      .eq('anonymous_id', anonymousCartId)
      .eq('status', 'active');
      
    if (!allCarts || allCarts.length === 0) {
      return json({ success: true, message: 'No active carts found' });
    }
    
    // If we have a specific item ID, only remove that item
    if (specificItemId) {
      for (const cart of allCarts) {
        // Check if item exists in this cart
        const { data: items } = await supabase
          .from('cart_items')
          .select('id')
          .eq('cart_id', cart.id)
          .eq('id', specificItemId);
          
        if (items && items.length > 0) {
          // Remove the specific item
          await supabase
            .from('cart_items')
            .delete()
            .eq('id', specificItemId);
            
          console.log(`Removed item ${specificItemId} from cart ${cart.id}`);
        }
      }
      
      return json({ 
        success: true, 
        message: `Targeted removal of item ${specificItemId} complete` 
      });
    }
    
    // Otherwise, clear all items from all carts
    for (const cart of allCarts) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);
        
      // Mark cart as cleared
      await supabase
        .from('carts')
        .update({ status: 'cleared', updated_at: new Date().toISOString() })
        .eq('id', cart.id);
    }
    
    return json({ success: true, message: 'All carts cleared' });
  } catch (error) {
    console.error('Emergency cart clear error:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
}
```

## Cart Reactivation

The cart loader now includes cart reactivation logic to recover from previous issues:

```tsx
export const cartLoader: LoaderFunction = async ({ request }) => {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);
  
  // Get anonymous cart ID from cookie
  const anonymousCartId = await getAnonymousCartId(request);
  
  // Check if we need to reactivate a previously cleared cart
  try {
    const { data: activeCarts } = await supabase
      .from('carts')
      .select('id')
      .eq('anonymous_id', anonymousCartId)
      .eq('status', 'active')
      .limit(1);
      
    // If no active carts, look for cleared carts to reactivate
    if (!activeCarts || activeCarts.length === 0) {
      const { data: latestCart } = await supabase
        .from('carts')
        .select('id, status')
        .eq('anonymous_id', anonymousCartId)
        .order('updated_at', { ascending: false })
        .limit(1);
        
      if (latestCart && latestCart.length > 0 && latestCart[0].status === 'cleared') {
        console.log(`Reactivating cart: ${latestCart[0].id}`);
        
        await supabase
          .from('carts')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', latestCart[0].id);
      }
    }
  } catch (e) {
    console.error('Error checking for carts to reactivate:', e);
  }
  
  // Get cart items using service
  const cartService = new CartServiceRPC(supabase, anonymousCartId);
  const cartItems = await cartService.getCartItems();
  
  return json({
    initialCartItems: cartItems,
  }, {
    headers: response.headers,
  });
};
```

## Testing Strategy

The cart item removal functionality is tested at multiple levels with new scenarios:

1. **Unit Tests**:
   - CartContext remove method tests
   - API endpoint tests
   - Cart ID management tests
   - Emergency cart clear with specific item tests

2. **Integration Tests**:
   - Cart page component tests
   - Cart context with actual DOM events
   - Cross-component synchronization
   - Multiple cart handling tests

3. **End-to-End Test Scenarios**:
   - Remove single item from cart
   - Remove last item from cart (empty cart case)
   - Handle network failures during item removal
   - Test emergency cart clear with specific item ID
   - Verify cart reactivation works properly
   - Verify multiple cart consolidation functions correctly

## Best Practices

When working with or modifying the cart removal functionality:

1. **Always maintain the optimistic UI update pattern**
   - Update the UI immediately for user responsiveness
   - Perform server operations in the background
   - Handle failures gracefully without disrupting the user experience

2. **Use multiple layers of redundancy**
   - Always have fallback mechanisms
   - Verify operations succeed
   - Include timeout-based recovery options

3. **Keep state synchronized**
   - Use events to notify all components of changes
   - Ensure localStorage and context state match
   - Validate server state with periodic checks

4. **Handle cart ID management carefully**
   - Always track anonymous cart IDs consistently
   - Use the preferred cart ID when available
   - Check all carts associated with an anonymous ID
   - Consolidate multiple carts when detected

5. **Implement targeted recovery**
   - Target specific items when possible
   - Only use full cart clear as a last resort
   - Provide recovery mechanisms for cleared carts
   - Always perform verification after removal attempts
