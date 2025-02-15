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
                            sort_order INTEGER NOT NULL DEFAULT 0,
                            is_visible BOOLEAN NOT NULL DEFAULT true,
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
                          created_by UUID REFERENCES auth.users(id),
                          updated_by UUID REFERENCES auth.users(id),
                          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### admin_permissions
```sql
CREATE TABLE admin_permissions (
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
CREATE TABLE admin_audit_log (
                                 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                 user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                                 action TEXT NOT NULL,
                                 details JSONB,
                                 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

    ### Admin Permissions
    ```sql
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own permissions"
    ON admin_permissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only super admins can manage permissions"
    ON admin_permissions FOR ALL
    USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
    );

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
    ON admin_audit_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
    ON admin_audit_log FOR INSERT
    WITH CHECK (true);
```

### Products and Related Tables
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow view access based on permissions"
    ON products FOR SELECT
    USING (
    EXISTS (
        SELECT 1 FROM public.admin_permissions
        WHERE user_id = auth.uid()
          AND can_view_products = true
    )
    );

CREATE POLICY "Allow create/update access based on permissions"
    ON products FOR INSERT
    WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admin_permissions
        WHERE user_id = auth.uid()
          AND can_manage_products = true
    )
    );

CREATE POLICY "Allow update access based on permissions"
    ON products FOR UPDATE
    USING (
    EXISTS (
        SELECT 1 FROM public.admin_permissions ap
        WHERE ap.user_id = auth.uid()
          AND (
            (ap.can_manage_all_products = true AND ap.can_manage_products = true)
                OR (products.created_by = auth.uid() AND ap.can_manage_products = true)
            )
    )
    );

CREATE POLICY "Allow delete access based on permissions"
    ON products FOR DELETE
    USING (
    EXISTS (
        SELECT 1 FROM public.admin_permissions
        WHERE user_id = auth.uid()
          AND can_manage_products = true
          AND can_manage_all_products = true
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

CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create orders"
    ON orders FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update orders"
    ON orders FOR UPDATE
    USING (
    auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    )
    );
```

## Indexes

### Admin Permission Indexes
```sql
CREATE INDEX idx_admin_permissions_user_id ON admin_permissions(user_id);
CREATE INDEX idx_admin_audit_log_user_id ON admin_audit_log(user_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at);
```

### Product Indexes
```sql
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_created_by ON products(created_by);
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

### Category Indexes
```sql
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
```

### Order Indexes
```sql
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
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

## Role and Permission Management

### User Roles
The system uses a `user_role` enum with three values:
- `customer`: Regular customer accounts
- `business`: Business customer accounts
- `admin`: Administrator accounts

### Permission Structure
The admin permissions system provides granular control over user access:

1. Product Permissions:
   - `can_view_products`: User can view product details
   - `can_manage_products`: User can create and edit products
   - `can_manage_all_products`: User can edit and delete any product (not just their own)

    2. Category Permissions:
    - `can_view_categories`: User can view category details
    - `can_manage_categories`: User can create and edit categories

    3. Order Permissions:
                                                                                                                  - `can_view_orders`: User can view order details
                                                                                                                  - `can_manage_orders`: User can manage and update orders

                                                                                                                  4. User Management:
                                                                                                                  - `can_view_users`: User can view user profiles
                                                                                                                  - `can_manage_users`: User can manage user accounts

                                                                                                                  ### Audit Logging
                                                                                                                  The `admin_audit_log` table records all administrative actions with the following structure:
                                                                                                                  ```json
                                                                                                                  {
                                                                                                                  "details": {
                                                                                                                  "action_type": "string",
                                                                                                                  "target_id": "uuid",
                                                                                                                  "target_type": "string",
                                                                                                                  "changes": {
                                                                                                                  "field_name": {
                                                                                                                  "old_value": "any",
                                                                                                                  "new_value": "any"
                                                                                                                  }
                                                                                                                  },
                                                                                                                  "user_role": "string",
                                                                                                                  "ip": "string",
                                                                                                                  "user_agent": "string",
                                                                                                                  "additional_context": "any"
                                                                                                                  }
                                                                                                                  }
                                                                                                                  ```

                                                                                                                  ### Default Role Permissions

                                                                                                                  #### Admin Role
                                                                                                                  ```sql
                                              SELECT sync_admin_permissions(
                                                                                                                  user_id := USER_ID,
                                                                                                                  role := 'admin',
                                                                                                                  permissions := '{
        "can_manage_products": true,
        "can_view_products": true,
        "can_manage_categories": true,
        "can_view_categories": true,
        "can_manage_orders": true,
        "can_view_orders": true,
        "can_manage_users": true,
        "can_view_users": true,
        "can_manage_all_products": true
    }'
                                                                                                                  );
```

#### Business Role
```sql
SELECT sync_admin_permissions(
               user_id := USER_ID,
               role := 'business',
               permissions := '{
        "can_manage_products": true,
        "can_view_products": true,
        "can_manage_categories": false,
        "can_view_categories": true,
        "can_manage_orders": false,
        "can_view_orders": true,
        "can_manage_users": false,
        "can_view_users": false,
        "can_manage_all_products": false
    }'
       );
```

#### Customer Role
```sql
SELECT sync_admin_permissions(
               user_id := USER_ID,
               role := 'customer',
               permissions := '{
                    "can_manage_products": false,
                    "can_view_products": true,
                    "can_manage_categories": false,
                    "can_view_categories": true,
                    "can_manage_orders": false,
                    "can_view_orders": false,
                    "can_manage_users": false,
                    "can_view_users": false,
                    "can_manage_all_products": false
                }'
       );
```