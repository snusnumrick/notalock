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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy for admins (full access)
CREATE POLICY "Allow full access for admins" ON categories
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Policy for viewing active categories (public access)
CREATE POLICY "Allow viewing active categories for all users" ON categories
    FOR SELECT USING (
        is_active = true
    );

-- Create indexes for faster lookups
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
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

## Database Functions

### Price Adjustment Functions
```sql
-- Adjust retail prices for multiple products
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

-- Adjust business prices for multiple products
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

### Profiles
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Only admins can read all profiles
CREATE POLICY "Admins can read all profiles"
    ON profiles FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);
```

### Products and Related Tables
```sql
-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "Products are viewable by everyone"
    ON products FOR SELECT
    USING (is_active = true);

-- Only admins can modify products
CREATE POLICY "Products are editable by admins"
    ON products FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Product Options
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;

-- Public read access for product-related tables
CREATE POLICY "Public Read Access" ON product_options FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON product_option_values FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON product_variant_options FOR SELECT USING (true);

-- Admin write access for product-related tables
CREATE POLICY "Admin Write Access" ON product_options
    USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
```

### Orders
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (user_id = auth.uid());

-- Users can create their own orders
CREATE POLICY "Users can create orders"
    ON orders FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Only admins can update orders
CREATE POLICY "Admins can update orders"
    ON orders FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );
```

## Indexes

### Product Indexes
```sql
-- Products
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);

-- Product Images
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id) WHERE is_primary = true;

-- Product Options
CREATE INDEX idx_product_options_name ON product_options(name);

-- Product Option Values
CREATE INDEX idx_product_option_values_option ON product_option_values(option_id);
CREATE INDEX idx_product_option_values_value ON product_option_values(value);

-- Product Variants
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_active ON product_variants(is_active);

-- Product Variant Options
CREATE INDEX idx_product_variant_options_variant ON product_variant_options(variant_id);
CREATE INDEX idx_product_variant_options_value ON product_variant_options(option_value_id);
```

### Category Indexes
```sql
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
```

### Order Indexes
```sql
-- Orders
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Order Items
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
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
        "unit": "string" // mm, cm, inches
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