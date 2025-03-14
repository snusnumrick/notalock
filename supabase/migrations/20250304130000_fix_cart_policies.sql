-- Fix cart policies for anonymous users
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage their cart items" ON cart_items;

-- Create new policy for cart items that allows both authenticated and anonymous users
CREATE POLICY "Users can manage their cart items" 
    ON cart_items FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM carts 
            WHERE carts.id = cart_items.cart_id 
            AND (
                -- Either the user is authenticated and owns the cart
                (carts.user_id = auth.uid() AND auth.uid() IS NOT NULL)
                -- Or the cart is anonymous (we'll handle validation in the application)
                OR carts.user_id IS NULL
            )
        )
    );

-- Add policy for anonymous cart creation
DROP POLICY IF EXISTS "Authenticated users can manage their own carts" ON carts;

-- Create new policy for carts that allows both authenticated and anonymous users
CREATE POLICY "Users can manage their carts" 
    ON carts FOR ALL 
    USING (
        -- Either the user is authenticated and owns the cart
        (user_id = auth.uid() AND auth.uid() IS NOT NULL)
        -- Or the cart is anonymous (we'll handle validation in the application)
        OR user_id IS NULL
    );

-- Creating indices for performance
CREATE INDEX IF NOT EXISTS idx_carts_created_at ON carts(created_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON cart_items(created_at);
