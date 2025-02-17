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

## Testing Guidelines

### Key Testing Principles

> Note: When running tests that verify error handling, you may see error messages in stderr. This is expected behavior when testing error paths and does not indicate test failures. We intentionally keep these messages visible because:
> - They provide visibility into error handling behavior during test runs
> - They serve as a live example of what errors look like in production
> - They help catch changes in error handling behavior
> - They make it easier to debug when real errors occur
>   
> If these messages ever make it difficult to spot real test issues, we can add console.error mocking to suppress them.

1. Mock Chain Management
   - Ensure mock chains match actual API call structure
   - Mock each level of the chain properly (e.g., from -> select -> order -> eq)
   - Be explicit about return values at each chain level
   - Use mockReturnThis() for method chaining and mockReturnValue() for final values

2. Test Organization
   - Separate UI tests (.tsx) from service tests (.ts)
   - Keep UI tests focused on component behavior rather than framework specifics
   - Break down complex tests into smaller, focused test cases
   - Group related tests using describe blocks

3. Framework Dependencies
   - Be cautious with framework-specific testing utilities
   - Consider simpler alternatives when possible
   - Have fallback testing strategies when framework tools aren't available
   - Make UI components more testable by reducing framework coupling

4. Common Pitfalls to Avoid
   - Don't assume query chain methods exist without mocking them
   - Don't mix JSX/TSX in .ts files
   - Don't overcomplicate mocks - start simple and add complexity as needed
   - Don't test framework behavior, focus on your code's behavior

5. Best Practices
   - Clear test descriptions that explain what's being tested
   - Proper setup and teardown in beforeEach
   - Mock data that represents realistic scenarios
   - Test both success and error cases
   - Verify all parts of complex operations

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