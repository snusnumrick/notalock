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

## Authentication and Session Management

### Session Handling Best Practices

1. Cookie Management
   - Always use `getAll` and `setAll` for cookie handling with Supabase SSR
   - Implement proper cookie attributes (SameSite, Secure, path)
   - Handle cookie expiration appropriately

2. Session State
   - Maintain single source of truth for session state
   - Pass session down from loaders to components
   - Avoid duplicate session management in components
   - Use session from loader instead of fetching again

3. Component Architecture
   ```typescript
   // Route level - Handle session management here
   export const loader = async ({ request }: LoaderFunctionArgs) => {
     const { user, response } = await requireAdmin(request);
     const supabase = createSupabaseClient(request, response);
     const { data: { session } } = await supabase.auth.getSession();
     
     return json({ session });
   };

   // Component level - Receive and use session
   function MyComponent({ initialSession }: { initialSession: Session }) {
     const supabase = useMemo(() => createBrowserClient(url, key, {
       cookies: {
         getAll: () => { /* ... */ },
         setAll: cookies => { /* ... */ }
       }
     }), []);

     // Pass session to service
     const service = useMemo(
       () => new MyService(supabase, initialSession),
       [supabase, initialSession]
     );
   }

   // Service level - Use provided session
   class MyService {
     constructor(
       private supabase: SupabaseClient,
       private session: Session
     ) {}

     async doSomething() {
       // Use this.session directly, don't fetch it again
     }
   }
   ```

### Anti-patterns to Avoid

1. Session Management
   - ❌ Don't mix client-side and server-side session management
   - ❌ Don't call `getSession()` in components when session is available from loader
   - ❌ Don't have services fetch their own session state
   - ❌ Don't create multiple independent Supabase clients with different session states

2. Common Pitfalls
   - Avoid infinite refresh loops from session updates
   - Prevent "No active session found" errors by proper session passing
   - Eliminate redundant session fetching
   - Handle cookie expiration properly

### Authentication Checklist

Before implementing authentication in a feature:

✓ Session Management
  - [ ] Session is passed down from loader
  - [ ] Single source of truth for session state
  - [ ] Proper cookie handling configuration
  - [ ] Clear separation of server/client session management

✓ Component Structure
  - [ ] Components receive session via props
  - [ ] Services receive session in constructor
  - [ ] Proper error handling for session issues
  - [ ] Loading states during authentication

✓ Security Considerations
  - [ ] Proper RLS policies in place
  - [ ] Session timeout handling
  - [ ] Secure cookie configuration
  - [ ] CSRF protection

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

1. Test Setup Organization
   - Keep mock data constants at the top level for reusability
   - Create helper functions for common mock setups
   - Avoid duplicating mock setup logic
   - Use descriptive names for mock data and helper functions

2. Component Lifecycle Testing
   - Test cleanup and unmount behavior explicitly
   - Verify subscriptions are properly cleaned up
   - Test component initialization and state management
   - Ensure proper handling of side effects

3. Component Interactions
   - Test the actual user flows and interactions
   - Verify state changes after user actions
   - Test form interactions and validation
   - Check conditional rendering based on user actions

4. API and Database Testing
   - Mock complete API call chains
   - Test both success and error paths
   - Verify data transformations
   - Test complex database operations
   - Handle relationships between entities

> Note: When running tests that verify error handling, you may see error messages in stderr. This is expected behavior when testing error paths and does not indicate test failures.

### Mock Management

1. Mock Chain Management
   - Ensure mock chains match actual API call structure
   - Mock each level of the chain properly (e.g., from -> select -> order -> eq)
   - Be explicit about return values at each chain level
   - Use mockReturnThis() for method chaining and mockReturnValue() for final values

2. Supabase Query Mocking
   ```typescript
   // Mock builder for successful operations
   const successBuilder = {
     update: vi.fn().mockReturnThis(),
     select: vi.fn().mockReturnThis(),
     eq: vi.fn().mockReturnThis(),
     single: vi.fn().mockResolvedValue({
       data: mockData,
       error: null
     }),
   };

   // Mock builder for failed operations
   const errorBuilder = {
     update: vi.fn().mockReturnThis(),
     eq: vi.fn().mockResolvedValue({
       data: null,
       error: new Error('Operation failed')
     }),
   };

   // Handle different tables in one test
   mockClient.from.mockImplementation((table) => {
     return table === 'products' 
       ? productsBuilder 
       : categoriesBuilder;
   });
   ```

3. Test Organization
   - Separate UI tests (.tsx) from service tests (.ts)
   - Keep UI tests focused on component behavior
   - Break down complex tests into smaller, focused test cases
   - Group related tests using describe blocks

