-- Update cart_status enum with new values

-- Check if the enum exists first
DO $$ 
BEGIN
  -- First attempt to add 'cleared' value
  BEGIN
    ALTER TYPE cart_status ADD VALUE 'cleared';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, do nothing
    RAISE NOTICE 'Value "cleared" already exists in enum cart_status';
  END;
  
  -- Then attempt to add 'consolidated' value
  BEGIN
    ALTER TYPE cart_status ADD VALUE 'consolidated';
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, do nothing
    RAISE NOTICE 'Value "consolidated" already exists in enum cart_status';
  END;
END $$;
