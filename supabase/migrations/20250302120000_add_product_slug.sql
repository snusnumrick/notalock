-- Migration to add slug field to products table

-- Add slug column without constraints initially
ALTER TABLE public.products
ADD COLUMN slug TEXT;

-- First, generate a base slug for all products
UPDATE public.products
SET slug = regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g');

-- Handle duplicate slugs by adding a suffix
DO $$
DECLARE
    duplicate_slug RECORD;
    counter INTEGER;
BEGIN
    -- Find all duplicate slugs
    FOR duplicate_slug IN
        SELECT slug, COUNT(*) as count
        FROM public.products
        GROUP BY slug
        HAVING COUNT(*) > 1
    LOOP
        -- For each slug with duplicates, add a counter to all but the first one
        counter := 1;
        UPDATE public.products
        SET slug = slug || '-' || counter
        WHERE id IN (
            SELECT id
            FROM public.products
            WHERE slug = duplicate_slug.slug
            ORDER BY created_at, id
            OFFSET 1
            LIMIT 1
        );
        counter := counter + 1;
        
        -- Process remaining duplicates if there are more than 2
        WHILE counter <= duplicate_slug.count LOOP
            UPDATE public.products
            SET slug = regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g') || '-' || counter
            WHERE id IN (
                SELECT id
                FROM public.products
                WHERE slug = duplicate_slug.slug
                ORDER BY created_at, id
                OFFSET 1
                LIMIT 1
            );
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Add NOT NULL and UNIQUE constraints after populating data
ALTER TABLE public.products
ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.products
ADD CONSTRAINT products_slug_key UNIQUE (slug);

-- Create a function that generates unique slugs
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    new_slug TEXT;
    counter INTEGER;
    slug_exists BOOLEAN;
BEGIN
    -- Only generate slug if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        -- Create base slug from name
        base_slug := regexp_replace(lower(NEW.name), '[^a-z0-9]+', '-', 'g');
        new_slug := base_slug;
        counter := 1;
        
        -- Check if slug exists
        LOOP
            SELECT EXISTS(SELECT 1 FROM public.products WHERE slug = new_slug) INTO slug_exists;
            EXIT WHEN NOT slug_exists;
            -- If exists, add counter and try again
            new_slug := base_slug || '-' || counter;
            counter := counter + 1;
        END LOOP;
        
        NEW.slug := new_slug;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_product_insert_update
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.generate_product_slug();

-- Create index for slug field
CREATE INDEX idx_products_slug ON products(slug);