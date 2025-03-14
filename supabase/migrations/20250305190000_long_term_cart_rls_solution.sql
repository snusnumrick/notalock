-- Long-term production-grade RLS solution for carts and cart_items
-- This provides proper security while maintaining simplicity and reliability

-- First, drop any existing policies to start with a clean slate
DROP POLICY IF EXISTS "Users can manage their cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert items into their carts" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can manage their cart items" ON cart_items;
DROP POLICY IF EXISTS "Admins can view all cart items" ON cart_items;
DROP POLICY IF EXISTS "cart_items_policy" ON cart_items;
DROP POLICY IF EXISTS "cart_items_insert_policy" ON cart_items;
DROP POLICY IF EXISTS "cart_items_select_update_delete_policy" ON cart_items;
DROP POLICY IF EXISTS "universal_cart_items_access" ON cart_items;
DROP POLICY IF EXISTS "auth_users_own_cart_items" ON cart_items;
DROP POLICY IF EXISTS "anonymous_cart_items_access" ON cart_items;
DROP POLICY IF EXISTS "admin_all_cart_items_access" ON cart_items;

DROP POLICY IF EXISTS "Users can manage their carts" ON carts;
DROP POLICY IF EXISTS "Authenticated users can manage their own carts" ON carts;
DROP POLICY IF EXISTS "Admins can view all carts" ON carts;
DROP POLICY IF EXISTS "carts_select_policy" ON carts;
DROP POLICY IF EXISTS "carts_insert_policy" ON carts;
DROP POLICY IF EXISTS "carts_update_delete_policy" ON carts;
DROP POLICY IF EXISTS "universal_cart_access" ON carts;
DROP POLICY IF EXISTS "auth_users_own_carts" ON carts;
DROP POLICY IF EXISTS "anonymous_carts_access" ON carts;
DROP POLICY IF EXISTS "admin_all_carts_access" ON carts;

-- Make sure RLS is enabled
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- CARTS POLICIES
-- 1. Authenticated users can only access their own carts
CREATE POLICY "auth_users_own_carts" ON carts
FOR ALL USING (user_id = auth.uid());

-- 2. Everyone can access anonymous carts (app logic will verify anonymous_id)
CREATE POLICY "anonymous_carts_access" ON carts
FOR ALL USING (user_id IS NULL);

-- 3. Admins can access all carts
CREATE POLICY "admin_all_carts_access" ON carts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- CART ITEMS POLICIES
-- 1. Authenticated users can access items in their carts
CREATE POLICY "auth_users_own_cart_items" ON cart_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_id
    AND carts.user_id = auth.uid()
  )
);

-- 2. Everyone can access items in anonymous carts
CREATE POLICY "anonymous_cart_items_access" ON cart_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_id
    AND carts.user_id IS NULL
  )
);

-- 3. Admins can access all cart items
CREATE POLICY "admin_all_cart_items_access" ON cart_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create a verification function that can be run to test the policies
CREATE OR REPLACE FUNCTION verify_cart_rls()
RETURNS TABLE(
  test_name TEXT,
  result BOOLEAN
) AS $$
DECLARE
  test_cart_id UUID;
  test_anon_cart_id UUID;
  test_item_id UUID;
  test_product_id UUID;
  success BOOLEAN;
BEGIN
  -- Get a product ID to use in tests
  SELECT id INTO test_product_id FROM products LIMIT 1;

  -- TEST 1: Create a cart for the current authenticated user
  test_name := 'Create authenticated user cart';
  BEGIN
    INSERT INTO carts (
      id, user_id, anonymous_id, status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), auth.uid(), NULL, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id INTO test_cart_id;
    
    result := test_cart_id IS NOT NULL;
    RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    result := FALSE;
    RETURN NEXT;
  END;

  -- TEST 2: Add item to authenticated user cart
  test_name := 'Add item to authenticated user cart';
  BEGIN
    INSERT INTO cart_items (
      id, cart_id, product_id, quantity, price, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), test_cart_id, test_product_id, 1, 9.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id INTO test_item_id;
    
    result := test_item_id IS NOT NULL;
    RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    result := FALSE;
    RETURN NEXT;
  END;

  -- TEST 3: Create anonymous cart
  test_name := 'Create anonymous cart';
  BEGIN
    INSERT INTO carts (
      id, user_id, anonymous_id, status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), NULL, 'test-anon-' || floor(random() * 1000)::text, 'active', 
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id INTO test_anon_cart_id;
    
    result := test_anon_cart_id IS NOT NULL;
    RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    result := FALSE;
    RETURN NEXT;
  END;

  -- TEST 4: Add item to anonymous cart
  test_name := 'Add item to anonymous cart';
  BEGIN
    INSERT INTO cart_items (
      id, cart_id, product_id, quantity, price, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), test_anon_cart_id, test_product_id, 1, 9.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id INTO test_item_id;
    
    result := test_item_id IS NOT NULL;
    RETURN NEXT;
  EXCEPTION WHEN OTHERS THEN
    result := FALSE;
    RETURN NEXT;
  END;

  -- Clean up test data
  DELETE FROM cart_items WHERE cart_id IN (test_cart_id, test_anon_cart_id);
  DELETE FROM carts WHERE id IN (test_cart_id, test_anon_cart_id);
END;
$$ LANGUAGE plpgsql;
