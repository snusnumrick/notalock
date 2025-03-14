-- Remove columns added in the up migration
ALTER TABLE public.product_images DROP COLUMN IF EXISTS alt_text;
ALTER TABLE public.product_images DROP COLUMN IF EXISTS updated_by;
