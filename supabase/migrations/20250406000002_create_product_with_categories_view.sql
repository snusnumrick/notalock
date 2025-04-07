-- Migration to create the product_with_categories view based on TypeScript definitions.

CREATE VIEW public.product_with_categories AS
SELECT
    p.id,
    p.name,
    p.description,
    p.retail_price,
    p.business_price,
    p.sku,
    p.stock,
    p.image_url,
    p.is_active,
    p.featured,
    p.created_at,
    p.created_by,
    p.updated_by,
    c.id AS category_id,
    c.name AS category_name
FROM
    public.products p
LEFT JOIN
    public.product_categories pc ON p.id = pc.product_id
LEFT JOIN
    public.categories c ON pc.category_id = c.id;

ALTER VIEW public.product_with_categories OWNER TO postgres;

GRANT ALL ON TABLE public.product_with_categories TO postgres;
GRANT ALL ON TABLE public.product_with_categories TO service_role;
-- Adjust ANON_KEY and AUTHENTICATED_USER grants as needed for your RLS policies
-- GRANT SELECT ON TABLE public.product_with_categories TO anon;
-- GRANT SELECT ON TABLE public.product_with_categories TO authenticated;


COMMENT ON VIEW public.product_with_categories IS 'View joining products with their associated categories.';
