-- Create RPC functions to support CartServiceRPC implementation
-- These functions match the expected parameters from the error message

-- Function to add an item to a cart
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
BEGIN
  -- First check if the cart exists
  SELECT EXISTS (
    SELECT 1 FROM carts
    WHERE id = p_cart_id
  ) INTO v_cart_exists;
  
  IF NOT v_cart_exists THEN
    RAISE EXCEPTION 'Cart not found';
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

-- Function to update cart item quantity
CREATE OR REPLACE FUNCTION public.update_cart_item(
  p_item_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the item quantity
  UPDATE cart_items
  SET 
    quantity = p_quantity,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_item_id;
  
  RETURN FOUND;
END;
$$;

-- Function to remove cart item
CREATE OR REPLACE FUNCTION public.remove_cart_item(
  p_item_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the item
  DELETE FROM cart_items
  WHERE id = p_item_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_to_cart TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_to_cart TO anon;
GRANT EXECUTE ON FUNCTION public.update_cart_item TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_cart_item TO anon;
GRANT EXECUTE ON FUNCTION public.remove_cart_item TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_cart_item TO anon;
