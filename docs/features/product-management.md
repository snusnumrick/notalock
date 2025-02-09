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

## Categories Integration

### Category Assignment
Products can be assigned to categories through the product form:
```typescript
interface ProductFormData {
  category_id?: string;  // Optional category assignment
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
```

### Filtering by Category
The advanced search includes category filtering:
```typescript
interface FilterOptions {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  isActive?: boolean;
  hasVariants?: boolean;
  categoryId?: string;  // Filter by specific category
  includeCategoryChildren?: boolean;  // Include products from child categories
  sortBy?: 'name' | 'price' | 'stock' | 'created';
  sortOrder?: 'asc' | 'desc';
}

// Using category filters
const filterOptions = {
  categoryId: "123e4567-e89b-12d3-a456-426614174000",
  includeCategoryChildren: true
};

// Using the product service
const productService = new ProductService(supabaseClient);
const products = await productService.fetchProducts(filterOptions);
```

### Bulk Category Operations
New bulk operations available for category management:
```typescript
// Bulk update category example
const updates = {
  category_id: "new-category-id"  // Move selected products to new category
};

// Using the product service
const productService = new ProductService(supabaseClient);
await productService.bulkUpdateProducts(selectedIds, updates);
```

## Advanced Search & Filtering

### Available Filters
- Text search (name, SKU, description)
- Price range (min/max)
- Stock level (min/max)
- Active status
- Has variants flag
- Category filter
- Include subcategories option
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

### Core Product Table
```sql
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id),
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    retail_price DECIMAL(10,2) NOT NULL,
    business_price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    technical_specs JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for category lookups
CREATE INDEX idx_products_category ON products(category_id);
```

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

### ProductForm
```typescript
<ProductForm
  initialData?: Product
  categories?: Category[]  // Available categories for assignment
  onSubmit: (data: ProductFormData) => Promise<void>
/>
```

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

### Product Types
```typescript
interface Product {
  id: string;
  category_id?: string;
  category?: Category;
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
```

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
  categoryId?: string;
  includeCategoryChildren?: boolean;
  sortBy?: 'name' | 'price' | 'stock' | 'created';
  sortOrder?: 'asc' | 'desc';
}
```