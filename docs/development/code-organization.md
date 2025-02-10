# Code Organization

## Project Structure
```
notalock/
├── app/
│   ├── __mocks__/      # Test mocks
│   │   └── web-encoding.ts  # Web Encoding API mocks
│   ├── components/
│   │   ├── common/     # Shared components
│   │   ├── features/   # Feature-specific components
│   │   └── ui/         # UI components (shadcn/ui)
│   ├── config/         # Configuration files
│   ├── features/       # Feature modules
│   │   ├── categories/ # Category management
│   │   │   ├── __tests__/  # Category feature tests
│   │   │   │   ├── categoryService.test.ts    # Service tests
│   │   │   │   ├── CategoryForm.test.tsx      # Form tests
│   │   │   │   ├── CategoryList.test.tsx      # List tests
│   │   │   │   ├── DraggableCategoryList.test.tsx  # Drag-and-drop tests
│   │   │   │   ├── CategoryTreeView.test.tsx  # Tree view tests
│   │   │   │   ├── CategorySplitView.test.tsx # Split view tests
│   │   │   │   └── CategoryManagement.test.tsx # Management tests
│   │   │   ├── api/      # Category-specific API
│   │   │   │   └── categoryService.ts     # Core category operations
│   │   │   ├── components/  # Category components
│   │   │   │   ├── CategoryForm.tsx           # Category editing
│   │   │   │   ├── CategoryList.tsx           # Basic category list view
│   │   │   │   ├── DraggableCategoryList.tsx  # Draggable category list with reordering
│   │   │   │   ├── SortableCategoryItem.tsx   # Individual draggable category item
│   │   │   │   ├── CategoryTreeView.tsx       # Hierarchical tree visualization
│   │   │   │   ├── CategorySplitView.tsx      # Combined tree and list view
│   │   │   │   └── CategoryManagement.tsx     # Main category view
│   │   │   ├── hooks/    # Category-specific hooks
│   │   │   │   └── useCategories.ts # Category management hook
│   │   │   └── types/    # Category types
│   │   │       └── category.types.ts # Category interfaces
│   │   └── products/   # Product management
│   │       ├── api/    # Product-specific API
│   │       │   ├── productService.ts     # Core product operations
│   │       │   ├── productImageService.ts # Image management
│   │       │   └── variantService.ts     # Variant management
│   │       ├── components/  # Product components
│   │       │   ├── shared/  # Shared product components
│   │       │       └── DraggableGalleryWrapper.tsx # Draggable gallery component
│   │       │   ├── ProductForm.tsx       # Product editing
│   │       │   ├── ProductManagement.tsx # Product list view
│   │       │   ├── ProductSearch.tsx     # Advanced search
│   │       │   ├── BulkOperations.tsx    # Bulk actions
│   │       │   ├── VariantForm.tsx       # Variant editing
│   │       │   └── VariantManagement.tsx # Variant management
│   │       ├── hooks/   # Product-specific hooks
│   │       │   └── useVariants.ts   # Variant management hook
│   │       ├── types/   # Product types
│   │       │   ├── product.types.ts # Product interfaces
│   │       │   └── variant.types.ts # Variant interfaces
│   │       └── utils/   # Product utilities
│   ├── lib/           # Third-party library configurations
│   ├── routes/        # Route components
│   │   ├── _index.tsx # Main app route
│   │   ├── admin/     # Admin routes
│   │   ├── admin.products/ # Product management routes
│   │   ├── admin.categories.tsx # Category management
│   │   ├── admin.image-features.tsx # Image feature management
│   │   ├── api/       # API endpoints
│   │   │   ├── images/ # Image processing endpoints
│   │   │   └── products/ # Product management endpoints
│   │   ├── products/  # Product routes
│   │   └── auth/      # Authentication routes
│   ├── server/        # Server-side code
│   │   ├── middleware/ # Server middleware (auth, images, etc.)
│   │   ├── services/  # Core services (e.g., Supabase)
│   │   └── utils/     # Server utilities
│   ├── styles/        # Global styles
│   ├── types/         # TypeScript types
│   │   ├── css.d.ts   # CSS type definitions
│   │   └── web-encoding.d.ts  # Web Encoding API type definitions
│   ├── utils/         # Client utilities
│   ├── entry.client.tsx # Client entry point
│   ├── entry.server.tsx # Server entry point
│   └── root.tsx       # Root component
├── docs/             # Documentation
│   └── development/  # Development documentation
├── public/          # Static assets
├── test/            # Global test configuration
│   └── setup.ts     # Test setup and configuration
└── supabase/        # Supabase configuration
    └── migrations/  # Database migrations
```

## Server Organization
The server directory follows a middleware-first approach for common functionality:

