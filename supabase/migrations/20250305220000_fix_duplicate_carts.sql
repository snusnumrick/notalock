-- Fix for duplicate cart entries
-- This migration adds a unique constraint on anonymous_id for active carts
-- and cleans up duplicate entries

-- First, create a function to clean up duplicate active carts by keeping only the most recent one
CREATE OR REPLACE FUNCTION clean_duplicate_carts()
RETURNS VOID AS $$
DECLARE
    anon_id TEXT;
BEGIN
    -- Find all anonymous_ids with more than one active cart
    FOR anon_id IN 
        SELECT anonymous_id 
        FROM carts 
        WHERE anonymous_id IS NOT NULL 
        AND status = 'active' 
        GROUP BY anonymous_id 
        HAVING COUNT(*) > 1
    LOOP
        -- Keep the most recently created cart for each anonymous_id
        UPDATE carts
        SET status = 'duplicate'
        WHERE anonymous_id = anon_id
        AND status = 'active'
        AND id NOT IN (
            SELECT id 
            FROM carts 
            WHERE anonymous_id = anon_id 
            AND status = 'active' 
            ORDER BY created_at DESC 
            LIMIT 1
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to clean up duplicates
SELECT clean_duplicate_carts();

-- Drop the function after use
DROP FUNCTION clean_duplicate_carts();

-- Add a unique constraint for anonymous_id on active carts
ALTER TABLE carts DROP CONSTRAINT IF EXISTS unique_active_anonymous_cart;
ALTER TABLE carts ADD CONSTRAINT unique_active_anonymous_cart 
    UNIQUE (anonymous_id)
    WHERE (anonymous_id IS NOT NULL AND status = 'active');

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT unique_active_anonymous_cart ON carts IS 
    'Each anonymous ID can only have one active cart at a time';

-- Now create a function that ensures only one active cart per anonymous ID
CREATE OR REPLACE FUNCTION ensure_single_anonymous_cart()
RETURNS TRIGGER AS $$
BEGIN
    -- If inserting an anonymous cart, mark any existing active carts as 'merged'
    IF NEW.anonymous_id IS NOT NULL AND NEW.status = 'active' THEN
        UPDATE carts
        SET status = 'merged'
        WHERE anonymous_id = NEW.anonymous_id
        AND status = 'active'
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run before insert
DROP TRIGGER IF EXISTS before_cart_insert ON carts;
CREATE TRIGGER before_cart_insert
BEFORE INSERT ON carts
FOR EACH ROW
EXECUTE FUNCTION ensure_single_anonymous_cart();
