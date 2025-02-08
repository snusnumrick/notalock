# Development Guidelines

## Core Development Principles

### Core Architecture
The project follows a service-based architecture with Supabase integration:

1. Authentication & Authorization
   - Use Supabase Auth for user management
   - Implement role-based access control (RBAC)
   - Use RLS policies for database security

2. Error Handling
   - Implement React error boundaries
   - Use custom error types
   - Proper error logging and monitoring

3. Image Management
   - Supabase Storage for image hosting
   - Multi-file upload with drag-and-drop
   - Image optimization and processing
   - Gallery management with reordering

4. Supabase Integration
   - Service-based data access patterns
   - Proper session management
   - Consistent error handling

## Feature Implementation

### Product Management
1. Product Structure
   - Implement proper variant management
   - Handle SKUs and inventory
   - Manage product categories
   - Support custom attributes

2. Search and Filtering
   - Implement advanced search
   - Support multiple filter criteria
   - Handle sorting options
   - Enable bulk operations

### Image Management
1. Upload Handling
   - Support multi-file uploads
   - Implement drag-and-drop
   - Handle file validation
   - Process images for optimization

2. Gallery Features
   - Enable image reordering
   - Support primary image selection
   - Implement zoom and lightbox
   - Mobile-friendly touch support

## Code Quality Tools

### TypeScript
- Strict mode enabled
- Custom path aliases configured (`~/*` maps to `./app/*`)
- Enhanced type checking with additional compiler options
- Proper type definitions for all services

### ESLint
- Run linting: `npm run lint`
- Fix linting issues: `npm run lint:fix`
- Additional rules for type safety
- Configured with recommended Remix settings

### Prettier
- Auto-formatting on commit
- 100 character line width
- Single quotes
- 2 space indentation

### Git Hooks (Husky)
- Pre-commit hooks for linting and formatting
- Type checking before commit
- Automated tests for critical paths
- Runs automatically on `git commit`

## Development Best Practices

### Route Implementation
1. Structure
   - Follow feature-based organization
   - Use TypeScript with proper type annotations
   - Implement Remix loader/action patterns
   - Keep components focused and reusable

2. Error Handling
   - Use React error boundaries
   - Implement proper try/catch in loaders/actions
   - Structured error responses
   - Proper error logging with context

3. Authentication
   - Use Supabase Auth consistently
   - Handle user roles properly
   - Implement proper redirects
   - Secure sensitive routes

4. Data Handling
   - Use Zod for validation
   - Handle edge cases
   - Implement proper error responses
   - Follow service patterns

### Component Development
1. Structure
   - Use Shadcn/UI components for consistent UI
   - Follow Tailwind CSS best practices
   - Implement proper TypeScript types
   - Use composition over inheritance
   - Maintain focused, reusable components

2. State Management
   - Use appropriate hooks
   - Handle loading states
   - Implement error states
   - Follow state patterns

3. Performance
   - Implement memoization
   - Use lazy loading
   - Optimize renders
   - Monitor bundle size

### Testing Strategy
1. Unit Tests
   - Test service layer functions
   - Test utility functions
   - Test custom hooks
   - Test component logic

2. Integration Tests
   - Test Supabase interactions
   - Test authentication flows
   - Test file upload processes
   - Test form submissions with validation

3. End-to-End Tests
   - Test product management workflows
   - Test image upload and gallery features
   - Test variant management
   - Test bulk operations
   - Test search and filtering

### Security Practices
1. Input Validation
   - Use Zod for data validation
   - Implement proper sanitization
   - Handle edge cases systematically
   - Follow security best practices

2. Authentication
   - Use Supabase Auth consistently
   - Implement proper session management
   - Role-based access control (RBAC)
   - Secure route protection

3. Data Protection
   - Implement Row Level Security (RLS)
   - Configure proper Supabase policies
   - Secure file uploads with validation
   - Regular security audits

## Development Workflow

### Branch Strategy
1. Feature Branches
   - Branch from `develop`
   - Follow naming convention
   - Keep changes focused
   - Regular updates from base

2. Pull Requests
   - Use PR template
   - Require reviews
   - Pass all checks
   - Clear description

### Commit Guidelines
1. Structure
   - Use conventional commits
   - Clear messages
   - Reference issues
   - Atomic commits

2. Quality Checks
   - Run tests
   - Check types
   - Run linting
   - Verify builds