4. Framework Dependencies
   - Be cautious with framework-specific testing utilities
   - Consider simpler alternatives when possible
   - Have fallback testing strategies
   - Make UI components more testable

5. Asynchronous Testing
   - Use `waitFor` for async operations only
   - Keep one assertion per `waitFor`
   - Make synchronous assertions outside of `waitFor`
   - Test loading states and transitions

### Best Practices

1. Test Structure
   ```typescript
   describe('ServiceName', () => {
     // Top-level mock data
     const mockData = {...};

     // Reusable mock builders
     const createMockBuilder = () => ({...});

     let service;
     let mockClient;

     beforeEach(() => {
       mockClient = createMockBuilder();
       service = new Service(mockClient);
     });

     describe('operationName', () => {
       it('succeeds with valid input', async () => {...});
       it('handles errors properly', async () => {...});
       it('manages related entities', async () => {...});
     });
   });
   ```

2. Common Pitfalls to Avoid
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

### Mock Setup Example
```typescript
// Good: Top-level mock data
const mockCategories = [
  { id: 'cat1', name: 'Category 1' },
  { id: 'cat2', name: 'Category 2' },
];

// Good: Helper function for creating mocks
const createMockSupabaseClient = () => ({
  auth: {
    setSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    }),
  },
  // ... other methods
});

// Good: Reusable setup in beforeEach
beforeEach(() => {
  vi.clearAllMocks();
  mockSupabaseClient = createMockSupabaseClient();
  (CategoryService as any).mockImplementation(() => ({
    fetchCategories: vi.fn().mockResolvedValue(mockCategories)
  }));
});
```

### Component Testing Example
```typescript
describe('Component Interactions', () => {
  it('loads categories when opening product form', async () => {
    render(<ProductManagement {...props} />);

    // Test user interaction
    const addButton = screen.getByText('Add Product');
    fireEvent.click(addButton);

    // Verify conditional rendering
    await waitFor(() => {
      const categorySelect = screen.getByLabelText('Categories');
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveTextContent('Category 1');
    });
  });

  it('properly cleans up subscriptions', () => {
    const unsubscribe = vi.fn();
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } }
    });

    const { unmount } = render(<ProductManagement {...props} />);
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
```

### Testing Loading and Error States
```typescript
// Bad: Immediate rejection prevents testing loading state
const mockFetch = vi.fn().mockRejectedValue(new Error('Failed'));

// Bad: setTimeout can be flaky
const mockFetch = vi.fn().mockImplementation(() => 
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Failed')), 100);
  })
);

// Good: Controlled timing with deferred promise
let rejectFn: (error: Error) => void;
const fetchPromise = new Promise((_, reject) => {
  rejectFn = reject;
});

const mockFetch = vi.fn().mockImplementation(() => fetchPromise);

// Test can now verify loading state
await screen.findByText('Loading...');

// Then trigger error
rejectFn!(new Error('Failed'));
```

### Dialog Testing Best Practices
```typescript
// Bad: Immediately looking for dialog content
fireEvent.click(openButton);
expect(screen.getByText('Dialog Content')).toBeInTheDocument();

// Good: Wait for dialog to mount and then find content
fireEvent.click(openButton);
await waitFor(() => {
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

// Better: Use dialog title as mount indicator
fireEvent.click(openButton);
await waitFor(() => {
  expect(screen.getByText('Dialog Title')).toBeInTheDocument();
});

// Best: Scope queries to dialog content
fireEvent.click(openButton);
await waitFor(() => {
  expect(screen.getByText('Dialog Title')).toBeInTheDocument();
});

const dialog = screen.getByRole('dialog');
const loadingState = within(dialog).getByText('Loading...');
expect(loadingState).toHaveClass('text-gray-500');
```

### Element Selection Best Practices
```typescript
// Bad: Too generic, might match wrong element
expect(screen.getByText('Loading...')).toBeInTheDocument();

// Good: More specific, uses CSS classes to ensure correct element
const loadingText = screen.getByText('Loading...', { 
  selector: '.text-sm.text-gray-500' 
});
expect(loadingText).toBeInTheDocument();

// Good: Uses combination of text and role
const submitButton = screen.getByRole('button', { 
  name: /submit/i 
});

// Good: Uses form labels for inputs
const emailInput = screen.getByLabelText('Email address');
```

### Asynchronous Testing Example
```typescript
// Bad: Multiple assertions in waitFor
it('loads data', async () => {
  render(<MyComponent />);
  await waitFor(() => {
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});

// Good: Single assertions and clear async/sync separation
it('loads data', async () => {
  render(<MyComponent />);
  
  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  // Make synchronous assertions after loading
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  const items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(3);
});
```

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