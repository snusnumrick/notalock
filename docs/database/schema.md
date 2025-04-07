# Database Schema

> **Note:** For validating consistency between this schema definition and TypeScript types, see [Schema Validation](./schema-validation.md).

## Overview
The Notalock e-commerce platform uses a Supabase PostgreSQL database. This document outlines the database schema, relationships, and security policies.

## Schema Details

### Enum Types
```sql
-- Checkout step type
CREATE TYPE checkout_step AS ENUM ('information', 'shipping', 'payment', 'review', 'confirmation');

-- Order status type
CREATE TYPE order_status AS ENUM ('created', 'processing', 'completed', 'cancelled', 'refunded', 'pending', 'paid', 'failed', 'shipped', 'delivered', 'payment_failed');

-- Payment method type
CREATE TYPE payment_method_type AS ENUM ('credit_card', 'paypal', 'bank_transfer', 'square');

-- Payment status type
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled');

-- Cart status type
CREATE TYPE cart_status AS ENUM ('active', 'merged', 'checkout', 'completed', 'abandoned', 'duplicate', 'cleared', 'consolidated');
```

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

**CartStatus Values**:
- `active`: Cart is currently in use
- `merged`: Cart has been merged into another cart
- `checkout`: Cart is in the checkout process
- `completed`: Checkout was completed and order was placed
- `abandoned`: Cart was abandoned by the user
- `duplicate`: Cart was identified as a duplicate
- `cleared`: Cart items were intentionally cleared
- `consolidated`: Cart was consolidated with another cart

```sql
CREATE TABLE carts (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       user_id UUID REFERENCES auth.users(id),
                       anonymous_id TEXT,
    status cart_status NOT NULL DEFAULT 'active',
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       CONSTRAINT check_user_or_anonymous CHECK (
                           (user_id IS NOT NULL AND anonymous_id IS NULL) OR
                           (user_id IS NULL AND anonymous_id IS NOT NULL)
    ),
    CONSTRAINT unique_active_anonymous_cart UNIQUE (anonymous_id) WHERE (anonymous_id IS NOT NULL AND status = 'active')
);

-- Indexes
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_anonymous_id ON carts(anonymous_id);
CREATE INDEX idx_carts_status ON carts(status);
CREATE INDEX idx_carts_created_at ON carts(created_at);
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
CREATE INDEX idx_cart_items_created_at ON cart_items(created_at);
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
    alt_text TEXT, -- Accessibility description for the image
    updated_by UUID REFERENCES auth.users(id), -- Who last updated the image
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

### checkout_sessions
```sql
CREATE TABLE checkout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    guest_email TEXT,
    shipping_address JSONB,
    billing_address JSONB,
    shipping_method TEXT,
    shipping_option JSONB,
    payment_method TEXT,
    payment_info JSONB,
    current_step checkout_step NOT NULL DEFAULT 'information',
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_checkout_sessions_cart_id ON checkout_sessions(cart_id);
CREATE INDEX idx_checkout_sessions_user_id ON checkout_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_checkout_sessions_current_step ON checkout_sessions(current_step);
```

**Column Details**:

| Column Name      | Data Type                | Description                                      |
| ---------------- | ------------------------ | ------------------------------------------------ |
| id               | uuid                     | Primary key identifier                           |
| cart_id          | uuid                     | Reference to the cart being checked out          |
| user_id          | uuid                     | User ID for authenticated users                  |
| guest_email      | text                     | Email for guest checkout                         |
| shipping_address | jsonb                    | Shipping address information                     |
| billing_address  | jsonb                    | Billing address information                      |
| shipping_method  | text                     | Selected shipping method                         |
| shipping_option  | jsonb                    | Detailed shipping option information             |
| payment_method   | text                     | Selected payment method                          |
| payment_info     | jsonb                    | Payment details (secured)                        |
| current_step     | checkout_step            | Current checkout step (information/shipping/etc) |
| subtotal         | numeric                  | Order subtotal amount                            |
| shipping_cost    | numeric                  | Shipping cost amount                             |
| tax              | numeric                  | Tax amount                                       |
| total            | numeric                  | Total order amount                               |
| created_at       | timestamp with time zone | Record creation timestamp                        |
| updated_at       | timestamp with time zone | Record last update timestamp                     |

### orders
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkout_session_id UUID REFERENCES checkout_sessions(id),
    cart_id UUID REFERENCES carts(id),
    user_id UUID REFERENCES auth.users(id),
    guest_email TEXT,
    email TEXT NOT NULL,
    order_number TEXT NOT NULL UNIQUE,
    status order_status NOT NULL DEFAULT 'pending',
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    shipping_method TEXT NOT NULL,
    shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    subtotal_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    payment_intent_id TEXT,
    payment_method_id TEXT,
    payment_provider TEXT,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_orders_checkout_session_id ON orders(checkout_session_id);
CREATE INDEX idx_orders_cart_id ON orders(cart_id);
CREATE INDEX idx_orders_user_id ON orders(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_intent_id ON orders(payment_intent_id);
CREATE INDEX idx_orders_email ON orders(email);
```

