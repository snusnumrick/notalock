# Product Management API

## Overview
The product management API in Notalock provides interfaces for:
1. Product CRUD operations
2. Variant management
3. Bulk operations
4. Advanced filtering and search
5. Category relationships

## Service Implementation

### ProductService
Located at: `/app/features/products/api/productService.ts`

Main service class for product operations:

```typescript
const productService = new ProductService(supabaseClient);

// Fetch products with filtering
const products = await productService.fetchProducts({
  search: "door handle",
  categoryId: "123",
  isActive: true
});

// Create product
const newProduct = await productService.createProduct({
  name: "Premium Door Handle",
  sku: "DH-001",
  retail_price: 29.99,
  business_price: 24.99
});
```

### Types

```typescript
interface Product {
  id: string;
  category_id?: string;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  retail_price: number;
  business_price: number;
  stock: number;
  technical_specs: TechnicalSpecs;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductFormData {
  category_id?: string;
  sku: string;
  name: string;
  slug?: string;
  description?: string;
  retail_price: number;
  business_price: number;
  stock: number;
  technical_specs?: TechnicalSpecs;
  is_active?: boolean;
}

interface FilterOptions {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  isActive?: boolean;
  hasVariants?: boolean;
  categoryId?: string;
  includeCategoryChildren?: boolean;
  sortBy?: 'name' | 'price' | 'stock' | 'created';
  sortOrder?: 'asc' | 'desc';
}

interface BulkUpdateOptions {
  is_active?: boolean;
  category_id?: string;
  retail_price_adjustment?: number;
  business_price_adjustment?: number;
  stock_adjustment?: number;
}
```

## API Methods

### Product Management

#### Fetch Products
```typescript
async fetchProducts(filters?: FilterOptions): Promise<Product[]>
```
Retrieves products based on filter criteria.

Example:
```typescript
const products = await productService.fetchProducts({
  categoryId: "123",
  minStock: 5,
  isActive: true
});
```

#### Get Product
```typescript
async getProduct(id: string): Promise<Product>
```
Retrieves a single product by ID.

Example:
```typescript
const product = await productService.getProduct("product-123");
```

#### Create Product
```typescript
async createProduct(data: ProductFormData): Promise<Product>
```
Creates a new product.

Example:
```typescript
const product = await productService.createProduct({
  name: "Smart Lock X1",
  sku: "SL-001",
  retail_price: 299.99,
  business_price: 249.99,
  stock: 100
});
```

#### Update Product
```typescript
async updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product>
```
Updates an existing product.

Example:
```typescript
const updated = await productService.updateProduct("product-123", {
  retail_price: 319.99,
  stock: 150
});
```

#### Delete Product
```typescript
async deleteProduct(id: string): Promise<void>
```
Deletes a product.

Example:
```typescript
await productService.deleteProduct("product-123");
```

### Variant Management

#### Create Variant
```typescript
async createVariant(productId: string, data: VariantFormData): Promise<ProductVariant>
```
Creates a new product variant.

Example:
```typescript
const variant = await productService.createVariant("product-123", {
  sku: "SL-001-SILVER",
  retail_price: 309.99,
  options: {
    color: "silver"
  }
});
```

#### Update Variant
```typescript
async updateVariant(id: string, data: Partial<VariantFormData>): Promise<ProductVariant>
```
Updates an existing variant.

Example:
```typescript
const updated = await productService.updateVariant("variant-123", {
  retail_price: 329.99,
  stock: 50
});
```

### Bulk Operations

#### Bulk Update
```typescript
async bulkUpdateProducts(ids: string[], updates: BulkUpdateOptions): Promise<void>
```
Updates multiple products simultaneously.

Example:
```typescript
await productService.bulkUpdateProducts(
  ["prod-1", "prod-2"],
  {
    category_id: "new-category",
    retail_price_adjustment: 5.00
  }
);
```

#### Bulk Delete
```typescript
async bulkDeleteProducts(ids: string[]): Promise<void>
```
Deletes multiple products.

Example:
```typescript
await productService.bulkDeleteProducts(["prod-1", "prod-2"]);
```

## Error Handling

The API implements consistent error handling:
- Database errors are wrapped in user-friendly messages
- Validation is performed before operations
- Constraint violations are handled
- Bulk operation failures are reported in detail

Example:
```typescript
try {
  await productService.bulkUpdateProducts(ids, updates);
} catch (error) {
  if (error instanceof BulkOperationError) {
    // Handle partial failures
    console.log(error.failedIds);
  }
}
```

## Best Practices

### Data Validation
- Validate SKU uniqueness
- Check price constraints
- Verify category existence
- Validate variant options
- Sanitize input data

### Performance
- Use appropriate indexes
- Batch database operations
- Implement caching
- Optimize queries
- Handle large datasets

### Security
- Respect row-level security
- Validate permissions
- Implement audit logging
- Sanitize inputs
- Handle sensitive data

For detailed security policies, see [Database Documentation](../database/schema.md#products).

## Future Improvements

### Enhanced Features
- Advanced variant management
- Pricing rules engine
- Inventory tracking
- Product bundles
- Digital products support

### Performance Enhancements
- Query optimization
- Caching strategy
- Bulk operation improvements
- Real-time updates
- Search optimization