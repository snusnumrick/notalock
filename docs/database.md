# Database Documentation

## Overview
The Notalock e-commerce platform uses a Supabase PostgreSQL database. This document outlines the database schema, relationships, and security policies.

## Schema Details

### profiles
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'customer',
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    business_number TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### categories
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR,
    is_highlighted BOOLEAN NOT NULL DEFAULT false,
    highlight_priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for admins" ON categories
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Allow viewing visible categories for all users" ON categories
    FOR SELECT USING (
        is_visible = true
    );

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
```

### products
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    retail_price DECIMAL(10,2) NOT NULL,
    business_price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    technical_specs JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### product_images
```sql
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(1024) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### product_options
```sql
CREATE TABLE product_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### product_option_values
```sql
CREATE TABLE product_option_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(option_id, value)
);
```

### product_variants
```sql
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE,
    retail_price DECIMAL(10, 2),
    business_price DECIMAL(10, 2),
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### product_variant_options
```sql
CREATE TABLE product_variant_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    option_value_id UUID NOT NULL REFERENCES product_option_values(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(variant_id, option_value_id)
);
```

### orders
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    status order_status NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    shipping_method TEXT,
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### order_items
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Admin Permissions System

### admin_permissions
```sql
CREATE TABLE public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
```

### admin_audit_log
```sql
CREATE TABLE public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Permission Synchronization
```sql
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

CREATE TRIGGER sync_profile_permissions
    AFTER INSERT OR UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_admin_permissions();
```

## Database Functions

### Price Adjustment Functions
```sql
CREATE OR REPLACE FUNCTION adjust_retail_prices(
    product_ids UUID[],
    adjustment DECIMAL
) RETURNS void AS $$
BEGIN
    UPDATE products
    SET retail_price = retail_price + adjustment
    WHERE id = ANY(product_ids)
    AND retail_price + adjustment >= 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION adjust_business_prices(
    product_ids UUID[],
    adjustment DECIMAL
) RETURNS void AS $$
BEGIN
    UPDATE products
    SET business_price = business_price + adjustment
    WHERE id = ANY(product_ids)
    AND business_price + adjustment >= 0;
END;
$$ LANGUAGE plpgsql;
```

### Stock Adjustment Function
```sql
CREATE OR REPLACE FUNCTION adjust_stock(
    product_ids UUID[],
    adjustment INTEGER
) RETURNS void AS $$
BEGIN
    UPDATE products
    SET stock = stock + adjustment
    WHERE id = ANY(product_ids)
    AND stock + adjustment >= 0;
END;
$$ LANGUAGE plpgsql;
```

## Row Level Security (RLS) Policies

### Storage Policies
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

CREATE POLICY "Admin Insert Access"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM public.admin_permissions
    WHERE user_id = auth.uid()
    AND can_manage_products = true
  )
);

CREATE POLICY "Admin Full Access"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM public.admin_permissions
    WHERE user_id = auth.uid()
    AND can_manage_products = true
  )
);
```

### Profiles
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_users = true
        )
    );

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);
```

### Products and Related Tables
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
    ON products FOR SELECT
    USING (is_active = true);

CREATE POLICY "Products are editable by admins"
    ON products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    );

ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON product_options FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON product_option_values FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON product_variant_options FOR SELECT USING (true);

CREATE POLICY "Admin Write Access" ON product_options
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    );

CREATE POLICY "Admin Write Access" ON product_option_values
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    );

CREATE POLICY "Admin Write Access" ON product_variants
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    );

CREATE POLICY "Admin Write Access" ON product_variant_options
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    );
```

### Orders
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_orders = true
        )
    );

CREATE POLICY "Users can create orders"
    ON orders FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update orders"
    ON orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_orders = true
        )
    );

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
    ON order_items FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM orders WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_orders = true
        )
    );

## Indexes

### Product Indexes
```sql
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id) WHERE is_primary = true;

CREATE INDEX idx_product_options_name ON product_options(name);

CREATE INDEX idx_product_option_values_option ON product_option_values(option_id);
CREATE INDEX idx_product_option_values_value ON product_option_values(value);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_active ON product_variants(is_active);

CREATE INDEX idx_product_variant_options_variant ON product_variant_options(variant_id);
CREATE INDEX idx_product_variant_options_value ON product_variant_options(option_value_id);
```

### Order Indexes
```sql
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

### Admin Permission Indexes
```sql
CREATE INDEX idx_admin_permissions_user ON admin_permissions(user_id);
CREATE INDEX idx_admin_permissions_role ON admin_permissions(role);
CREATE INDEX idx_admin_audit_log_user ON admin_audit_log(user_id);
CREATE INDEX idx_admin_audit_log_created ON admin_audit_log(created_at DESC);
```

## Field Formats

### Technical Specifications Format
The `technical_specs` JSONB field in the products table follows this structure:
```json
{
    "dimensions": {
        "height": "number",
        "width": "number",
        "depth": "number",
        "unit": "string"
    },
    "material": "string",
    "finish": "string",
    "certifications": ["string"],
    "standards": ["string"],
    "installation": {
        "type": "string",
        "requirements": ["string"]
    },
    "warranty": {
        "duration": "string",
        "coverage": "string"
    }
}
```

### Address Format
The `shipping_address` and `billing_address` JSONB fields follow this structure:
```json
{
    "street": "string",
    "unit": "string",
    "city": "string",
    "state": "string",
    "postal_code": "string",
    "country": "string",
    "phone": "string"
}
```

### Audit Log Format
The `details` JSONB field in the admin_audit_log table follows this structure:
```json
{
  "table": "string",
  "operation": "string",
  "old_values": {},
  "new_values": {},
  "affected_ids": ["string"],
  "metadata": {}
}
```