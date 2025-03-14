-- Add additional indexes to checkout_sessions to improve query performance

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_cart_id_current_step ON checkout_sessions(cart_id, current_step);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_updated_at ON checkout_sessions(updated_at DESC);

-- Add function to fix duplicate checkout sessions
-- This will mark older duplicate sessions for the same cart as 'migrated'
CREATE OR REPLACE FUNCTION fix_duplicate_checkout_sessions() RETURNS void AS $$
DECLARE
    cart_with_duplicates RECORD;
    duplicate_sessions RECORD;
    latest_session_id UUID;
BEGIN
    -- Find carts with multiple active checkout sessions
    FOR cart_with_duplicates IN 
        SELECT cart_id, COUNT(*) as session_count
        FROM checkout_sessions
        WHERE current_step IN ('information', 'shipping', 'payment')
        GROUP BY cart_id
        HAVING COUNT(*) > 1
    LOOP
        RAISE NOTICE 'Found cart % with % active sessions', 
            cart_with_duplicates.cart_id, 
            cart_with_duplicates.session_count;
            
        -- Find the most recent session ID to keep
        SELECT id INTO latest_session_id
        FROM checkout_sessions
        WHERE cart_id = cart_with_duplicates.cart_id
        AND current_step IN ('information', 'shipping', 'payment')
        ORDER BY updated_at DESC
        LIMIT 1;
        
        -- Mark older sessions as 'migrated'
        UPDATE checkout_sessions
        SET current_step = 'migrated'
        WHERE cart_id = cart_with_duplicates.cart_id
        AND current_step IN ('information', 'shipping', 'payment')
        AND id != latest_session_id;
        
        RAISE NOTICE 'Kept session % and marked others as migrated', latest_session_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to check for and report duplicate sessions
CREATE OR REPLACE FUNCTION check_duplicate_checkout_sessions() RETURNS TABLE(
  cart_id UUID,
  session_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT cs.cart_id, COUNT(*) as session_count
  FROM checkout_sessions cs
  WHERE cs.current_step IN ('information', 'shipping', 'payment')
  GROUP BY cs.cart_id
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- Add a constraint to prevent duplicate active sessions for the same cart in the future
-- First create a function for the constraint
CREATE OR REPLACE FUNCTION check_active_checkout_session_constraint()
RETURNS trigger AS $$
BEGIN
  -- Only check for active sessions
  IF NEW.current_step IN ('information', 'shipping', 'payment') THEN
    -- Check if there's already an active session for this cart
    IF EXISTS (
      SELECT 1
      FROM checkout_sessions
      WHERE cart_id = NEW.cart_id
      AND id != NEW.id
      AND current_step IN ('information', 'shipping', 'payment')
    ) THEN
      -- Instead of failing, just mark this as a duplicate
      NEW.current_step := 'duplicate';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS check_active_checkout_session_trigger ON checkout_sessions;
CREATE TRIGGER check_active_checkout_session_trigger
BEFORE INSERT OR UPDATE ON checkout_sessions
FOR EACH ROW
EXECUTE FUNCTION check_active_checkout_session_constraint();

-- Comment out the trigger if it causes issues (can be uncommented later)
-- ALTER TABLE checkout_sessions DISABLE TRIGGER check_active_checkout_session_trigger;

-- Run the fix function to clean up existing duplicates
SELECT fix_duplicate_checkout_sessions();
