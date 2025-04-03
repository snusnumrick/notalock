-- NOTE: This migration is SUPERSEDED by application-level validation bypass
-- Please see the app/features/orders/api/orderService.ts file for the updated implementation
-- that uses the skipValidation option in updateOrder and updateOrderStatus methods.
-- This file is kept for historical reference only.

-- Modify the update_order_status function to support undo operations
DROP FUNCTION IF EXISTS update_order_status;

CREATE OR REPLACE FUNCTION update_order_status(
  order_id UUID,
  new_status TEXT,
  updated_timestamp TIMESTAMPTZ,
  is_undo_operation BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  current_status order_status;
BEGIN
  -- First get the current status to avoid triggering the history if status hasn't changed
  SELECT status INTO current_status FROM orders WHERE id = order_id;
  
  -- Only update if the status has changed or this is an undo operation
  -- (convert new_status to order_status for comparison)
  IF current_status IS NULL OR current_status::text != new_status OR is_undo_operation THEN
    
    -- Update the order status with explicit type casting to order_status enum
    UPDATE orders 
    SET status = new_status::order_status, 
        updated_at = updated_timestamp
    WHERE id = order_id;
    
    -- Add a custom note if this is an undo operation
    IF is_undo_operation THEN
      -- Insert into status history with a note about the undo
      INSERT INTO order_status_history (
        id, 
        order_id, 
        status, 
        notes, 
        created_at, 
        created_by
      )
      VALUES (
        gen_random_uuid(), 
        order_id, 
        new_status::order_status, 
        'Status reverted via undo operation', 
        updated_timestamp,
        (SELECT id FROM auth.users LIMIT 1) -- Get first available user as fallback
      );
    END IF;
    
  ELSE
    -- Just update the timestamp if status hasn't changed
    UPDATE orders SET updated_at = updated_timestamp WHERE id = order_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_order_status TO authenticated;

COMMENT ON FUNCTION update_order_status IS 'Updates an order status with proper type casting from text to order_status enum, with support for undo operations';
