-- First, ensure the user has the correct role in profiles
UPDATE public.profiles 
SET role = 'admin'
WHERE id = auth.uid();

-- This should trigger the sync_admin_permissions function, but let's also ensure it directly
INSERT INTO public.admin_permissions (
    user_id,
    role,
    can_manage_products,
    can_view_products,
    can_manage_categories,
    can_view_categories,
    can_manage_orders,
    can_view_orders,
    can_manage_users,
    can_view_users,
    can_manage_all_products
)
SELECT 
    p.id,
    p.role,
    true,  -- can_manage_products
    true,  -- can_view_products
    true,  -- can_manage_categories
    true,  -- can_view_categories
    true,  -- can_manage_orders
    true,  -- can_view_orders
    true,  -- can_manage_users
    true,  -- can_view_users
    true   -- can_manage_all_products
FROM public.profiles p
WHERE p.id = auth.uid()
AND NOT EXISTS (
    SELECT 1 FROM public.admin_permissions ap WHERE ap.user_id = p.id
)
ON CONFLICT (user_id) 
DO UPDATE SET
    role = EXCLUDED.role,
    can_manage_products = true,
    can_view_products = true,
    can_manage_categories = true,
    can_view_categories = true,
    can_manage_orders = true,
    can_view_orders = true,
    can_manage_users = true,
    can_view_users = true,
    can_manage_all_products = true,
    updated_at = NOW();