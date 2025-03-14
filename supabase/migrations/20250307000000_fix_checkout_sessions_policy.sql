-- Fix checkout_sessions RLS policies to properly handle anonymous/guest checkouts
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage their own checkout sessions" ON checkout_sessions;
DROP POLICY IF EXISTS "Admins can manage all checkout sessions" ON checkout_sessions;

-- Create comprehensive policies for checkout_sessions similar to cart policies

-- 1. Authenticated users can manage their own checkout sessions
CREATE POLICY "auth_users_own_checkout_sessions" ON checkout_sessions
FOR ALL USING (user_id = auth.uid());

-- 2. Everyone can access anonymous checkout sessions (app logic will validate cart ownership)
CREATE POLICY "anonymous_checkout_sessions_access" ON checkout_sessions
FOR ALL USING (user_id IS NULL);

-- 3. Admins can manage all checkout sessions
CREATE POLICY "admin_all_checkout_sessions_access" ON checkout_sessions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Similarly, update orders and order_items policies to handle guest checkouts

-- Orders policies
DROP POLICY IF EXISTS "Authenticated users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

-- 1. Authenticated users can view their own orders
CREATE POLICY "auth_users_own_orders" ON orders
FOR ALL USING (user_id = auth.uid());

-- 2. Everyone can access anonymous orders (app logic will validate)
CREATE POLICY "anonymous_orders_access" ON orders
FOR ALL USING (user_id IS NULL);

-- 3. Admins can manage all orders
CREATE POLICY "admin_all_orders_access" ON orders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Order items policies
DROP POLICY IF EXISTS "Authenticated users can view their order items" ON order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON order_items;

-- 1. Access to order items for authenticated users
CREATE POLICY "auth_users_own_order_items" ON order_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- 2. Access to order items for anonymous users
CREATE POLICY "anonymous_order_items_access" ON order_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id IS NULL
  )
);

-- 3. Admins can manage all order items
CREATE POLICY "admin_all_order_items_access" ON order_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create a verification function to test the policies
CREATE OR REPLACE FUNCTION verify_checkout_rls()
RETURNS TABLE(
  test_name TEXT,
  result BOOLEAN
) AS $$
DECLARE
  test_cart_id UUID;
  test_checkout_id UUID;
  test_order_id UUID;
  test_order_item_id UUID;
  test_product_id UUID;
  success BOOLEAN;
BEGIN
  -- Get a product ID to use in tests
  SELECT id INTO test_product_id FROM products LIMIT 1;

  -- TEST 1: Create an anonymous cart
  test_name := 'Create anonymous cart';
  BEGIN
    INSERT INTO carts (
      id, user_id, anonymous_id, status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), NULL, 'test-anon-' || floor(random() * 1000)::text, 'active', 
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id INTO test_cart_id;
    
    result := test_cart_id IS NOT NULL;
    RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    result := FALSE;
    RETURN NEXT;
  END;

  -- TEST 2: Create a checkout session for anonymous cart
  test_name := 'Create anonymous checkout session';
  BEGIN
    INSERT INTO checkout_sessions (
      id, cart_id, user_id, current_step, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), test_cart_id, NULL, 'information', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id INTO test_checkout_id;
    
    result := test_checkout_id IS NOT NULL;
    RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    result := FALSE;
    RETURN NEXT;
  END;

  -- TEST 3: Create an order for anonymous checkout
  test_name := 'Create anonymous order';
  BEGIN
    INSERT INTO orders (
      id, checkout_session_id, cart_id, user_id, order_number, status, 
      shipping_address, billing_address, shipping_method, payment_method,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), test_checkout_id, test_cart_id, NULL, 
      'TEST-' || floor(random() * 10000)::text, 'created',
      '{"firstName": "Test", "lastName": "User", "address1": "123 Main St", "city": "Testville", "state": "CA", "postalCode": "12345", "country": "US", "phone": "1234567890"}'::jsonb,
      '{"firstName": "Test", "lastName": "User", "address1": "123 Main St", "city": "Testville", "state": "CA", "postalCode": "12345", "country": "US", "phone": "1234567890"}'::jsonb,
      'standard', 'credit_card',
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id INTO test_order_id;
    
    result := test_order_id IS NOT NULL;
    RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    result := FALSE;
    RETURN NEXT;
  END;

  -- TEST 4: Create an order item for anonymous order
  test_name := 'Create anonymous order item';
  BEGIN
    INSERT INTO order_items (
      id, order_id, product_id, name, sku, quantity, price, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), test_order_id, test_product_id, 'Test Product', 'TEST-SKU', 1, 9.99,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id INTO test_order_item_id;
    
    result := test_order_item_id IS NOT NULL;
    RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    result := FALSE;
    RETURN NEXT;
  END;

  -- Clean up test data
  DELETE FROM order_items WHERE id = test_order_item_id;
  DELETE FROM orders WHERE id = test_order_id;
  DELETE FROM checkout_sessions WHERE id = test_checkout_id;
  DELETE FROM carts WHERE id = test_cart_id;
END;
$$ LANGUAGE plpgsql;