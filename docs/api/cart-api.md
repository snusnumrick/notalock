# Cart API

The Cart API provides endpoints for managing shopping cart operations in the Notalock platform. It enables adding products to cart, updating quantities, removing items, and retrieving cart information. The implementation uses a hybrid approach, storing cart data both on the server and in the client's localStorage for optimal performance and reliability, with cookie-based anonymous identification to maintain consistent cart state across page reloads and sessions.

## Endpoints

### `/api/cart` (GET)

Retrieves the current cart contents.

**Method:** GET

**Success Response:**

```json
{
  "success": true,
  "cart": [
    {
      "id": "item-123",
      "cart_id": "cart-789",
      "product_id": "prod-123",
      "variant_id": "var-456",
      "quantity": 2,
      "price": 99.99,
      "created_at": "2023-01-01T12:00:00Z",
      "updated_at": "2023-01-01T12:00:00Z",
      "product": {
        "name": "Product Name",
        "sku": "PROD-001",
        "image_url": "/images/product.jpg"
      }
    }
  ]
}
```

**Error Response:**

```json
{
  "error": "An unexpected error occurred"
}
```

### `/api/cart` (POST)

Performs cart operations such as adding, updating, removing items, or clearing the cart.

**Method:** POST

**Parameters:**

| Parameter  | Type   | Required | Description                                       |
|------------|--------|----------|---------------------------------------------------|
| action     | string | Yes      | Operation to perform: "add", "update", "remove", or "clear" |
| productId  | string | For "add" | ID of the product to add to cart                  |
| quantity   | number | For "add" & "update" | Quantity to set (must be positive)     |
| price      | number | For "add" | Product price at time of addition                 |
| variantId  | string | No       | ID of product variant (if applicable)             |
| itemId     | string | For "update" & "remove" | ID of the cart item to modify      |
| anonymousCartId | string | No  | Anonymous ID for cart identification              |
| preferredCartId | string | No  | Preferred cart ID if multiple carts exist         |

#### Add Item to Cart

Adds a product to the shopping cart. If the product already exists in the cart, it updates the quantity.

**Example Request:**

```javascript
fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    action: 'add',
    productId: 'prod-123',
    quantity: '2',
    price: '99.99',
    variantId: 'var-456'
  })
})
```

**Success Response:**

```json
{
  "success": true,
  "cartItem": {
    "id": "item-123",
    "cart_id": "cart-789",
    "product_id": "prod-123",
    "variant_id": "var-456",
    "quantity": 2,
    "price": 99.99,
    "created_at": "2023-01-01T12:00:00Z",
    "updated_at": "2023-01-01T12:00:00Z"
  },
  "cart": [
    // Full updated cart contents
  ]
}
```

#### Update Cart Item

Updates the quantity of an item in the cart.

**Example Request:**

```javascript
fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    action: 'update',
    itemId: 'item-123',
    quantity: '3'
  })
})
```

**Success Response:**

```json
{
  "success": true,
  "cartItem": {
    "id": "item-123",
    "cart_id": "cart-789",
    "product_id": "prod-123",
    "variant_id": "var-456",
    "quantity": 3,
    "price": 99.99,
    "created_at": "2023-01-01T12:00:00Z",
    "updated_at": "2023-01-01T12:00:00Z"
  },
  "cart": [
    // Full updated cart contents
  ]
}
```

#### Remove Cart Item

Removes an item from the cart.

**Example Request:**

```javascript
fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    action: 'remove',
    itemId: 'item-123',
    anonymousCartId: 'anon-123', // Optional
    preferredCartId: 'cart-789'  // Optional
  })
})
```

**Success Response:**

```json
{
  "success": true,
  "cart": [
    // Full updated cart contents (without the removed item)
  ]
}
```

#### Clear Cart

Removes all items from the cart.

**Example Request:**

```javascript
fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    action: 'clear'
  })
})
```

**Success Response:**

```json
{
  "success": true,
  "cart": []
}
```

**Error Responses:**

- Missing required parameters:
  ```json
  {
    "error": "Product ID is required"
  }
  ```

- Invalid quantity:
  ```json
  {
    "error": "Quantity must be a positive number"
  }
  ```

- Invalid action:
  ```json
  {
    "error": "Invalid action"
  }
  ```

- Server error:
  ```json
  {
    "error": "An unexpected error occurred"
  }
  ```

### `/api/direct-cart-remove` (POST)

