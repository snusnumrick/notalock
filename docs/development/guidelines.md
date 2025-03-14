# Development Guidelines

## Remix Architecture Principles

### Nested Route Pattern with Outlet

In Remix, parent routes must include an `<Outlet />` component to render their child routes. Without this, child routes won't render even though their loaders may execute.

```tsx
// Parent route: app/routes/admin.products.tsx
import { Outlet, useLoaderData, useLocation } from '@remix-run/react';

export default function AdminProductsPage() {
  const { products } = useLoaderData<typeof loader>();
  const location = useLocation();
  
  return (
    <div className="container py-8">
      <h2 className="text-2xl font-bold">Products</h2>
      
      {/* Conditional rendering based on path */}
      {location.pathname === '/admin/products' ? (
        <ProductList products={products} />
      ) : (
        <Outlet /> {/* This is required to render child routes */}
      )}
    </div>
  );
}
```

**Common issues to watch for:**
- Parent routes without an `<Outlet />` will not render child routes
- Child route loaders may run successfully but their components won't render
- Use conditional rendering with `useLocation()` when you want different behavior for index vs. child routes

### Route Module Pattern
```typescript
// app/routes/admin.categories._index.tsx
import type { LoaderArgs, ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { CategoryList } from "~/features/categories/components/CategoryList";
import { categoryLoader } from "~/features/categories/api/loaders";
import { categoryAction } from "~/features/categories/api/actions";

export const loader = async ({ request }: LoaderArgs) => {
  return categoryLoader(request);
};

export const action = async ({ request }: ActionArgs) => {
  return categoryAction(request);
};

export default function CategoriesAdmin() {
  const { categories } = useLoaderData<typeof loader>();
  return <CategoryList categories={categories} />;
}
```

### Data Loading Pattern
```typescript
// app/features/categories/api/loaders.ts
import { json } from "@remix-run/node";
import type { LoaderArgs } from "@remix-run/node";
import { categoryService } from "../services/categoryService";

export async function categoryLoader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const highlighted = url.searchParams.get("highlighted") === "true";
  
  const categories = await categoryService.fetchCategories({ highlighted });
  return json({ categories });
}
```

## Core Development Principles

### Remix-specific Patterns
1. Data Loading
   - Use loaders for data fetching
   - Handle loading states with useTransition
   - Implement proper error boundaries
   - Use optimistic UI updates

2. Form Handling
   - Use Remix Form component
   - Implement proper validation
   - Handle pending states
   - Use action functions

3. Error Handling
   - Implement error boundaries
   - Use catch boundaries
   - Handle loading states
   - Proper error responses

### Component Development
1. Structure
   - Use Shadcn/UI components
   - Follow Tailwind CSS practices
   - Implement TypeScript types
   - Use Remix utilities

2. State Management
   - Use Remix form state
   - Handle transitions
   - Implement fetchers
   - Use proper hooks

## Authentication and Session Management

### Standardized Authentication Pattern

All admin routes and API services should use the standard authentication middleware:

```typescript
import { requireAdmin } from '~/server/middleware/auth.server';

// In admin route loaders
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { user, response } = await requireAdmin(request);
    const supabase = createSupabaseClient(request, response);
    
    // Fetch data using supabase
    const { data } = await supabase.from('resource').select('*');
    
    return json({ data }, {
      headers: response.headers // Important: include response headers for auth cookies
    });
  } catch (error) {
    // Handle redirects from auth middleware
    if (error instanceof Response) {
      throw error;
    }
    // Handle other errors
    return json({ error: 'Failed to load data' }, { status: 500 });
  }
};

// In API action handlers
export async function resourceAction({ request, response }: ActionArgs) {
  try {
    const { user } = await requireAdmin(request);
    const formData = await request.formData();
    
    // Process action with authenticated user
    // ...
    
    return json({ success: true }, {
      headers: response.headers // Important: include response headers
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Let redirect responses pass through
    }
    
    return json({ error: 'Action failed' }, { status: 500 });
  }
}
```

> **Important:** Always use the `requireAdmin` function from `~/server/middleware/auth.server`. Do not use any functions from `~/utils/auth.server` as they are deprecated.

### Anti-patterns to Avoid

1. Authentication Implementation
   - ❌ Don't use deprecated auth utilities from `~/utils/auth.server`
   - ❌ Don't implement custom authentication logic when middleware exists
   - ❌ Don't forget to include `response.headers` in json responses
   - ❌ Don't mix different authentication approaches across routes

