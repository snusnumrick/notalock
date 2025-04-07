-- Migration to create the product_images_backup table based on TypeScript definitions.

CREATE TABLE public.product_images_backup (
    id UUID,
    product_id UUID,
    url TEXT,
    sort_order INTEGER,
    is_primary BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- Note: No primary key, foreign keys, or NOT NULL constraints are added,
-- as the corresponding TypeScript definition shows all columns as nullable
-- and doesn't specify constraints. Consider adding them if required.

ALTER TABLE public.product_images_backup OWNER TO postgres;

GRANT ALL ON TABLE public.product_images_backup TO postgres;
GRANT ALL ON TABLE public.product_images_backup TO service_role;
-- Adjust ANON_KEY and AUTHENTICATED_USER grants as needed for your RLS policies
-- GRANT SELECT ON TABLE public.product_images_backup TO anon;
-- GRANT SELECT ON TABLE public.product_images_backup TO authenticated;

COMMENT ON TABLE public.product_images_backup IS 'Backup table for product images, mirroring structure from TypeScript types.';