### Middleware Layer
Located in `app/server/middleware/`:
- `auth.server.ts`: Authentication and authorization
- `error.server.ts`: Error handling and validation
- `image.server.ts`: Image processing and optimization
- `supabase.server.ts`: Supabase client management

For detailed middleware documentation, see [Middleware Documentation](./middleware.md).

### Core Services
Located in `app/server/services/`:
- Supabase client configuration
- Future service integrations (e.g., payment processing)

### Server Utilities
Located in `app/server/utils/`:
- Session management
- Helper functions
- Type definitions

## Route Organization

### API Routes
API routes follow a consistent pattern:
```typescript
import { withErrorHandler, requireAdmin, validateMethod } from '~/server/middleware';

export const action = withErrorHandler(async ({ request }) => {
  validateMethod(request, ['POST']);
  const { user, response } = await requireAdmin(request);
  // ... route logic
});
```

### Protected Routes
Admin and protected routes use authentication middleware:
```typescript
import { withErrorHandler, requireAdmin } from '~/server/middleware';

export const loader = withErrorHandler(async ({ request }) => {
  const { user, response } = await requireAdmin(request);
  // ... route logic
});
```

### Public Routes
Public routes can still benefit from error handling:
```typescript
import { withErrorHandler } from '~/server/middleware';

export const loader = withErrorHandler(async ({ request }) => {
  // ... route logic
});
```

## Architecture Patterns

### Service Layer Pattern
We use a service-based architecture for data management. Services encapsulate all API interactions and business logic.

```typescript
export class ProductService {
    private supabase: SupabaseClient;
    private currentSession: Session | null = null;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async fetchProducts(filters?: FilterOptions): Promise<Product[]> {
        let query = this.supabase
            .from('products')
            .select('*, images:product_images(*), variants:product_variants(*)');

        if (filters) {
            this.applyFilters(query, filters);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
}
```

### Component Architecture

#### Container Components
Handle data fetching, state management, and business logic:
```typescript
export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const productService = useProductService();

  useEffect(() => {
    const loadProducts = async () => {
      const data = await productService.fetchProducts(filterOptions);
      setProducts(data);
    };
    loadProducts();
  }, [filterOptions]);

  // Business logic methods
}
```

#### Presentational Components
Focus on UI rendering with minimal logic:
```typescript
interface ProductListProps {
  products: Product[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  return (
    <div className="grid gap-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
```

### Custom Hooks Pattern
Extract reusable logic into custom hooks:
```typescript
export function useVariants(productId: string) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const variantService = useVariantService();

  useEffect(() => {
    const loadVariants = async () => {
      const data = await variantService.getProductVariants(productId);
      setVariants(data);
      setLoading(false);
    };
    loadVariants();
  }, [productId]);

  const addVariant = async (data: VariantFormData) => {
    const newVariant = await variantService.createVariant(productId, data);
    setVariants([...variants, newVariant]);
  };

  return { variants, loading, addVariant };
}
```

## Feature Organization

### Feature Module Structure
Each feature follows this structure:
```
features/[feature-name]/
├── api/           # Feature-specific services and API calls
│   ├── services/  # Core service classes
│   └── utils/     # API utilities
├── components/    # Feature-specific UI components
│   ├── shared/    # Shared components within the feature
│   └── forms/     # Form components
├── hooks/         # Feature-specific React hooks
├── types/         # Feature-specific TypeScript types
└── utils/         # Feature-specific utilities
```

### Feature Component Examples
```typescript
// features/products/components/ProductManagement.tsx
import { ProductService } from '../api/productService';
import { useVariants } from '../hooks/useVariants';
import type { Product } from '../types/product.types';

export function ProductManagement() {
  // Component implementation
}
```

```typescript
// features/categories/components/CategoryManagement.tsx
import { CategoryService } from '../api/categoryService';
import { useCategories } from '../hooks/useCategories';
import type { Category } from '../types/category.types';

export function CategoryManagement({ categoryService }: { categoryService: CategoryService }) {
  const { categories, loading, error, refresh } = useCategories(categoryService);
  // Component implementation using the service and hook pattern
}
```

## State Management Patterns

### Local Component State
For UI-specific state:
```typescript
const [isOpen, setIsOpen] = useState(false);
const [activeTab, setActiveTab] = useState('basic');
```

### Service State
For data management through services:
```typescript
const productService = useProductService();
const { products, loading, error } = useProducts(productService);
```

### Form State
Using React Hook Form with Zod validation:
```typescript
const form = useForm<ProductFormData>({
  resolver: zodResolver(productFormSchema),
  defaultValues: {
    name: '',
    sku: '',
    price: '',
  },
});
```

