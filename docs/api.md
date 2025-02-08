# API Documentation

## Overview
The Notalock e-commerce platform uses Supabase for its backend services. This document outlines the available API endpoints and their usage.

## Authentication

### User Registration
```typescript
const { data, error } = await supabase.auth.signUp({
  email: string,
  password: string,
  options: {
    data: {
      first_name: string,
      last_name: string,
      company_name?: string,
      business_number?: string
    }
  }
});
```

### User Login
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: string,
  password: string
});
```

### Password Reset
```typescript
// Request reset
const { data, error } = await supabase.auth.resetPasswordForEmail(email);

// Update password
const { data, error } = await supabase.auth.updateUser({
  password: string
});
```

## Products

### List Products with Advanced Filtering
```typescript
interface FilterOptions {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  isActive?: boolean;
  hasVariants?: boolean;
  sortBy?: 'name' | 'price' | 'stock' | 'created';
  sortOrder?: 'asc' | 'desc';
}

// Advanced product listing with filters
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    category:categories(*),
    images:product_images(*),
    variants:product_variants(
      *,
      options:product_variant_options(
        *,
        option_value:product_option_values(*)
      )
    )
  `)
  .eq('is_active', true)
  .gte('retail_price', minPrice)
  .lte('retail_price', maxPrice)
  .gte('stock', minStock)
  .lte('stock', maxStock)
  .order(sortField, { ascending: sortOrder === 'asc' });

// Text search
if (search) {
  query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
}

// Filter by variant status
if (hasVariants !== undefined) {
  if (hasVariants) {
    query = query.not('variants', 'is', null);
  } else {
    query = query.is('variants', null);
  }
}
```

### Get Single Product
```typescript
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    category:categories(*),
    images:product_images(*),
    variants:product_variants(
      *,
      options:product_variant_options(
        *,
        option_value:product_option_values(*)
      )
    )
  `)
  .eq('id', productId)
  .single();
```

### Create Product
```typescript
const { data, error } = await supabase
  .from('products')
  .insert([{
    name: string,
    sku: string,
    description: string,
    retail_price: number,
    business_price: number,
    stock: number,
    is_active: boolean
  }])
  .select();
```

### Update Product
```typescript
const { data, error } = await supabase
  .from('products')
  .update({
    name: string,
    sku: string,
    description: string,
    retail_price: number,
    business_price: number,
    stock: number,
    is_active: boolean
  })
  .eq('id', productId)
  .select();
```

### Delete Product
```typescript
const { error } = await supabase
  .from('products')
  .delete()
  .eq('id', productId);
```

### Bulk Update Products
```typescript
// Update multiple products status
const { data, error } = await supabase
  .from('products')
  .update({ is_active: boolean })
  .in('id', productIds);

// Adjust retail prices
const { data, error } = await supabase.rpc('adjust_retail_prices', {
  product_ids: string[],
  adjustment: number
});

// Adjust business prices
const { data, error } = await supabase.rpc('adjust_business_prices', {
  product_ids: string[],
  adjustment: number
});

// Adjust stock levels
const { data, error } = await supabase.rpc('adjust_stock', {
  product_ids: string[],
  adjustment: number
});
```

### Bulk Delete Products
```typescript
const { error } = await supabase
  .from('products')
  .delete()
  .in('id', productIds);
```

## Product Variants

### List Product Options
```typescript
// Get all product options
const { data: options, error: optionsError } = await supabase
  .from('product_options')
  .select('*')
  .order('name');

// Get option values
const { data: values, error: valuesError } = await supabase
  .from('product_option_values')
  .select('*')
  .order('value');
```

### Create Product Variant
```typescript
// Create variant
const { data: variant, error: variantError } = await supabase
  .from('product_variants')
  .insert({
    product_id: string,
    sku: string,
    retail_price: number,
    business_price: number,
    stock: number,
    is_active: boolean
  })
  .select()
  .single();

// Create variant options
const { error: optionsError } = await supabase
  .from('product_variant_options')
  .insert(
    variantOptions.map(option => ({
      variant_id: variant.id,
      option_value_id: option.valueId
    }))
  );
```

### Get Product Variants
```typescript
const { data, error } = await supabase
  .from('product_variants')
  .select(`
    *,
    options:product_variant_options (
      *,
      option_value:product_option_values (*)
    )
  `)
  .eq('product_id', productId)
  .order('created_at');