2. Session Management
   - ❌ Don't create separate Supabase client instances unnecessarily
   - ❌ Don't fetch session state multiple times in the same request
   - ❌ Don't implement ad-hoc permission checks instead of using middleware
   - ❌ Don't ignore potential response redirects from auth middleware

3. Common Pitfalls
   - Missing error handling for auth middleware redirects
   - Forgetting to pass response headers in json responses
   - Creating duplicate auth checking logic across routes
   - Using inconsistent authentication patterns across the application

### Authentication Checklist

Before implementing authentication in a feature:

✓ Authentication Implementation
  - [ ] Using `requireAdmin` from `~/server/middleware/auth.server`
  - [ ] Proper error handling for redirects in try/catch blocks
  - [ ] Response headers included in all json responses
  - [ ] Consistent pattern across all route handlers

✓ Session Management
  - [ ] Single Supabase client instance per request
  - [ ] Session handled by middleware, not custom logic
  - [ ] Clear error messages for authentication failures
  - [ ] Proper handling of auth state in the UI

✓ Security Considerations
  - [ ] Proper RLS policies in place
  - [ ] Appropriate route protection
  - [ ] CSRF protection
  - [ ] No sensitive data exposed to unauthorized users

## Features Implementation

### Categories Feature
1. Route Components:
   - `admin.categories._index.tsx`: Category list route
   - `admin.categories.$id.tsx`: Category edit route
   - `categories._index.tsx`: Public category listing
   - `categories.$slug.tsx`: Category detail page

2. Feature Components:
   - `CategoryForm`: Form for creating/editing
     - Handle validation
     - Use Remix Form
     - Manage image uploads
   
   - `CategoryList`: Display categories
     - Support sorting/filtering
     - Use loader data
     - Handle transitions
   
   - `CategoryHighlightGrid`: Highlighted categories
     - Grid/list views
     - Responsive layouts
     - Loading states
     - Empty states

## Configuration Management

### Centralized Configuration

Configuration values should be centralized in the `app/config/` directory:

```typescript
// app/config/pagination/constants.ts
export const DEFAULT_PAGE_LIMIT = 12;
export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];
export const MAX_PAGE_LIMIT = 100;
```

### Usage in Components and API Calls

```typescript
import { DEFAULT_PAGE_LIMIT } from '~/config/pagination';

// Form data with pagination
const formData = new FormData();
formData.set('limit', DEFAULT_PAGE_LIMIT.toString());

// URL parameters
const buildQueryParams = (baseUrl: string) => {
  const url = new URL(baseUrl);
  url.searchParams.set('limit', DEFAULT_PAGE_LIMIT.toString());
  return url;
};
```

### Configuration Guidelines

1. **Organization**
   - Group related configuration by feature or function
   - Use dedicated directories for complex configuration sets
   - Export constants with clear, descriptive names

2. **Naming Conventions**
   - Use UPPERCASE for constant values
   - Use PascalCase for configuration objects or classes
   - Include type and units in the name when applicable

3. **Documentation**
   - Add JSDoc comments explaining purpose and usage
   - Document units of measurement where applicable
   - Note any related configuration parameters

4. **Best Practices**
   - Never hardcode configuration values in components or functions
   - Use TypeScript types for complex configuration objects
   - Provide sensible defaults for all configuration values
   - Keep configuration separate from implementation logic

5. **Common Configuration Types**
   - Pagination limits and options
   - Cache durations
   - Feature flags
   - API endpoint configuration
   - UI customization options

### Anti-patterns to Avoid

- ❌ Duplicating configuration values across multiple files
- ❌ Hardcoding numeric values without explanation
- ❌ Mixing configuration with business logic
- ❌ Using undocumented "magic numbers" in code
- ❌ Inconsistent naming between related configuration values

## Code Patterns

### Loader Pattern
```typescript
// app/features/categories/api/loaders.ts
import { json } from "@remix-run/node";
import type { LoaderArgs } from "@remix-run/node";

export async function highlightedCategoriesLoader({ request }: LoaderArgs) {
  const url = new URL(request.url);
  const view = url.searchParams.get("view") || "grid";
  
  const categories = await categoryService.fetchHighlightedCategories();
  return json({ categories, view });
}
```

