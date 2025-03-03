# Database Documentation

## Overview
The Notalock e-commerce platform uses a Supabase PostgreSQL database. This document outlines the database schema, relationships, and security policies.

## Schema Details

### products
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    retail_price NUMERIC(10,2) NOT NULL,
    business_price NUMERIC(10,2),
    stock INTEGER DEFAULT 0,
    sku TEXT UNIQUE,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    has_variants BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_has_variants ON products(has_variants);
CREATE INDEX idx_products_retail_price ON products(retail_price, id);
CREATE INDEX idx_products_name ON products(name, id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_created_at ON products(created_at, id);
```

### product_categories
```sql
CREATE TABLE product_categories (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (product_id, category_id)
);

-- Indexes
CREATE INDEX idx_product_categories_product ON product_categories(product_id);
CREATE INDEX idx_product_categories_category ON product_categories(category_id);
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
    status VARCHAR DEFAULT 'active',
    is_highlighted BOOLEAN NOT NULL DEFAULT false,
    highlight_priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
```

### hero_banners
```sql
CREATE TABLE hero_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    cta_text TEXT,
    cta_link TEXT,
    secondary_cta_text TEXT,
    secondary_cta_link TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    position INTEGER NOT NULL DEFAULT 0,
    background_color TEXT,
    text_color TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_hero_banners_active ON hero_banners(is_active);
CREATE INDEX idx_hero_banners_position ON hero_banners(position);
```

### carts
```sql
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    anonymous_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_user_or_anonymous CHECK (
        (user_id IS NOT NULL AND anonymous_id IS NULL) OR
        (user_id IS NULL AND anonymous_id IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_anonymous_id ON carts(anonymous_id);
CREATE INDEX idx_carts_status ON carts(status);
```

### cart_items
```sql
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_cart_items_variant_id ON cart_items(variant_id);
```

### product_images
```sql
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_is_primary ON product_images(is_primary);
```

### profiles
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    role user_role DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
```

### admin_permissions
```sql
CREATE TABLE admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role user_role DEFAULT 'admin',
    can_manage_products BOOLEAN NOT NULL DEFAULT false,
    can_view_products BOOLEAN NOT NULL DEFAULT true,
    can_manage_categories BOOLEAN NOT NULL DEFAULT false,
    can_view_categories BOOLEAN NOT NULL DEFAULT true,
    can_manage_orders BOOLEAN NOT NULL DEFAULT false,
    can_view_orders BOOLEAN NOT NULL DEFAULT true,
    can_manage_users BOOLEAN NOT NULL DEFAULT false,
    can_view_users BOOLEAN NOT NULL DEFAULT true,
    can_manage_all_products BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_admin_permissions_user_id ON admin_permissions(user_id);
```

### admin_audit_log
```sql
CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_admin_audit_log_user_id ON admin_audit_log(user_id);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at);
```

### product_options
```sql
CREATE TABLE product_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_product_options_name ON product_options(name);
```

### product_option_values
```sql
CREATE TABLE product_option_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    option_id UUID NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_product_option_values_option_id ON product_option_values(option_id);
```

### product_variants
```sql
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT,
    retail_price NUMERIC,
    business_price NUMERIC,
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
```

### product_variant_options
```sql
CREATE TABLE product_variant_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    option_value_id UUID NOT NULL REFERENCES product_option_values(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_product_variant_options_variant_id ON product_variant_options(variant_id);
CREATE INDEX idx_product_variant_options_option_value_id ON product_variant_options(option_value_id);
```

## Views

### product_with_categories
```sql
CREATE VIEW product_with_categories AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.retail_price,
    p.stock,
    p.business_price,
    p.is_active,
    p.created_by,
    p.updated_by,
    p.created_at,
    p.featured,
    p.sku,
    p.image_url,
    pc.category_id,
    c.name AS category_name
FROM 
    products p
LEFT JOIN 
    product_categories pc ON p.id = pc.product_id
LEFT JOIN 
    categories c ON pc.category_id = c.id;
```

## Row Level Security (RLS) Policies

### Products
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
```

### Product Categories
```sql
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products categories are viewable by everyone"
    ON product_categories FOR SELECT
    USING (true);

CREATE POLICY "Product categories are editable by admins"
    ON product_categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    );
```

### Categories
```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for admins" ON categories
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Allow viewing visible categories for all users" ON categories
    FOR SELECT USING (
        is_visible = true
    );
```

### Hero Banners
```sql
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;

-- Everyone can view active banners
CREATE POLICY "Hero banners are viewable by everyone" 
    ON hero_banners FOR SELECT
    USING (is_active = true);

-- Only admins can edit hero banners
CREATE POLICY "Hero banners are editable by admins"
    ON hero_banners FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
```

### Cart & Cart Items
```sql
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Simple policy for authenticated users to access their own carts
CREATE POLICY "Authenticated users can manage their own carts" 
    ON carts FOR ALL 
    USING (user_id = auth.uid());

-- Simple policy for cart items - authenticated users
CREATE POLICY "Authenticated users can manage their cart items" 
    ON cart_items FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM carts 
            WHERE carts.id = cart_items.cart_id 
            AND carts.user_id = auth.uid()
        )
    );

-- Admin policies
CREATE POLICY "Admins can view all carts" 
    ON carts FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all cart items" 
    ON cart_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
```

### Product Images
```sql
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Everyone can view product images
CREATE POLICY "Product images are viewable by everyone" 
    ON product_images FOR SELECT
    USING (true);

-- Only admins can manage product images
CREATE POLICY "Product images are editable by admins"
    ON product_images FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    );
```

### Admin Permissions & Audit Log
```sql
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage admin permissions
CREATE POLICY "Only super admins can manage admin permissions" 
    ON admin_permissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
    ON admin_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
```

### Product Variants System
```sql
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;

-- Everyone can view product variant data
CREATE POLICY "Product variant data is viewable by everyone" 
    ON product_options FOR SELECT USING (true);
CREATE POLICY "Product option values are viewable by everyone" 
    ON product_option_values FOR SELECT USING (true);
CREATE POLICY "Product variants are viewable by everyone" 
    ON product_variants FOR SELECT USING (true);
CREATE POLICY "Product variant options are viewable by everyone" 
    ON product_variant_options FOR SELECT USING (true);

-- Only admins can manage product variant data
CREATE POLICY "Product options are editable by admins"
    ON product_options FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    );

CREATE POLICY "Product option values are editable by admins"
    ON product_option_values FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    );

CREATE POLICY "Product variants are editable by admins"
    ON product_variants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    );

CREATE POLICY "Product variant options are editable by admins"
    ON product_variant_options FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_permissions
            WHERE user_id = auth.uid()
            AND can_manage_products = true
        )
    );
```