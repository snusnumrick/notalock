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

### List Products
```typescript
// Basic product listing
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true);

// Products with category and images
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    category:categories(*),
    images:product_images(*)
  `)
  .eq('is_active', true);

// Products with variants
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    variants:product_variants(*)
  `)
  .eq('is_active', true);
```

### Get Single Product
```typescript
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    category:categories(*),
    images:product_images(*),
    variants:product_variants(*)
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
    category_id: string,
    description: string,
    retail_price: number,
    business_price: number,
    stock: number,
    technical_specs: object
  }])
  .select();
```

### Update Product
```typescript
const { data, error } = await supabase
  .from('products')
  .update({
    name: string,
    description: string,
    retail_price: number,
    business_price: number,
    stock: number,
    technical_specs: object
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
  // Handle error
  console.error('Error:', err.message);
}
```