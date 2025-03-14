-- Start fresh with cart item policies by removing all existing ones
DROP POLICY IF EXISTS "Users can manage their cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert items into their carts" ON cart_items;
DROP POLICY IF EXISTS "Authenticated users can manage their cart items" ON cart_items;
DROP POLICY IF EXISTS "Admins can view all cart items" ON cart_items;

-- Create a simple, permissive policy for the cart_items table
-- This policy allows operations on cart_items when either:
-- 1. The user is authenticated and the cart belongs to them
-- 2. The cart is anonymous (user_id IS NULL)
-- 3. The user is an admin

CREATE POLICY "cart_items_policy" ON cart_items
FOR ALL
USING (
    -- For admins
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    OR
    -- For cart owners (both authenticated and anonymous)
    EXISTS (
        SELECT 1 FROM carts
        WHERE carts.id = cart_id
        AND (
            (carts.user_id = auth.uid() AND auth.uid() IS NOT NULL)
            OR
            carts.user_id IS NULL
        )
    )
)
WITH CHECK (
    -- For admins
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    OR
    -- For cart owners (both authenticated and anonymous)
    EXISTS (
        SELECT 1 FROM carts
        WHERE carts.id = cart_id
        AND (
            (carts.user_id = auth.uid() AND auth.uid() IS NOT NULL)
            OR
            carts.user_id IS NULL
        )
    )
);

-- Ensure we have the correct permissions at the table level
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
GRANT ALL ON cart_items TO authenticated;
GRANT ALL ON cart_items TO anon;
