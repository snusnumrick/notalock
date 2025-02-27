# Database Documentation

## Overview
The Notalock e-commerce platform uses a Supabase PostgreSQL database. This document outlines the database schema, relationships, and security policies.

## Schema Details

### products
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    retail_price NUMERIC(10,2) NOT NULL,
    business_price NUMERIC(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    sku TEXT UNIQUE,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    has_variants BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_has_variants ON products(has_variants);
CREATE INDEX idx_products_retail_price ON products(retail_price, id);
CREATE INDEX idx_products_name ON products(name, id);
CREATE INDEX idx_products_created_at ON products(created_at, id);
```

### product_categories
```sql
CREATE TABLE product_categories (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
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
    status VARCHAR,
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
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

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