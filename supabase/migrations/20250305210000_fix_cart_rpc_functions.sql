-- Fix RPC functions for cart operations
-- This improves the add_to_cart function to create the cart if it doesn't exist

-- Drop the previous function
DROP FUNCTION IF EXISTS public.add_to_cart(UUID, NUMERIC, UUID, INTEGER, UUID);

-- Create improved add_to_cart function that creates cart if needed
CREATE OR REPLACE FUNCTION public.add_to_cart(
  p_cart_id UUID,
  p_price NUMERIC(10,2),
  p_product_id UUID,
  p_quantity INTEGER,
  p_variant_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_id UUID;
  v_now TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
  v_cart_exists BOOLEAN;
  v_cart_id UUID := p_cart_id;
  v_user_id UUID := auth.uid();
BEGIN
  -- Log parameters and context for debugging
  RAISE NOTICE 'add_to_cart called with cart_id: %, product_id: %, auth.uid(): %', 
    v_cart_id, p_product_id, v_user_id;

  -- First check if the cart exists
  SELECT EXISTS (
    SELECT 1 FROM carts
    WHERE id = v_cart_id
  ) INTO v_cart_exists;
  
  -- If cart doesn't exist, create it
  IF NOT v_cart_exists THEN
    RAISE NOTICE 'Cart not found, creating new cart';
    
    -- Generate a new cart ID if none provided
    IF v_cart_id IS NULL THEN
      v_cart_id := gen_random_uuid();
    END IF;
    
    -- Create a new cart
    INSERT INTO carts (
      id,
      user_id,
      anonymous_id,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_cart_id,
      v_user_id,
      CASE WHEN v_user_id IS NULL THEN 'auto-generated-' || v_cart_id::text ELSE NULL END,
      'active',
      v_now,
      v_now
    );
  END IF;
  
  -- Check if item already exists in cart
  SELECT id INTO v_item_id
  FROM cart_items
  WHERE cart_id = v_cart_id
  AND product_id = p_product_id
  AND (
    (variant_id = p_variant_id) OR
    (variant_id IS NULL AND p_variant_id IS NULL)
  );
  
  -- If item exists, update quantity
  IF v_item_id IS NOT NULL THEN
    RAISE NOTICE 'Updating existing cart item: %', v_item_id;
    
    UPDATE cart_items
    SET 
      quantity = quantity + p_quantity,
      updated_at = v_now
    WHERE id = v_item_id;
    
    RETURN v_item_id;
  ELSE
    -- Insert new item
    v_item_id := gen_random_uuid();
    
    RAISE NOTICE 'Creating new cart item: %', v_item_id;
    
    INSERT INTO cart_items (
      id, 
      cart_id, 
      product_id, 
      variant_id, 
      quantity, 
      price, 
      created_at, 
      updated_at
    ) VALUES (
      v_item_id,
      v_cart_id,
      p_product_id,
      p_variant_id,
      p_quantity,
      p_price,
      v_now,
      v_now
    );
    
    RETURN v_item_id;
  END IF;
END;
$$;

-- Debugging function to check cart status
CREATE OR REPLACE FUNCTION debug_cart(p_cart_id UUID)
RETURNS TABLE(
  cart_id UUID,
  cart_exists BOOLEAN,
  user_id UUID,
  anonymous_id TEXT,
  status TEXT,
  item_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as cart_id,
    (c.id IS NOT NULL) as cart_exists,
    c.user_id,
    c.anonymous_id,
    c.status,
    COUNT(ci.id) as item_count
  FROM carts c
  LEFT JOIN cart_items ci ON c.id = ci.cart_id
  WHERE c.id = p_cart_id
  GROUP BY c.id, c.user_id, c.anonymous_id, c.status;
  
  -- If no results, return a row with cart_exists = false
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      p_cart_id as cart_id,
      false as cart_exists,
      NULL::UUID as user_id,
      NULL::TEXT as anonymous_id,
      NULL::TEXT as status,
      0::BIGINT as item_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_to_cart TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_to_cart TO anon;
GRANT EXECUTE ON FUNCTION public.debug_cart TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_cart TO anon;
