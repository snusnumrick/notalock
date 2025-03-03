# Category Data Migration

This document explains the migration from hardcoded categories to database-driven categories in the Notalock application.

## Overview

Previously, categories were hardcoded in `app/data/categories.ts` as a static array. This approach had several limitations:

1. Categories couldn't be managed by administrators through the UI
2. Changes required code updates and deployments
3. No support for dynamic category attributes like visibility and highlighting

The new approach fetches categories from the Supabase database, providing a more flexible and maintainable solution.

## Implementation Details

### Category Data Structure

The application uses two different category interfaces:

1. **App-level Category Interface** (`app/types/category.types.ts`):
   ```typescript
   export interface Category {
     id: string;
     name: string;
     slug: string;
     description?: string;
     imageUrl?: string;
     children?: Category[];
   }
   ```

2. **Database-level Category Interface** (from `getCategories` function):
   ```typescript
   interface Category {
     id: string;
     name: string;
     slug: string;
     description?: string;
     parentId?: string | null;
     position: number;
     isActive: boolean;
     sortOrder: number;
     isVisible: boolean;
     status: string;
     isHighlighted: boolean;
     highlightPriority: number;
     children?: Category[];
   }
   ```

The mapping between these formats is handled by the `mapDbCategoryToAppCategory` function in `app/data/categories.ts`.

### Key Files

1. **Categories Server API** (`app/features/categories/api/categories.server.ts`):
   - Contains the `getCategories` function that fetches from the database
   - Handles filtering, sorting, and hierarchy options

2. **Categories Data Module** (`app/data/categories.ts`):
   - Uses the existing `getCategories` function 
   - Provides mapping to transform database records to app format
   - Includes a caching mechanism for performance
   - Maintains the hardcoded categories for backward compatibility

### Database Schema

Categories are stored in the `categories` table with the following schema:

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
    status VARCHAR,
    is_highlighted BOOLEAN NOT NULL DEFAULT false,
    highlight_priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Usage Examples

### In Route Loaders

The `productsLoader` already includes categories from the database:

```typescript
// Inside app/features/products/api/loaders.ts
export async function productsLoader({ request }: LoaderFunctionArgs) {
  // ...
  const [productsData, categories] = await Promise.all([
    getProducts({
      limit,
      cursor,
      filters,
      isAdmin: false,
    }),
    getCategories({ activeOnly: true }),
  ]);
  
  // ...
  
  return {
    // ...
    categories: categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
    })),
  };
}
```

### In Components (Using Route Data)

```typescript
import { useRouteLoaderData } from '@remix-run/react';

function CategorySelector() {
  const loaderData = useRouteLoaderData('routes/products') as { categories?: any[] } || {};
  const { categories = [] } = loaderData;
  
  return (
    <select>
      {categories.map(category => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}
```

### Direct Data Access (Server-side Only)

```typescript
import { fetchCategoriesFromDb } from '~/data/categories';

// Server-side code only
async function processCategoryData() {
  const categories = await fetchCategoriesFromDb({
    activeOnly: true,
    includeChildren: true
  });
  // Process categories...
}
```

## Caching

The implementation includes a simple in-memory caching mechanism to improve performance:

- Cache TTL: 5 minutes
- Implemented in `getCachedCategories` function
- Automatically invalidated on timer

In the future, this should be replaced with a more robust caching solution.

## Backward Compatibility

For backward compatibility during the transition period, the original hardcoded categories are still exported from `app/data/categories.ts`. Components should be updated to use the dynamic functions instead of importing the static array.

## Migration Strategy

1. For new components, use the database-driven categories directly
2. For existing components that import the hardcoded array:
   - When feasible, update to use the `fetchCategoriesFromDb` function
   - If not feasible, the hardcoded export will remain available

## Future Improvements

1. Implement proper Redis or similar caching for categories
2. Add invalidation hooks when categories are updated in admin panel
3. Remove the hardcoded categories export once all components are updated
4. Add image support for categories with CDN integration
