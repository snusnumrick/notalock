# Development Guidelines

## Remix Architecture Principles

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

### Features Implementation

#### Categories Feature
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

## Performance Guidelines

### Remix-specific Optimization
1. Data Loading
   - Use proper caching headers
   - Implement resource routes
   - Use parallel data loading
   - Handle pending states

2. Form Submissions
   - Use optimistic updates
   - Handle concurrent submissions
   - Implement proper validation
   - Use transitions

3. Asset Handling
   - Use resource routes
   - Implement proper caching
   - Handle static assets
   - Optimize bundle size

## Testing Strategy

### Route Testing
```typescript
import { createRemixStub } from "@remix-run/testing";
import { render, screen } from "@testing-library/react";

test("categories route", async () => {
  const RemixStub = createRemixStub([
    {
      path: "/categories",
      Component: CategoriesRoute,
      loader: categoriesLoader,
    },
  ]);

  render(<RemixStub />);
  
  expect(await screen.findByRole("heading")).toHaveTextContent("Categories");
});
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