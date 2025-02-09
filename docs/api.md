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

The product service provides comprehensive bulk update functionality with permission checks:

```typescript
interface BulkUpdateOptions {
  is_active?: boolean;
  retail_price_adjustment?: number;
  business_price_adjustment?: number;
  stock_adjustment?: number;
}

// Example usage:
const productService = new ProductService(supabase);

try {
  await productService.bulkUpdateProducts(productIds, {
    is_active: true,                  // Update status
    retail_price_adjustment: 10.00,    // Increase retail price by $10
    business_price_adjustment: 8.00,   // Increase business price by $8
    stock_adjustment: 5                // Increase stock by 5 units
  });
} catch (error) {
  console.error('Bulk update failed:', error);
  throw error;
}
```

Each update type is handled separately and includes:
- Permission validation (admin role required)
- Session verification
- Error handling
- Database stored procedures for price and stock adjustments
```

### Bulk Delete Products
```typescript
const { error } = await supabase
  .from('products')
  .delete()
  .in('id', productIds);
```

## Error Handling Pattern

All API calls should implement proper error handling:

```typescript
try {
  // Check session if needed
  if (!currentSession) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw new Error('No active session found');
    }
    currentSession = data.session;
  }

  // Check permissions if needed
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentSession.user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    throw new Error('User does not have admin permissions');
  }

  // Perform operation
  const { data, error } = await supabase
    .from('resource')
    .select('*');
    
  if (error) throw error;
  
  return data;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error(`Operation failed: ${error.message}`);
}
```

## Product Variants

### Product Options Management

#### List Options
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

### Product Variant Operations

Product variants are managed through a dedicated service that handles atomic operations and ensures data consistency:

```typescript
// Types
interface ProductVariantFormData {
  sku: string;
  retail_price: string;
  business_price: string;
  stock: string;
  is_active: boolean;
  options: Record<string, string>; // optionId -> valueId mapping
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

// Create variant with options
const variant = await createProductVariant(supabase, productId, formData);

// Update variant
const updatedVariant = await updateProductVariant(supabase, variantId, formData);

// Delete variant (cascades to options)
const deleteVariant = await deleteProductVariant(supabase, variantId);

// Fetch variants with options
const variants = await getProductVariants(supabase, productId);
```

Error handling and data validation:
```typescript
try {
  // Validate form data
  const parsedData = {
    ...formData,
    retail_price: parseFloat(formData.retail_price),
    business_price: parseFloat(formData.business_price),
    stock: parseInt(formData.stock)
  };

  // Create variant record
  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .insert(parsedData)
    .select()
    .single();

  if (variantError) throw variantError;

  // Create options atomically
  const optionPromises = Object.entries(formData.options)
    .map(([, valueId]) => (
      supabase
        .from('product_variant_options')
        .insert({
          variant_id: variant.id,
          option_value_id: valueId
        })
    ));

  await Promise.all(optionPromises);

  return variant;
} catch (error) {
  console.error('Failed to create variant:', error);
  throw new Error(`Variant creation failed: ${error.message}`);
}
```
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

The ProductImageService handles image uploads with optimization, primary image management, and automatic ordering:

```typescript
// Initialize image service
const imageService = new ProductImageService(supabase);

// Upload single image
const image = await imageService.uploadImage(file, productId, isPrimary);

// Upload multiple images
const images = await imageService.uploadMultipleImages(files, productId);

// Image optimization settings
interface OptimizationOptions {
  maxWidth: number;  // Default: 2000
  maxHeight: number; // Default: 2000
  quality: number;   // Default: 85
}

// Response type
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

## Categories (Phase 1: Sprint 2 - In Progress)

> **Note:** Category management features are being implemented as part of Phase 1, Sprint 2.

### Currently Available

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

## Order Management (Phase 1: Sprint 4 - Planned)

> **Note:** Order management features are scheduled for implementation in Phase 1, Sprint 4 (Q1 2025).

### Order Creation
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

## Image Management

### Currently Implemented

#### Image Service Configuration

The image management system provides comprehensive image handling with optimization:

```typescript
interface ImageOptimizer {
  optimizeImage: (file: File, options: OptimizationOptions) => Promise<Blob>;
}

interface OptimizationOptions {
  maxWidth: number;   // Default: 2000
  maxHeight: number;  // Default: 2000
  quality: number;    // Default: 85
  format?: 'jpeg' | 'png' | 'webp';
}

// Initialize service with custom optimizer
const imageService = new ProductImageService(
  supabase,
  new ClientImageOptimizer() // or ServerImageOptimizer
);
```

#### Core Operations

```typescript
// Single image upload with optimization
const image = await imageService.uploadImage(file, productId, isPrimary);

// Batch upload with automatic primary image handling
const images = await imageService.uploadMultipleImages(files, productId);

// Update image order
await imageService.updateImageOrder(imageId, newOrder);

// Set primary image (updates product record automatically)
await imageService.setPrimaryImage(imageId);

// Reorder all product images
await imageService.reorderImages(productId);

// Delete image with cleanup
await imageService.deleteImage(imageId);
```

#### Error Handling and Cleanup

```typescript
try {
  // Upload handling with cleanup on failure
  const { data: fileData, error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, optimizedImage, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadError) throw uploadError;

  // Database record creation
  const { data: imageRecord, error: dbError } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      url: publicUrl,
      storage_path: filePath,
      file_name: fileName,
      is_primary: false,
      sort_order: nextSortOrder
    })
    .select()
    .single();

  if (dbError) {
    // Cleanup uploaded file on database error
    await supabase.storage
      .from('product-images')
      .remove([filePath]);
    throw dbError;
  }

  return imageRecord;
} catch (error) {
  console.error('Image upload failed:', error);
  throw new Error(`Failed to upload image: ${error.message}`);
}
```

### Planned Features

> **Note:** The following features are planned according to our development roadmap.

#### Performance Optimization (Phase 3)

```typescript
// Image optimization configuration
interface OptimizationConfig {
  compression: {
    quality: number;    // 0-100
    format: 'jpeg' | 'webp' | 'avif';
  };
  loading: {
    lazy: boolean;
    preload: boolean;
  };
  responsive: {
    sizes: number[];    // Breakpoint widths
    devicePixelRatio: number;
  };
}

// Batch optimization for product images
await imageService.optimizeProductImages(productId, config);

// Get optimized image URL
const url = imageService.getOptimizedUrl(imageId, {
  width: number,
  quality: number,
  format: 'webp'
});
```

### Potential Future Features

> **Note:** These features are being considered but are not yet part of the official roadmap.

```typescript
// Advanced image processing
interface ImageProcessingOptions {
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  effects?: {
    filter?: 'grayscale' | 'sepia' | 'blur';
    intensity?: number;
  };
}

// These APIs are conceptual and subject to change
await imageService.processImage(imageId, options);
```
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

## Security and Error Handling

### Permission Validation

All privileged operations require proper permission checks:

```typescript
async function requireAdmin(supabase: SupabaseClient) {
  // Check for active session
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) {
    throw new Error('No active session found');
  }

  // Verify admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', sessionData.session.user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    throw new Error('User does not have admin permissions');
  }

  return sessionData.session;
}

// Usage in services
class ProductService {
  private currentSession: Session | null = null;

  async deleteProduct(id: string): Promise<void> {
    try {
      // Ensure admin permissions
      if (!this.currentSession) {
        this.currentSession = await requireAdmin(this.supabase);
      }

      // Proceed with deletion
      const { error } = await this.supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete failed:', error);
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }
}
```

### Error Handling Best Practices

Implement comprehensive error handling with proper cleanup:

```typescript
try {
  // 1. Validate inputs
  if (!productId || !imageId) {
    throw new Error('Missing required parameters');
  }

  // 2. Check permissions
  await requireAdmin(this.supabase);

  // 3. Perform operation with proper error handling
  const { data, error } = await this.supabase
    .from('resource')
    .select('*');
    
  if (error) throw error;

  // 4. Cleanup on partial success if needed
  try {
    await this.cleanup();
  } catch (cleanupError) {
    console.error('Cleanup failed:', cleanupError);
    // Continue with the main operation
  }

  return data;
} catch (error) {
  // 5. Proper error logging and rethrowing
  console.error('Operation failed:', error);
  throw new Error(`Operation failed: ${error.message}`);
}
```

## Type Definitions

### Product Types (Implemented)

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

### Order Types (Phase 1: Sprint 4)

> **Note:** These types will be implemented as part of the Order Management sprint in Q1 2025.

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