```

### Update Product Variant
```typescript
// Update variant
const { error: variantError } = await supabase
  .from('product_variants')
  .update({
    sku: string,
    retail_price: number,
    business_price: number,
    stock: number,
    is_active: boolean
  })
  .eq('id', variantId);

// Update variant options
const { error: deleteError } = await supabase
  .from('product_variant_options')
  .delete()
  .eq('variant_id', variantId);

const { error: insertError } = await supabase
  .from('product_variant_options')
  .insert(newOptions);
```

### Delete Product Variant
```typescript
const { error } = await supabase
  .from('product_variants')
  .delete()
  .eq('id', variantId);
```

## Product Images

### Upload Product Image
```typescript
// Upload to storage
const { data: fileData, error: fileError } = await supabase.storage
  .from('product-images')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });

// Create database record
const { data, error } = await supabase
  .from('product_images')
  .insert([{
    product_id: string,
    url: string,
    storage_path: string,
    file_name: string,
    is_primary: boolean,
    sort_order: number
  }])
  .select();
```

### Update Image Order
```typescript
const { error } = await supabase
  .from('product_images')
  .upsert(
    images.map((image, index) => ({
      id: image.id,
      sort_order: index
    }))
  );
```

### Delete Product Image
```typescript
// Delete from storage
const { error: storageError } = await supabase.storage
  .from('product-images')
  .remove([image.storage_path]);

// Delete database record
const { error: dbError } = await supabase
  .from('product_images')
  .delete()
  .eq('id', imageId);
```

## Categories

### List Categories
```typescript
// Flat list
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .order('sort_order');

// With parent category
const { data, error } = await supabase
  .from('categories')
  .select(`
    *,
    parent:categories!parent_id(*)
  `)
  .order('sort_order');
```

### Create Category
```typescript
const { data, error } = await supabase
  .from('categories')
  .insert([{
    name: string,
    slug: string,
    description: string,
    parent_id: string,
    sort_order: number
  }])
  .select();
```

## Orders

### Create Order
```typescript
const { data, error } = await supabase
  .from('orders')
  .insert([{
    user_id: string,
    total_amount: number,
    shipping_address: object,
    billing_address: object,
    shipping_method: string
  }])
  .select();
```

### List User Orders
```typescript
const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    items:order_items(
      *,
      product:products(*),
      variant:product_variants(*)
    )
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Update Order Status
```typescript
const { data, error } = await supabase
  .from('orders')
  .update({
    status: string,
    tracking_number: string
  })
  .eq('id', orderId)
  .select();
```

## Image Upload

### Upload Product Image
```typescript
// Upload to storage
const { data: fileData, error: fileError } = await supabase.storage
  .from('product-images')
  .upload(filePath, file);

// Create database record
const { data, error } = await supabase
  .from('product_images')
  .insert([{
    product_id: string,
    url: filePath,
    alt_text: string,
    is_primary: boolean
  }])
  .select();
```

### Delete Product Image
```typescript
// Delete from storage
const { error: storageError } = await supabase.storage
  .from('product-images')
  .remove([filePath]);

// Delete database record
const { error } = await supabase
  .from('product_images')
  .delete()
  .eq('id', imageId);
```

## Error Handling
All API calls should be wrapped in try-catch blocks:
```typescript
try {
  const { data, error } = await supabase
    .from('resource')
    .select('*');
    
  if (error) throw error;
  
  // Handle success
} catch (err) {
  console.error('Error:', err.message);
  throw new Error(`Failed to fetch resource: ${err.message}`);
}
```

## Type Definitions

### Product Types
```typescript
interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  retail_price: number;
  business_price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  image_url: string | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  storage_path: string;
  file_name: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  retail_price: number;
  business_price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  options?: ProductVariantOption[];
}

interface ProductVariantOption {
  id: string;
  variant_id: string;
  option_value_id: string;
  created_at: string;
  option_value?: ProductOptionValue;
}

interface ProductOption {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ProductOptionValue {
  id: string;
  option_id: string;
  value: string;
  created_at: string;
  updated_at: string;
}
```

### Order Types
```typescript
interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: Address;
  billing_address: Address;
  shipping_method: string;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
}

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}
```