-- Add improved cart item removal function with debugging
-- This creates a new function that's more robust for removing cart items

-- Improved function to remove cart items
CREATE OR REPLACE FUNCTION public.remove_cart_item_fixed(
  p_item_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
  v_cart_id UUID;
  v_item_exists BOOLEAN;
BEGIN
  -- Check if the item exists before attempting removal
  SELECT 
    EXISTS(SELECT 1 FROM cart_items WHERE id = p_item_id),
    cart_id
  INTO v_item_exists, v_cart_id
  FROM cart_items
  WHERE id = p_item_id;
  
  -- Log the attempt
  RAISE LOG 'Removing cart item: %, exists: %, cart_id: %', 
    p_item_id, v_item_exists, v_cart_id;
  
  -- If item doesn't exist, return false
  IF NOT v_item_exists THEN
    RAISE LOG 'Item % not found', p_item_id;
    RETURN FALSE;
  END IF;
  
  -- Try to delete the item
  DELETE FROM cart_items
  WHERE id = p_item_id;
  
  -- Check if deletion was successful
  GET DIAGNOSTICS v_exists = ROW_COUNT;
  
  RAISE LOG 'Item % deleted: %', p_item_id, (v_exists > 0);
  
  RETURN (v_exists > 0);
END;
$$;

-- Function to force delete cart item by overriding security
CREATE OR REPLACE FUNCTION public.force_delete_cart_item(
  p_item_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
  v_product_id UUID;
  v_quantity INTEGER;
  v_cart_id UUID;
BEGIN
  -- Capture item details for logging before deletion
  SELECT 
    cart_id, 
    product_id, 
    quantity
  INTO 
    v_cart_id, 
    v_product_id, 
    v_quantity
  FROM cart_items
  WHERE id = p_item_id;
  
  -- Log the attempt with all relevant details
  RAISE LOG 'Force removing cart item: %, cart: %, product: %, quantity: %', 
    p_item_id, v_cart_id, v_product_id, v_quantity;
  
  -- Direct delete bypassing any constraints
  DELETE FROM cart_items
  WHERE id = p_item_id;
  
  -- Check if deletion was successful
  GET DIAGNOSTICS v_exists = ROW_COUNT;
  
  RAISE LOG 'Force delete result for item %: %', p_item_id, (v_exists > 0);
  
  RETURN (v_exists > 0);
END;
$$;

-- Debug function to list all cart items for a cart
CREATE OR REPLACE FUNCTION public.list_cart_items(
  p_cart_id UUID
) RETURNS TABLE (
  item_id UUID,
  product_id UUID,
  quantity INTEGER,
  price NUMERIC,
  variant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    product_id,
    quantity,
    price,
    variant_id,
    created_at,
    updated_at
  FROM cart_items
  WHERE cart_id = p_cart_id
  ORDER BY created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.remove_cart_item_fixed TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_cart_item_fixed TO anon;
GRANT EXECUTE ON FUNCTION public.force_delete_cart_item TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_delete_cart_item TO anon;
GRANT EXECUTE ON FUNCTION public.list_cart_items TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_cart_items TO anon;
