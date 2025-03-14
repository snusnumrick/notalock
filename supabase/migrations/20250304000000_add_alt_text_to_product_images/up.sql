-- Add alt_text column to product_images table
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS alt_text TEXT;

-- Add updated_by column to track who updated the image
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