A specialized endpoint for direct cart item removal that bypasses the standard CartService. This endpoint is designed for reliability and uses multiple methods to ensure successful removal.

**Method:** POST

**Parameters:**

| Parameter      | Type   | Required | Description                                       |
|----------------|--------|----------|---------------------------------------------------|
| itemId         | string | Yes      | ID of the cart item to remove                     |
| anonymousCartId| string | No       | Anonymous ID for cart identification              |
| preferredCartId| string | No       | Preferred cart ID if multiple carts exist         |

**Example Request:**

```javascript
fetch('/api/direct-cart-remove', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    itemId: 'item-123',
    anonymousCartId: 'anon-123',
    preferredCartId: 'cart-789'
  })
})
```

**Success Response:**

```json
{
  "success": true,
  "message": "Item removed successfully"
}
```

**Partial Success Response:**

```json
{
  "success": false,
  "error": "Failed to remove item after multiple attempts",
  "clientSuccess": true
}
```

The `clientSuccess` field indicates that the client should proceed as if the operation succeeded, even if the server operation failed.

### `/api/emergency-cart-clear` (POST)

A recovery endpoint that can either clear all items from a cart or target a specific problematic item. This is used when standard cart operations fail.

**Method:** POST

**Parameters:**

| Parameter | Type   | Required | Description                                               |
|-----------|--------|----------|-----------------------------------------------------------|
| itemId    | string | No       | Specific item ID to remove (if omitted, clears all items) |

**Example Request for Full Cart Clear:**

```javascript
fetch('/api/emergency-cart-clear', {
  method: 'POST'
})
```

**Example Request for Specific Item Removal:**

```javascript
fetch('/api/emergency-cart-clear', {
  method: 'POST',
  body: new FormData().append('itemId', 'item-123')
})
```

**Success Response:**

```json
{
  "success": true,
  "message": "Cart cleared successfully" // or "Item removed successfully"
}
```

**Error Response:**

```json
{
  "error": "An unexpected error occurred"
}
```

## Cart Data Models

### Cart

The cart represents a shopping session for a user.

| Field        | Type      | Description                                          |
|--------------|-----------|------------------------------------------------------|
| id           | string    | Unique identifier for the cart                       |
| user_id      | string    | User ID for authenticated users (null for anonymous) |
| anonymous_id | string    | Anonymous identifier for unauthenticated users       |
| status       | string    | Cart status: 'active', 'merged', 'consolidated', 'cleared', 'completed' |
| created_at   | timestamp | When the cart was created                            |
| updated_at   | timestamp | When the cart was last updated                       |

### Cart Item

Represents a product in the shopping cart.

| Field       | Type      | Description                                      |
|-------------|-----------|--------------------------------------------------|
| id          | string    | Unique identifier for the cart item              |
| cart_id     | string    | Reference to the parent cart                     |
| product_id  | string    | Reference to the product                         |
| variant_id  | string    | Reference to the product variant (nullable)      |
| quantity    | number    | Quantity of the product                          |
| price       | number    | Price of the product at time of addition         |
| created_at  | timestamp | When the item was added to cart                  |
| updated_at  | timestamp | When the item was last updated                   |
| product     | object    | Joined product information (name, sku, image)    |

## Implementation Details

### Cart Services Architecture

The cart system uses a hybrid client-server architecture with robust state management:

1. **Client-side (CartContext)**:
   - Maintains cart state in React context
   - Provides hooks for cart operations
   - Handles optimistic UI updates
   - Syncs with localStorage for persistence
   - Communicates with server via API endpoints
   - Uses client-side state for immediate UI updates

2. **Server-side (CartServiceRPC)**:
   - Uses cookie-based anonymous identification
   - Manages database operations through RPC functions
   - Handles cart creation and retrieval
   - Processes cart item CRUD operations
   - Supports seamless anonymous and authenticated users
   - Prevents duplicate cart creation
   - Reactivates existing carts instead of creating new ones
   - Implements multiple fallback methods for item removal

### Cart ID Management

1. **Anonymous ID Tracking**:
   - Anonymous carts are identified by a unique ID stored in cookies and localStorage
   - This ID remains consistent across sessions
   - For each anonymous ID, a "preferred" cart ID is established
   - When multiple carts are detected for the same anonymous ID, they are consolidated