## API Integration Patterns

### Service Class Methods
```typescript
export class ProductService {
  async createProduct(data: ProductFormData): Promise<Product> {
    const { data: product, error } = await this.supabase
      .from('products')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return product;
  }
}
```

### Error Handling Pattern
```typescript
try {
  const result = await this.supabase.from('products').select('*');
  if (result.error) throw result.error;
  return result.data;
} catch (error) {
  console.error('Error in fetchProducts:', error);
  throw new Error(`Failed to fetch products: ${error.message}`);
}
```

## Test Organization

### Feature Test Structure
Each feature follows this test organization:
```
features/[feature-name]/__tests__/
├── featureService.test.ts     # Service layer tests
├── FeatureForm.test.tsx      # Form component tests
├── FeatureList.test.tsx      # List component tests
└── FeatureManagement.test.tsx # Main component tests
```

### Service Tests Pattern
```typescript
describe('CategoryService', () => {
  let service: CategoryService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createClient('fake-url', 'fake-key');
    service = new CategoryService(mockSupabase);
  });

  describe('fetchCategories', () => {
    it('should fetch categories successfully', async () => {
      // Test implementation
    });

    it('should handle fetch error', async () => {
      // Error handling test
    });
  });
});
```

### Component Tests Pattern
```typescript
describe('CategoryForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders form correctly', () => {
    render(<CategoryForm onSubmit={mockOnSubmit} />);
    // Assertions
  });

  it('handles form submission', async () => {
    render(<CategoryForm onSubmit={mockOnSubmit} />);
    // User interactions and assertions
  });
});
```

### Integration Tests Pattern
```typescript
describe('CategoryManagement', () => {
  const mockCategoryService = {
    fetchCategories: vi.fn(),
    createCategory: vi.fn(),
    // Other mocked methods
  } as unknown as CategoryService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('integrates form and service correctly', async () => {
    render(<CategoryManagement categoryService={mockCategoryService} />);
    // Integration test assertions
  });
});
```

## Component Patterns

### Composition Pattern
```typescript
export function ProductForm({ onSubmit }: ProductFormProps) {
  return (
    <Form {...form}>
      <BasicInformation />
      <PriceInformation />
      <StockInformation />
      <VariantManagement />
      <ImageGallery />
    </Form>
  );
}
```

### Prop Types Pattern
```typescript
interface ProductCardProps {
    product: Product;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    variant?: 'default' | 'compact';
}
```

## File Naming Conventions

### Component Files
- PascalCase for component files: `ProductCard.tsx`
- Use `.tsx` extension for React components
- Use `.ts` extension for non-React files

### Feature Files
- camelCase for utility files: `productService.ts`
- Use descriptive suffixes: `product.types.ts`, `product.utils.ts`

### Test Files
- Add `.test` suffix: `ProductCard.test.tsx`
- Match source file name: `productService.test.ts`

## Import Organization

### Import Order
1. React and third-party libraries
2. Internal components and utilities
3. Types and interfaces
4. Styles

```typescript
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ProductCard } from './ProductCard';
import { useProductService } from '../hooks/useProductService';
import { formatPrice } from '../utils/formatters';

import type { Product, ProductFormData } from '../types/product.types';

import './ProductList.css';
```

## Best Practices

### Component Development
1. Use TypeScript for all components
2. Implement proper prop validation
3. Handle loading and error states
4. Follow accessibility guidelines
5. Use composition over inheritance
6. Keep components focused and small

### Service Development
1. Use class-based services for complex features
2. Implement proper error handling
3. Use TypeScript for type safety
4. Document public methods
5. Follow SOLID principles
6. Keep services focused on a single responsibility

### Hook Development
1. Follow the Rules of Hooks
2. Keep hooks focused and reusable
3. Handle cleanup in useEffect
4. Memoize callbacks and values appropriately
5. Document hook parameters and return values

### Type Safety
1. Use TypeScript for all files
2. Define clear interfaces
3. Use proper type guards
4. Avoid any type
5. Use generics where appropriate

### Testing
1. Write unit tests for utilities
2. Write integration tests for components
3. Test error cases
4. Mock external dependencies
5. Use testing library best practices

### Performance
1. Memoize expensive calculations
2. Use proper React hooks
3. Implement proper loading states
4. Handle pagination for large datasets
5. Optimize API calls

### Accessibility
1. Use semantic HTML
2. Add proper ARIA labels
3. Handle keyboard navigation
4. Ensure proper contrast
5. Test with screen readers

### Security
1. Always validate user permissions
2. Sanitize user input
3. Implement proper CORS headers
4. Follow security best practices
5. Use appropriate Content Security Policy
6. Implement rate limiting
7. Validate file uploads