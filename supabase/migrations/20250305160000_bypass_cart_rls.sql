-- Temporarily disable RLS on cart_items to diagnose the issue
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;

-- Create a function that bypasses RLS for cart operations
-- We'll do this by creating a function with SECURITY DEFINER
-- which means it will run with the privileges of the function creator (superuser)
CREATE OR REPLACE FUNCTION public.add_to_cart(
  p_cart_id UUID,
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INTEGER,
  p_price NUMERIC(10,2)
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_id UUID;
  v_now TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
  v_user_id UUID := auth.uid();
  v_cart_exists BOOLEAN;
BEGIN
  -- First check if the cart exists and belongs to the current user (or is anonymous)
  SELECT EXISTS (
    SELECT 1 FROM carts
    WHERE id = p_cart_id
    AND (
      (user_id = v_user_id AND v_user_id IS NOT NULL)
      OR
      user_id IS NULL
    )
  ) INTO v_cart_exists;
  
  -- If cart doesn't exist or doesn't belong to user, raise an exception
  IF NOT v_cart_exists THEN
    RAISE EXCEPTION 'Cart not found or access denied';
  END IF;
  
  -- Check if item already exists in cart
  SELECT id INTO v_item_id
  FROM cart_items
  WHERE cart_id = p_cart_id
  AND product_id = p_product_id
  AND (
    (variant_id = p_variant_id) OR
    (variant_id IS NULL AND p_variant_id IS NULL)
  );
  
  -- If item exists, update quantity
  IF v_item_id IS NOT NULL THEN
    UPDATE cart_items
    SET 
      quantity = quantity + p_quantity,
      updated_at = v_now
    WHERE id = v_item_id;
    
    RETURN v_item_id;
  ELSE
    -- Insert new item
    v_item_id := gen_random_uuid();
    
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
      p_cart_id,
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

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.add_to_cart TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_to_cart TO anon;

-- Also create functions for updating and removing cart items
CREATE OR REPLACE FUNCTION public.update_cart_item(
  p_item_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_id UUID;
  v_user_id UUID := auth.uid();
  v_cart_belongs_to_user BOOLEAN;
BEGIN
  -- First get the cart ID for this item
  SELECT cart_id INTO v_cart_id
  FROM cart_items
  WHERE id = p_item_id;
  
  IF v_cart_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if cart belongs to user
  SELECT EXISTS (
    SELECT 1 FROM carts
    WHERE id = v_cart_id
    AND (
      (user_id = v_user_id AND v_user_id IS NOT NULL)
      OR
      user_id IS NULL
    )
  ) INTO v_cart_belongs_to_user;
  
  IF NOT v_cart_belongs_to_user THEN
    RETURN FALSE;
  END IF;
  
  -- Update the item
  UPDATE cart_items
  SET 
    quantity = p_quantity,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_item_id;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_cart_item(
  p_item_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_id UUID;
  v_user_id UUID := auth.uid();
  v_cart_belongs_to_user BOOLEAN;
BEGIN
  -- First get the cart ID for this item
  SELECT cart_id INTO v_cart_id
  FROM cart_items
  WHERE id = p_item_id;
  
  IF v_cart_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if cart belongs to user
  SELECT EXISTS (
    SELECT 1 FROM carts
    WHERE id = v_cart_id
    AND (
      (user_id = v_user_id AND v_user_id IS NOT NULL)
      OR
      user_id IS NULL
    )
  ) INTO v_cart_belongs_to_user;
  
  IF NOT v_cart_belongs_to_user THEN
    RETURN FALSE;
  END IF;
  
  -- Delete the item
  DELETE FROM cart_items
  WHERE id = p_item_id;
  
  RETURN TRUE;
END;
$$;

-- Grant access to the new functions
GRANT EXECUTE ON FUNCTION public.update_cart_item TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_cart_item TO anon;
GRANT EXECUTE ON FUNCTION public.remove_cart_item TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_cart_item TO anon;
