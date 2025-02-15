-- Create enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('customer', 'business', 'admin');
    END IF;
END $$;

-- Create admin permissions table
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Use the same role type as profiles table
    role user_role NOT NULL DEFAULT 'customer',
    can_manage_products BOOLEAN NOT NULL DEFAULT false,
    can_view_products BOOLEAN NOT NULL DEFAULT true,
    can_manage_categories BOOLEAN NOT NULL DEFAULT false,
    can_view_categories BOOLEAN NOT NULL DEFAULT true,
    can_manage_orders BOOLEAN NOT NULL DEFAULT false,
    can_view_orders BOOLEAN NOT NULL DEFAULT true,
    can_manage_users BOOLEAN NOT NULL DEFAULT false,
    can_view_users BOOLEAN NOT NULL DEFAULT true,
    can_manage_all_products BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS admin_permissions_user_id_idx ON public.admin_permissions(user_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_user_id_idx ON public.admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON public.admin_audit_log(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_admin_permissions_updated_at ON public.admin_permissions;
CREATE TRIGGER update_admin_permissions_updated_at
    BEFORE UPDATE ON public.admin_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.admin_permissions;
DROP POLICY IF EXISTS "Only super admins can manage permissions" ON public.admin_permissions;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;

-- Policies for admin_permissions
CREATE POLICY "Users can view their own permissions"
    ON public.admin_permissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only super admins can manage permissions"
    ON public.admin_permissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policies for admin_audit_log
CREATE POLICY "Users can view their own audit logs"
    ON public.admin_audit_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
    ON public.admin_audit_log FOR INSERT
    WITH CHECK (true);

-- Sync function to keep admin_permissions in sync with profiles
CREATE OR REPLACE FUNCTION sync_admin_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
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
        VALUES (
            NEW.id,
            NEW.role,
            CASE 
                WHEN NEW.role = 'admin' THEN true
                WHEN NEW.role = 'business' THEN false
                ELSE false
            END,
            CASE 
                WHEN NEW.role IN ('admin', 'business') THEN true
                ELSE true
            END,
            CASE 
                WHEN NEW.role = 'admin' THEN true
                ELSE false
            END,
            CASE 
                WHEN NEW.role IN ('admin', 'business') THEN true
                ELSE true
            END,
            CASE 
                WHEN NEW.role = 'admin' THEN true
                ELSE false
            END,
            CASE 
                WHEN NEW.role IN ('admin', 'business') THEN true
                ELSE false
            END,
            CASE 
                WHEN NEW.role = 'admin' THEN true
                ELSE false
            END,
            CASE 
                WHEN NEW.role = 'admin' THEN true
                ELSE false
            END,
            CASE 
                WHEN NEW.role = 'admin' THEN true
                ELSE false
            END
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
            role = EXCLUDED.role,
            can_manage_products = EXCLUDED.can_manage_products,
            can_view_products = EXCLUDED.can_view_products,
            can_manage_categories = EXCLUDED.can_manage_categories,
            can_view_categories = EXCLUDED.can_view_categories,
            can_manage_orders = EXCLUDED.can_manage_orders,
            can_view_orders = EXCLUDED.can_view_orders,
            can_manage_users = EXCLUDED.can_manage_users,
            can_view_users = EXCLUDED.can_view_users,
            can_manage_all_products = EXCLUDED.can_manage_all_products,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to sync permissions when profile is updated
DROP TRIGGER IF EXISTS sync_profile_permissions ON public.profiles;
CREATE TRIGGER sync_profile_permissions
    AFTER INSERT OR UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_admin_permissions();

-- Sync existing profiles
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
    CASE 
        WHEN p.role = 'admin' THEN true
        WHEN p.role = 'business' THEN false
        ELSE false
    END,
    CASE 
        WHEN p.role IN ('admin', 'business') THEN true
        ELSE true
    END,
    CASE 
        WHEN p.role = 'admin' THEN true
        ELSE false
    END,
    CASE 
        WHEN p.role IN ('admin', 'business') THEN true
        ELSE true
    END,
    CASE 
        WHEN p.role = 'admin' THEN true
        ELSE false
    END,
    CASE 
        WHEN p.role IN ('admin', 'business') THEN true
        ELSE false
    END,
    CASE 
        WHEN p.role = 'admin' THEN true
        ELSE false
    END,
    CASE 
        WHEN p.role = 'admin' THEN true
        ELSE false
    END,
    CASE 
        WHEN p.role = 'admin' THEN true
        ELSE false
    END
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_permissions ap WHERE ap.user_id = p.id
);