-- Create a stored procedure for updating order status with proper enum type casting
CREATE OR REPLACE FUNCTION update_order_status(
  order_id UUID,
  new_status TEXT,
  updated_timestamp TIMESTAMPTZ
)
RETURNS VOID AS $$
DECLARE
  current_status order_status;
BEGIN
  -- First get the current status to avoid triggering the history if status hasn't changed
  SELECT status INTO current_status FROM orders WHERE id = order_id;
  
  -- Only update if the status has changed (convert new_status to order_status for comparison)
  IF current_status IS NULL OR current_status::text != new_status THEN
    
    -- Update the order status with explicit type casting to order_status enum
    UPDATE orders 
    SET status = new_status::order_status, 
        updated_at = updated_timestamp
    WHERE id = order_id;
    
  ELSE
    -- Just update the timestamp if status hasn't changed
    UPDATE orders SET updated_at = updated_timestamp WHERE id = order_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_order_status TO authenticated;

COMMENT ON FUNCTION update_order_status IS 'Updates an order status with proper type casting from text to order_status enum';