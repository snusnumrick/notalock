# Product Management Features

## Product Variants
Product variants allow you to manage different versions of the same product (e.g., different sizes, colors).

### Setting Up Options
1. Navigate to a product's edit form
2. Switch to the "Variants" tab
3. Add variant options (e.g., Size: Small, Medium, Large)

### Managing Variants
Each variant can have:
- Unique SKU
- Individual pricing (retail and business)
- Separate stock tracking
- Independent active status

### Example Usage
```typescript
// Creating a variant
const variantData = {
  sku: "SHIRT-RED-L",
  retail_price: "29.99",
  business_price: "24.99",
  stock: "100",
  is_active: true,
  options: {
    "color-option-id": "red-value-id",
    "size-option-id": "large-value-id"
  }
};

// Using the variant service
const variantService = new VariantService(supabaseClient);
await variantService.createVariant(productId, variantData);
```

## Advanced Search & Filtering

### Available Filters
- Text search (name, SKU, description)
- Price range (min/max)
- Stock level (min/max)
- Active status
- Has variants flag
- Sort options (name, price, stock, created date)

### Using Filters
```typescript
const filterOptions = {
  search: "shirt",
  minPrice: 20,
  maxPrice: 50,
  minStock: 5,
  isActive: true,
  hasVariants: true,
  sortBy: "price",
  sortOrder: "asc"
};

// Using the product service
const productService = new ProductService(supabaseClient);
const products = await productService.fetchProducts(filterOptions);
```

## Bulk Operations

### Available Operations
1. Status Updates
   - Activate/deactivate multiple products

2. Price Adjustments
   - Modify retail prices
   - Modify business prices
   - Support for both fixed and percentage adjustments

3. Stock Adjustments
   - Increase/decrease stock levels
   - Support for fixed quantity adjustments

### Using Bulk Operations
```typescript
// Bulk update example
const updates = {
  is_active: true,
  retail_price_adjustment: 5.00,  // Add $5 to retail price
  business_price_adjustment: -2.00,  // Reduce business price by $2
  stock_adjustment: 10  // Add 10 units to stock
};

// Using the product service
const productService = new ProductService(supabaseClient);
await productService.bulkUpdateProducts(selectedIds, updates);

// Bulk delete example
await productService.bulkDeleteProducts(selectedIds);
```

## Database Structure

### Product Variants Tables
```sql
-- Product options (e.g., Size, Color)
CREATE TABLE public.product_options (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL
);

-- Option values (e.g., Small, Red)
CREATE TABLE public.product_option_values (
    id UUID PRIMARY KEY,
    option_id UUID REFERENCES product_options(id),
    value TEXT NOT NULL
);

-- Product variants
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    sku TEXT UNIQUE,
    retail_price DECIMAL(10, 2),
    business_price DECIMAL(10, 2),
    stock INTEGER,
    is_active BOOLEAN
);

-- Variant options
CREATE TABLE public.product_variant_options (
    id UUID PRIMARY KEY,
    variant_id UUID REFERENCES product_variants(id),
    option_value_id UUID REFERENCES product_option_values(id)
);
```

## Components Reference

### ProductSearch
```typescript
<ProductSearch
  onFilterChange={(filters: FilterOptions) => void}
  defaultFilters?: FilterOptions
/>
```

### VariantManagement
```typescript
<VariantManagement
  productId: string
  variants: ProductVariant[]
  options: ProductOption[]
  optionValues: ProductOptionValue[]
  onVariantCreate: (data: ProductVariantFormData) => Promise<void>
  onVariantUpdate: (id: string, data: ProductVariantFormData) => Promise<void>
  onVariantDelete: (id: string) => Promise<void>
/>
```

### BulkOperations
```typescript
<BulkOperations
  selectedIds: string[]
  onBulkDelete: (ids: string[]) => Promise<void>
  onBulkUpdate: (ids: string[], updates: UpdateOptions) => Promise<void>
/>
```

## TypeScript Interfaces

### Variant Types
```typescript
interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  retail_price: number;
  business_price: number;
  stock: number;
  is_active: boolean;
  options?: ProductVariantOption[];
}

interface ProductVariantOption {
  id: string;
  variant_id: string;
  option_value_id: string;
  option_value?: ProductOptionValue;
}
```

### Filter Types
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
```