2. **Cart Consolidation**:
   - If multiple active carts are detected for the same anonymous ID, they are consolidated
   - Items from all carts are moved to the preferred cart
   - Duplicate items are intelligently merged (quantities added)
   - Other carts are marked as "consolidated" to prevent reuse
   - This prevents cart data fragmentation and inconsistent state

3. **Cart Recovery**:
   - Carts marked as "cleared" can be reactivated
   - This prevents data loss from race conditions or premature cart clearing
   - The system automatically looks for cleared carts that can be restored

### Cart Item Removal Strategy

The cart item removal functionality uses a multi-layered approach for robustness:

1. **Client-side Immediate Update**:
   - UI is updated immediately when the trash button is clicked
   - Client-side state manages the display of items
   - LocalStorage is directly updated to persist the change
   - Events are dispatched to synchronize UI components
   - Cart ID information is included with removal events

2. **Server-side Multi-method Approach**:
   - Multiple removal methods are attempted in sequence:
     1. Standard RPC function
     2. Direct database delete operation
     3. Specialized force delete RPC function
   - Verification checks ensure items are actually removed
   - All carts associated with an anonymous ID are checked

3. **Targeted Emergency Removal**:
   - The emergency cart clear endpoint can target specific items
   - This preserves other cart items while fixing the problematic one
   - It operates across all carts associated with the anonymous ID
   - It only redirects to products page if the entire cart is cleared

4. **Consistency Verification**:
   - Multiple verification steps ensure removal completion
   - Storage is checked for item existence after removal attempts
   - If an item persists, more aggressive approaches are triggered
   - Success is reported to client even if server operations partially fail

### Authentication

- For authenticated users, the cart is associated with their user ID
- For anonymous users, a unique anonymous ID is stored in both:
  - Browser localStorage for client-side operations
  - HTTP cookie for server-side identification
- When an anonymous user logs in, their cart can be merged with any existing user cart

### Session Management

- Cart sessions persist across browser sessions using both cookies and localStorage
- For authenticated users, carts are stored in the database and retrieved on login
- Multiple active carts for the same anonymous ID are not allowed - the system automatically consolidates them
- When a new anonymous cart is created with an existing anonymous ID, any previous active carts are reused

### Data Synchronization

- Cart data is synchronized between client and server
- Client-side operations perform optimistic updates for better UX
- Server responses update the client state with accurate data
- localStorage is used for client-side persistence
- Error handling ensures data integrity
- Event listeners maintain consistency across components

### Error Handling

- All API endpoints return appropriate HTTP status codes
- Validation errors return 400 status with descriptive messages
- Server errors return 500 status with generic message
- Authentication errors return 401 status
- Recovery mechanisms ensure user experience remains smooth even when errors occur

## Client-Side Usage

### Using the Cart Context

```tsx
import { useCart } from '~/features/cart/context/CartContext';

function ProductComponent() {
  const { cartItems, addToCart, updateCartItem, removeCartItem, clearCart } = useCart();
  
  const handleAddToCart = () => {
    addToCart({
      productId: 'prod-123',
      quantity: 1,
      price: 99.99,
      variantId: 'var-456'
    });
  };
  
  return (
    <div>
      <button onClick={handleAddToCart}>Add to Cart</button>
      <div>
        Cart Items: {cartItems.length}
      </div>
    </div>
  );
}
```

### Cart Provider Setup

The `CartProvider` should wrap your application to make cart functionality available:

```tsx
import { CartProvider } from '~/features/cart/context/CartContext';

function App({ children }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}
```

## Emergency Cart Clear Usage

For situations where standard removal fails, the emergency cart clear can be used:

```tsx
// For specific item removal (preserves rest of cart)
const handleEmergencyItemRemoval = async (itemId) => {
  const formData = new FormData();
  formData.append('itemId', itemId);
  
  await fetch('/api/emergency-cart-clear', {
    method: 'POST',
    body: formData
  });
};

// For complete cart reset
const handleCompleteCartReset = async () => {
  await fetch('/api/emergency-cart-clear', {
    method: 'POST'
  });
  
  // Navigate to products page
  navigate('/products');
};
```

## Future Enhancements

Planned enhancements to the Cart API include:

1. Enhanced features:
   - Saved carts functionality
   - Cart expiration and automatic cleanup
   - Product availability validation
   - Price change notifications
   - Tax calculation integration
   - Improved synchronization across devices

2. Performance optimizations:
   - Batched updates
   - Improved caching strategies
   - Better offline support
