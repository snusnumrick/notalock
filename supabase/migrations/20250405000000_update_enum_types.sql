-- Migration to update enum types to match TypeScript definitions
-- and convert TEXT columns to use proper enum types

-- Start transaction
BEGIN;

-- 1. Update cart_status enum to add missing values
DO $$ 
BEGIN
  -- Add 'merged' value if it doesn't exist
  BEGIN
    ALTER TYPE cart_status ADD VALUE 'merged';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, do nothing
    RAISE NOTICE 'Value "merged" already exists in enum cart_status';
  END;
  
  -- Add 'duplicate' value if it doesn't exist
  BEGIN
    ALTER TYPE cart_status ADD VALUE 'duplicate';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, do nothing
    RAISE NOTICE 'Value "duplicate" already exists in enum cart_status';
  END;
END $$;

-- 2. Update order_status enum to add missing values
DO $$ 
BEGIN
  -- Add 'shipped' value if it doesn't exist
  BEGIN
    ALTER TYPE order_status ADD VALUE 'shipped';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, do nothing
    RAISE NOTICE 'Value "shipped" already exists in enum order_status';
  END;
  
  -- Add 'delivered' value if it doesn't exist
  BEGIN
    ALTER TYPE order_status ADD VALUE 'delivered';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, do nothing
    RAISE NOTICE 'Value "delivered" already exists in enum order_status';
  END;
  
  -- Add 'payment_failed' value if it doesn't exist
  BEGIN
    ALTER TYPE order_status ADD VALUE 'payment_failed';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, do nothing
    RAISE NOTICE 'Value "payment_failed" already exists in enum order_status';
  END;
END $$;

-- 3. Update payment_status enum to add missing values
DO $$ 
BEGIN
  -- Add 'processing' value if it doesn't exist
  BEGIN
    ALTER TYPE payment_status ADD VALUE 'processing';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, do nothing
    RAISE NOTICE 'Value "processing" already exists in enum payment_status';
  END;
  
  -- Add 'refunded' value if it doesn't exist
  BEGIN
    ALTER TYPE payment_status ADD VALUE 'refunded';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, do nothing
    RAISE NOTICE 'Value "refunded" already exists in enum payment_status';
  END;
  
  -- Add 'cancelled' value if it doesn't exist
  BEGIN
    ALTER TYPE payment_status ADD VALUE 'cancelled';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, do nothing
    RAISE NOTICE 'Value "cancelled" already exists in enum payment_status';
  END;
END $$;

-- 4. Convert TEXT columns to use proper enum types

-- For carts table
ALTER TABLE carts ALTER COLUMN status TYPE cart_status USING status::cart_status;

-- For checkout_sessions table
ALTER TABLE checkout_sessions ALTER COLUMN current_step TYPE checkout_step USING current_step::checkout_step;

-- For orders table
ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status;
ALTER TABLE orders ALTER COLUMN payment_method TYPE payment_method_type USING payment_method::payment_method_type;
ALTER TABLE orders ALTER COLUMN payment_status TYPE payment_status USING payment_status::payment_status;

-- Commit transaction
COMMIT;

-- Add comment for documentation
COMMENT ON MIGRATION IS 'Updates enum types to match TypeScript definitions and converts TEXT columns to use these enum types';