### Code Review Process
1. Review Checklist
   - Verify proper service usage
   - Check error handling
   - Review security considerations
   - Validate test coverage
   - Check performance implications
   - Verify accessibility compliance

2. Documentation
   - Update relevant documentation
   - Add TypeScript doc comments
   - Update API documentation
   - Document service methods

## Component Patterns

### Service Layer Pattern
We use a service-based architecture for data management:

```typescript
export class ProductService {
    constructor(private supabase: SupabaseClient) {}

    async fetchProducts(filters?: FilterOptions): Promise<Product[]> {
        let query = this.supabase
            .from('products')
            .select('*, images:product_images(*), variants:product_variants(*)');

        if (filters) {
            query = this.applyFilters(query, filters);
        }

        const { data, error } = await query;
        if (error) throw new Error(`Failed to fetch products: ${error.message}`);
        
        return data;
    }

    async uploadImages(productId: string, files: File[]): Promise<UploadResult[]> {
        const results = await Promise.all(
            files.map(file => this.uploadSingle(productId, file))
        );
        return results;
    }
}
```

### Feature Components
Handle data fetching and business logic using services:

```typescript
export function ProductManagement() {
    const productService = useProductService();
    const imageService = useImageService();
    const { products, isLoading, error } = useProducts();
    const { handleUpload } = useImageUpload();

    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            variants: [],
            images: []
        }
    });

    return (
        <div className="space-y-6">
            <ProductForm form={form} onSubmit={handleSubmit}>
                <ImageGallery 
                    images={product.images}
                    onUpload={handleUpload}
                    onReorder={handleReorder}
                />
                <VariantManager 
                    variants={product.variants}
                    onChange={handleVariantChange}
                />
            </ProductForm>
        </div>
    );
}
```

### Custom Hooks Pattern
Extract reusable logic into custom hooks:

```typescript
export function useProducts(filters?: FilterOptions) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const productService = useProductService();

    useEffect(() => {
        const loadProducts = async () => {
            try {
                setIsLoading(true);
                const data = await productService.fetchProducts(filters);
                setProducts(data);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to load products'));
            } finally {
                setIsLoading(false);
            }
        };

        loadProducts();
    }, [filters]);

    return { products, isLoading, error };
}
```

### Form Patterns
Using React Hook Form with Zod validation:

```typescript
const productSchema = z.object({
    name: z.string().min(3),
    sku: z.string().regex(/^[A-Z0-9-]+$/),
    variants: z.array(variantSchema).optional(),
    images: z.array(imageSchema)
});

export function ProductForm({ onSubmit }: ProductFormProps) {
    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            sku: '',
            variants: [],
            images: []
        }
    });

    return (
        <Form {...form}>
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {/* Other form fields */}
        </Form>
    );
}
```

## File Organization

### Feature Module Structure
```
features/[feature-name]/
├── api/
│   ├── services/    # Core service classes
│   └── utils/       # API utilities
├── components/
│   ├── shared/      # Shared components
│   └── forms/       # Form components
├── hooks/           # Feature-specific hooks
├── types/           # TypeScript types
└── utils/          # Feature utilities
```

### Import Organization
```typescript
// 1. React and core libraries
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// 2. UI Components
import { Form, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// 3. Feature components
import { ProductGallery } from './components/ProductGallery';
import { VariantManager } from './components/VariantManager';

// 4. Services and hooks
import { useProductService } from '../../hooks/useProductService';
import { useImageUpload } from '../../hooks/useImageUpload';

// 5. Types and utilities
import type { Product, ProductFormData } from '../../types';
import { formatPrice } from '../../utils/formatters';
```

## Performance Considerations

### Component Performance
1. Memoization
   - Use React.memo for expensive renders
   - Memoize callbacks with useCallback
   - Cache values with useMemo
   - Implement proper dependency arrays

2. Image Optimization
   - Use responsive images
   - Implement lazy loading
   - Optimize image formats
   - Use appropriate image sizes

3. Bundle Optimization
   - Use code splitting
   - Implement dynamic imports
   - Monitor bundle size
   - Optimize dependencies

### Database Performance
1. Query Optimization
   - Use proper indexes
   - Optimize joins
   - Implement pagination
   - Cache frequent queries

2. RLS Policy Design
   - Keep policies simple
   - Avoid complex joins in policies
   - Use proper indexes for policy conditions
   - Regular performance monitoring