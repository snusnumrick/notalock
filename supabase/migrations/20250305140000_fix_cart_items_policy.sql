-- Fix cart_items policy to properly handle INSERT operations
-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their cart items" ON cart_items;

-- Create improved policy for cart items that allows both authenticated and anonymous users
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
                OR (carts.user_id IS NULL)
            )
        )
    );

-- Create a separate policy specifically for INSERT operations
-- This is needed because during INSERT, the row doesn't exist yet for the USING clause to check
CREATE POLICY "Users can insert items into their carts" 
    ON cart_items FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM carts 
            WHERE carts.id = cart_items.cart_id 
            AND (
                -- Either the user is authenticated and owns the cart
                (carts.user_id = auth.uid() AND auth.uid() IS NOT NULL)
                -- Or the cart is anonymous
                OR (carts.user_id IS NULL)
            )
        )
    );