### order_items
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    options JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

### order_status_history
```sql
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
```

## Stored Procedures/Functions

### update_hero_banner_positions
```sql
CREATE OR REPLACE FUNCTION update_hero_banner_positions(banner_ids UUID[])
RETURNS void AS $$
DECLARE
    banner_id UUID;
    i INTEGER;
BEGIN
    -- Loop through the array of banner IDs and update positions
    FOR i IN 1..array_length(banner_ids, 1)
    LOOP
        banner_id := banner_ids[i];
        
        -- Update position based on array index
        UPDATE hero_banners
        SET 
            position = i - 1,
            updated_at = NOW()
        WHERE id = banner_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_hero_banner_positions(UUID[]) TO authenticated;
```

This function reorders hero banners by updating their positions based on the order of IDs in the provided array. It's used by the `reorderHeroBanners` method in the HeroBannerService to efficiently update all positions in a single database call.

### ensure_single_anonymous_cart
```sql
CREATE OR REPLACE FUNCTION ensure_single_anonymous_cart()
RETURNS TRIGGER AS $$
BEGIN
    -- If inserting an anonymous cart, mark any existing active carts as 'merged'
    IF NEW.anonymous_id IS NOT NULL AND NEW.status = 'active' THEN
        UPDATE carts
        SET status = 'merged'
        WHERE anonymous_id = NEW.anonymous_id
        AND status = 'active'
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

This trigger function ensures that only one active cart exists per anonymous ID. If a new active cart is created with an existing anonymous ID, any previous active carts with the same anonymous ID are marked as 'merged'.

### update_updated_at_column
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

This function is used in triggers to automatically update the `updated_at` column whenever a record is modified.

### log_order_status_change
```sql
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS NULL OR NEW.status <> OLD.status THEN
        INSERT INTO order_status_history (
            order_id,
            status,
            notes,
            created_by
        ) VALUES (
            NEW.id,
            NEW.status::order_status,
            'Status changed from ' || COALESCE(OLD.status::TEXT, 'NULL') || ' to ' || NEW.status::TEXT,
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This function creates a status history entry whenever an order's status changes. It's triggered by updates to the `status` field in the `orders` table. It uses explicit type casting with `::order_status` to ensure the status value is properly converted to the PostgreSQL enum type.

### log_initial_order_status
```sql
CREATE OR REPLACE FUNCTION log_initial_order_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO order_status_history (
        order_id,
        status,
        notes,
        created_by
    ) VALUES (
        NEW.id,
        NEW.status,
        'Order created with status ' || NEW.status::TEXT,
        auth.uid()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This function logs the initial status when an order is created. It's triggered by inserts into the `orders` table.

### update_order_status
```sql
CREATE OR REPLACE FUNCTION update_order_status(
  order_id UUID,
  new_status TEXT,
  updated_timestamp TIMESTAMPTZ
)
RETURNS VOID AS $$
DECLARE
  current_status order_status;
BEGIN
  -- First get the current status to avoid triggering the history if status hasn't changed
  SELECT status INTO current_status FROM orders WHERE id = order_id;
  
  -- Only update if the status has changed (convert new_status to order_status for comparison)
  IF current_status IS NULL OR current_status::text != new_status THEN
    
    -- Update the order status with explicit type casting to order_status enum
    UPDATE orders 
    SET status = new_status::order_status, 
        updated_at = updated_timestamp
    WHERE id = order_id;
    
  ELSE
    -- Just update the timestamp if status hasn't changed
    UPDATE orders SET updated_at = updated_timestamp WHERE id = order_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_order_status TO authenticated;
```

This function updates an order's status with proper type casting from text to the `order_status` enum type. It checks if the status actually changed before performing the update to avoid unnecessary triggers and history entries. The function uses explicit type casting with `::order_status` to handle PostgreSQL enum type safety.

### Cart Management RPC Functions

#### add_to_cart
```sql
CREATE OR REPLACE FUNCTION public.add_to_cart(
  p_cart_id UUID,
  p_price NUMERIC(10,2),
  p_product_id UUID,
  p_quantity INTEGER,
  p_variant_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_id UUID;
  v_now TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
  v_cart_exists BOOLEAN;
BEGIN
  -- First check if the cart exists
  SELECT EXISTS (
    SELECT 1 FROM carts
    WHERE id = p_cart_id
  ) INTO v_cart_exists;
  
  IF NOT v_cart_exists THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;
  
  -- Check if item already exists in cart
  SELECT id INTO v_item_id
  FROM cart_items
  WHERE cart_id = p_cart_id
  AND product_id = p_product_id
  AND (
    (variant_id = p_variant_id) OR
    (variant_id IS NULL AND p_variant_id IS NULL)
  );
  
  -- If item exists, update quantity
  IF v_item_id IS NOT NULL THEN
    UPDATE cart_items
    SET 
      quantity = quantity + p_quantity,
      updated_at = v_now
    WHERE id = v_item_id;
    
    RETURN v_item_id;
  ELSE
    -- Insert new item
    v_item_id := gen_random_uuid();
    
    INSERT INTO cart_items (
      id, 
      cart_id, 
      product_id, 
      variant_id, 
      quantity, 
      price, 
      created_at, 
      updated_at
    ) VALUES (
      v_item_id,
      p_cart_id,
      p_product_id,
      p_variant_id,
      p_quantity,
      p_price,
      v_now,
      v_now
    );
    
    RETURN v_item_id;
  END IF;
END;
$$;
```

This function adds an item to a cart, handling both new items and quantity updates for existing items. It returns the cart item ID.

#### update_cart_item
```sql
CREATE OR REPLACE FUNCTION public.update_cart_item(
  p_item_id UUID,
  p_quantity INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the item quantity
  UPDATE cart_items
  SET 
    quantity = p_quantity,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_item_id;
  
  RETURN FOUND;
END;
$$;
```

This function updates the quantity of a cart item and returns whether the update was successful.

#### remove_cart_item
```sql
CREATE OR REPLACE FUNCTION public.remove_cart_item(
  p_item_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the item
  DELETE FROM cart_items
  WHERE id = p_item_id;
  
  RETURN FOUND;
END;
$$;
```

This function removes an item from a cart and returns whether the deletion was successful.

#### remove_cart_item_fixed
```sql
CREATE OR REPLACE FUNCTION public.remove_cart_item_fixed(
  p_item_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
  v_cart_id UUID;
  v_item_exists BOOLEAN;
BEGIN
  -- Check if the item exists before attempting removal
  SELECT 
    EXISTS(SELECT 1 FROM cart_items WHERE id = p_item_id),
    cart_id
  INTO v_item_exists, v_cart_id
  FROM cart_items
  WHERE id = p_item_id;
  
  -- Log the attempt
  RAISE LOG 'Removing cart item: %, exists: %, cart_id: %', 
    p_item_id, v_item_exists, v_cart_id;
  
  -- If item doesn't exist, return false
  IF NOT v_item_exists THEN
    RAISE LOG 'Item % not found', p_item_id;
    RETURN FALSE;
  END IF;
  
  -- Try to delete the item
  DELETE FROM cart_items
  WHERE id = p_item_id;
  
  -- Check if deletion was successful
  GET DIAGNOSTICS v_exists = ROW_COUNT;
  
  RAISE LOG 'Item % deleted: %', p_item_id, (v_exists > 0);
  
  RETURN (v_exists > 0);
END;
$$;
```

This enhanced version of the cart item removal function includes additional validation, diagnostics, and logging to make cart item removal more robust.

#### force_delete_cart_item
```sql
CREATE OR REPLACE FUNCTION public.force_delete_cart_item(
  p_item_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
  v_product_id UUID;
  v_quantity INTEGER;
  v_cart_id UUID;
BEGIN
  -- Capture item details for logging before deletion
  SELECT 
    cart_id, 
    product_id, 
    quantity
  INTO 
    v_cart_id, 
    v_product_id, 
    v_quantity
  FROM cart_items
  WHERE id = p_item_id;
  
  -- Direct delete bypassing any constraints
  DELETE FROM cart_items
  WHERE id = p_item_id;
  
  -- Check if deletion was successful
  GET DIAGNOSTICS v_exists = ROW_COUNT;
  
  RETURN (v_exists > 0);
END;
$$;
```

This function provides a forceful cart item removal option, bypassing most constraints and intended as a fallback when standard removal fails.

#### list_cart_items
```sql
CREATE OR REPLACE FUNCTION public.list_cart_items(
  p_cart_id UUID
) RETURNS TABLE (
  item_id UUID,
  product_id UUID,
  quantity INTEGER,
  price NUMERIC,
  variant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    product_id,
    quantity,
    price,
    variant_id,
    created_at,
    updated_at
  FROM cart_items
  WHERE cart_id = p_cart_id
  ORDER BY created_at DESC;
END;
$$;
```

This function returns a detailed list of all items in a given cart, ordered by creation date.

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

-- Users can manage their carts
CREATE POLICY "Users can manage their carts" 
    ON carts FOR ALL
    USING (
        -- Either the user is authenticated and owns the cart
        (user_id = auth.uid() AND auth.uid() IS NOT NULL)
        -- Or the cart is anonymous (validation handled in the application)
        OR user_id IS NULL
    );

-- Policy for authenticated users' cart items
CREATE POLICY "Auth users can manage their cart items" 
    ON cart_items FOR ALL
    USING (
    EXISTS (
        SELECT 1 FROM carts
        WHERE carts.id = cart_items.cart_id
          AND carts.user_id = auth.uid()
            AND auth.uid() IS NOT NULL
        )
    );

-- Policy for anonymous cart items
CREATE POLICY "Anonymous cart items access" 
    ON cart_items FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM carts 
            WHERE carts.id = cart_items.cart_id 
            AND carts.user_id IS NULL
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

### Checkout and Order System
```sql
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Policies for checkout_sessions
CREATE POLICY "Users can manage their checkout sessions" 
    ON checkout_sessions FOR ALL 
    USING (
        -- Either the user is authenticated and owns the session
        (user_id = auth.uid() AND auth.uid() IS NOT NULL)
        -- Or it's a guest checkout (handled in application)
        OR user_id IS NULL
    );

-- Policies for orders
CREATE POLICY "Users can view their orders" 
    ON orders FOR SELECT 
    USING (
        -- Either the user is authenticated and owns the order
        (user_id = auth.uid() AND auth.uid() IS NOT NULL)
        -- Or it's a guest order (identified by guest_email in application)
        OR user_id IS NULL
    );

-- Policies for order_items
CREATE POLICY "Users can view their order items" 
    ON order_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND (
                -- Either the user is authenticated and owns the order
                (orders.user_id = auth.uid() AND auth.uid() IS NOT NULL)
                -- Or it's a guest order
                OR orders.user_id IS NULL
            )
        )
    );

-- Policies for order_status_history
CREATE POLICY "Users can view their own order status history" 
    ON order_status_history FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_status_history.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- Admin policies
CREATE POLICY "Admins can manage all checkout sessions" 
    ON checkout_sessions FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all orders" 
    ON orders FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all order items" 
    ON order_items FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all order status history" 
    ON order_status_history FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert order status history" 
    ON order_status_history FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
```