### Component with Loader Data
```typescript
import { useLoaderData } from "@remix-run/react";
import type { loader } from "~/routes/categories._index";

export function CategoryHighlightGrid() {
  const { categories, view } = useLoaderData<typeof loader>();
  const transition = useTransition();
  
  return (
    <div className={getLayoutClass(view)}>
      {transition.state === "loading" ? (
        <CategoryHighlightSkeleton />
      ) : (
        // Render categories
      )}
    </div>
  );
}
```

## Data Flow and Serialization in Remix

### Direct vs. Nested Data Loading

When fetching data in Remix route loaders, prefer direct service calls over nested loader functions to avoid serialization issues.

```typescript
// Recommended: Direct service call in route loader
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const service = getService(request, response);
  const data = await service.fetchData();
  
  return json({ data });
};

// Avoid: Nested loader calls that return Response objects
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { data } = await nestedLoader({ request, response: new Response() });
  
  return json({ data }); // Data might not serialize correctly
};
```

### Debugging Data Flow Issues

When components aren't rendering data properly, use strategic console logging to identify where the data flow breaks down:

1. Log data in the server-side loader
2. Log data in the client-side component
3. Compare the data structure between server and client

```typescript
// In the loader (server-side)
console.log('Server data:', data);

// In the component (client-side)
const { data } = useLoaderData<typeof loader>();
console.log('Client data:', data);
```

### Common Serialization Issues

- **Dates**: JSON serialization converts dates to strings
- **Binary data**: Cannot be properly serialized in JSON
- **Circular references**: Will cause serialization errors
- **Custom class instances**: Only serialized as plain objects
- **Functions**: Cannot be serialized
- **Response objects**: May not properly extract nested data

### Best Practices for Data Flow

1. Keep data structures simple and serializable
2. Use direct service calls in route loaders
3. Transform data into serializable format before returning from loaders
4. Verify data flow with strategic console logging when troubleshooting
5. Use TypeScript to ensure data shape consistency
6. Consider using serialization libraries for complex data types

### Anti-patterns to Avoid

- ❌ Nested loader functions that return Response objects
- ❌ Custom class instances in loader data
- ❌ Circular references in data structures
- ❌ Assuming data structure on client matches server exactly without verification
- ❌ Complex nested data transformations that might break during serialization

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


## Cursor-Based Pagination Patterns

### Key Principles
1. Sorting and Ordering
   - Always include explicit sorting rules with nulls handling
   ```typescript
   // Good
   query.order('column', { ascending: false, nullsLast: true })
   
   // Bad - doesn't handle nulls consistently
   query.order('column', { ascending: false })
   ```

   - Include secondary sorts for stable ordering
   ```typescript
   // Good - stable ordering with timestamp and ID
   query.order('created_at', { ascending: false, nullsLast: true })
       .order('id', { ascending: true })
   
   // Bad - unstable ordering
   query.order('created_at', { ascending: false })
   ```

2. Cursor Conditions
   - Match cursor conditions exactly to sort order
   ```typescript
   // Good - matches sorting order exactly
   productsQuery.or(
     `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.gt.${cursor.id})`
   )

   // Bad - inconsistent with sort order
   productsQuery.gt('id', cursor.id)
   ```

   - Handle multi-field sorting properly
   ```typescript
   // Good - handles featured status and creation date
   productsQuery.or(
     `featured.eq.${cursor.featured},and(created_at.lt.${cursor.created_at}),` +
     `and(featured.eq.${cursor.featured},created_at.eq.${cursor.created_at},id.gt.${cursor.id})`
   )
   ```

3. Cursor Data
   - Always provide defaults for nullable fields
   ```typescript
   const cursorData = {
     id: lastProduct.id,
     retail_price: lastProduct.price || 0,
     created_at: lastProduct.created_at || new Date().toISOString(),
     featured: !!lastProduct.featured
   };
   ```

   - Include all fields needed for sorting
   - Convert values to appropriate types
   - Handle undefined/null values consistently

### Anti-patterns to Avoid
- ❌ Mixing ascending/descending orders without proper cursor conditions
- ❌ Missing secondary sort orders for stability
- ❌ Inconsistent null handling in sort orders
- ❌ Cursor conditions that don't match sort order
- ❌ Nullable fields in cursor data without defaults

4. RLS Policy Design
   - Keep policies simple
   - Avoid complex joins in policies
   - Use proper indexes for policy conditions
   - Regular performance monitoring

## Related Documents
- [Error Handling Guidelines](./error-handling.md)
- [Testing Guidelines](./testing.md)