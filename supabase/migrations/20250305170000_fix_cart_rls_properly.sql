-- Migration to fix cart RLS policies properly
-- First, ensure we have the proper schema

-- STEP 1: Create a debugging function to help diagnose RLS issues
CREATE OR REPLACE FUNCTION debug_cart_rls(cart_id UUID, user_id UUID, anonymous_id TEXT)
RETURNS TABLE(
  check_result BOOLEAN,
  cart_exists BOOLEAN,
  user_check BOOLEAN,
  anonymous_check BOOLEAN,
  cart_owner UUID
) AS $$
DECLARE
  cart_user_id UUID;
BEGIN
  -- Get the user ID of the cart
  SELECT c.user_id INTO cart_user_id
  FROM carts c
  WHERE c.id = cart_id;
  
  -- Return debug info
  RETURN QUERY
  SELECT 
    -- Final check result
    (cart_user_id = user_id OR (cart_user_id IS NULL AND anonymous_id IS NOT NULL)),
    -- Does cart exist
    cart_user_id IS NOT NULL OR cart_id IS NOT NULL,
    -- User check
    cart_user_id = user_id,
    -- Anonymous check
    cart_user_id IS NULL AND anonymous_id IS NOT NULL,
    -- Cart owner
    cart_user_id;
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Drop all existing cart policies to start fresh
DROP POLICY IF EXISTS "Users can manage their cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert items into their carts" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can manage their cart items" ON cart_items;
DROP POLICY IF EXISTS "Admins can view all cart items" ON cart_items;
DROP POLICY IF EXISTS "cart_items_policy" ON cart_items;

-- STEP 3: Make sure RLS is enabled
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- STEP 4: Ensure proper access privileges
GRANT ALL ON cart_items TO authenticated;
GRANT ALL ON cart_items TO anon;
GRANT ALL ON carts TO authenticated;
GRANT ALL ON carts TO anon;

-- STEP 5: Create a policy for INSERT operations
CREATE POLICY "cart_items_insert_policy" ON cart_items
FOR INSERT
WITH CHECK (
  -- For admins
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  -- For authenticated users, match cart ownership
  EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_id
    AND carts.user_id = auth.uid()
    AND auth.uid() IS NOT NULL
  )
  OR
  -- For anonymous carts (no user_id)
  EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_id
    AND carts.user_id IS NULL
  )
);

-- STEP 6: Create a policy for SELECT, UPDATE, DELETE operations
CREATE POLICY "cart_items_select_update_delete_policy" ON cart_items
FOR ALL
USING (
  -- For admins
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  -- For authenticated users, match cart ownership
  EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_id
    AND carts.user_id = auth.uid()
    AND auth.uid() IS NOT NULL
  )
  OR
  -- For anonymous carts (no user_id)
  EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_id
    AND carts.user_id IS NULL
  )
);

-- STEP 7: Fix cart policies too
DROP POLICY IF EXISTS "Users can manage their carts" ON carts;
DROP POLICY IF EXISTS "Authenticated users can manage their own carts" ON carts;
DROP POLICY IF EXISTS "Admins can view all carts" ON carts;

-- STEP 8: Create policies for carts
CREATE POLICY "carts_select_policy" ON carts
FOR SELECT
USING (
  -- For admins
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  -- For authenticated users, they can see their own carts
  (user_id = auth.uid() AND auth.uid() IS NOT NULL)
  OR
  -- For anonymous carts, they can be accessed by anyone (we'll validate in the application)
  user_id IS NULL
);

CREATE POLICY "carts_insert_policy" ON carts
FOR INSERT
WITH CHECK (
  -- For admins
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  -- Authenticated users can create carts for themselves
  (user_id = auth.uid() AND auth.uid() IS NOT NULL)
  OR
  -- Anonymous carts can be created (no user_id)
  user_id IS NULL
);

CREATE POLICY "carts_update_delete_policy" ON carts
FOR ALL
USING (
  -- For admins
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  -- Authenticated users can update/delete their own carts
  (user_id = auth.uid() AND auth.uid() IS NOT NULL)
  OR
  -- Anonymous carts can be updated/deleted by anyone (we'll validate in the application)
  user_id IS NULL
);

-- STEP 9: Add a check constraint to the cart_items table to ensure cart_id is not null
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_not_null;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_cart_id_not_null CHECK (cart_id IS NOT NULL);

-- STEP 10: Create a utility function to test the RLS policies
CREATE OR REPLACE FUNCTION test_cart_rls() 
RETURNS BOOLEAN AS $$
DECLARE
  test_cart_id UUID;
  test_user_id UUID;
  test_product_id UUID;
  test_item_id UUID;
  result BOOLEAN;
BEGIN
  -- Get a test user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  -- Get a test product
  SELECT id INTO test_product_id FROM products LIMIT 1;
  
  -- Create a test cart
  INSERT INTO carts (id, user_id, anonymous_id, status)
  VALUES (gen_random_uuid(), test_user_id, NULL, 'active')
  RETURNING id INTO test_cart_id;
  
  -- Attempt to insert a cart item
  BEGIN
    INSERT INTO cart_items (id, cart_id, product_id, quantity, price)
    VALUES (gen_random_uuid(), test_cart_id, test_product_id, 1, 10.00)
    RETURNING id INTO test_item_id;
    
    result := test_item_id IS NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    result := FALSE;
  END;
  
  -- Clean up
  DELETE FROM cart_items WHERE cart_id = test_cart_id;
  DELETE FROM carts WHERE id = test_cart_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
