-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS public.products
    DROP CONSTRAINT IF EXISTS fk_products_category;

-- Add foreign key constraint to products table for category_id
ALTER TABLE IF EXISTS public.products
    ADD CONSTRAINT fk_products_category
    FOREIGN KEY (category_id)
    REFERENCES public.categories(id)
    ON DELETE SET NULL;