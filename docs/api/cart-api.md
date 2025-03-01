# Cart API

The Cart API provides endpoints for managing shopping cart operations in the Notalock platform. It enables adding products to cart, updating quantities, removing items, and retrieving cart information.

## Endpoints

### `/api/cart`

#### Add Item to Cart

Adds a product to the shopping cart. If the product already exists in the cart, it updates the quantity.

**Method:** POST

**Parameters:**

| Parameter  | Type   | Required | Description                                       |
|------------|--------|----------|---------------------------------------------------|
| action     | string | Yes      | Must be "add" for this operation                  |
| productId  | string | Yes      | ID of the product to add to cart                  |
| quantity   | number | Yes      | Quantity to add (must be positive)                |
| price      | number | Yes      | Product price at time of addition                 |
| variantId  | string | No       | ID of product variant (if applicable)             |

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
  }
}
```

**Error Responses:**

- Missing productId:
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

## Cart Data Models

### Cart

The cart represents a shopping session for a user.

| Field        | Type      | Description                                          |
|--------------|-----------|------------------------------------------------------|
| id           | string    | Unique identifier for the cart                       |
| user_id      | string    | User ID for authenticated users (null for anonymous) |
| anonymous_id | string    | Anonymous identifier for unauthenticated users       |
| status       | string    | Cart status: 'active', 'checkout', 'completed', etc. |
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

## Implementation Details

### Authentication

- For authenticated users, the cart is associated with their user ID
- For anonymous users, a unique anonymous ID is stored in localStorage
- When an anonymous user logs in, their cart can be merged with any existing user cart

### Session Management

- Cart sessions persist across browser sessions using localStorage for anonymous users
- For authenticated users, carts are stored in the database and retrieved on login
- Multiple active carts are not allowed per user - the most recent active cart is used

### Error Handling

- All API endpoints return appropriate HTTP status codes
- Validation errors return 400 status with descriptive messages
- Server errors return 500 status with generic message
- Authentication errors return 401 status

## Future Enhancements

Planned enhancements to the Cart API include:

1. Additional endpoints for:
   - Retrieving cart contents
   - Updating item quantities
   - Removing items from cart
   - Applying promotional codes
   - Clearing the entire cart

2. Enhanced features:
   - Saved carts functionality
   - Cart expiration and automatic cleanup
   - Product availability validation
   - Price change notifications
   - Tax calculation integration
