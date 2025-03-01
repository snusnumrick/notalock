# Testing Guidelines

## Key Testing Principles

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

## Mock Management

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

## Best Practices

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

3. Avoiding Common React Testing Issues
    - **Avoid Circular Dependencies in Mocks**: Import modules before mocking them, not after
    - **Simplify Mock Implementations**: Use simple, direct mocks instead of complex chains
    - **Use Flexible Text Matching**: Prefer regex or custom matchers over exact text matching
    - **Favor Semantic HTML**: Use proper semantic elements and ARIA roles for better accessibility
    - **Test Behavior, Not Implementation**: Focus on user-facing functionality, not internal details

4. Detailed Examples of Testing Patterns

   a. **Avoiding Circular Dependencies in Mocks**
   ```typescript
   // BAD: Creating circular dependencies by importing after mocking
   vi.mock('~/components/ui/input');
   import { Input } from '~/components/ui/input'; // DON'T do this!
   
   // GOOD: Import what you need first, then mock
   import { Input } from '~/components/ui/input';
   vi.mock('~/components/ui/input');
   
   // BETTER: Don't import modules you're mocking completely
   vi.mock('~/components/ui/input', () => ({
     Input: ({ value, onChange, ...props }) => (
       <input value={value} onChange={onChange} {...props} />
     )
   }));
   ```

   b. **Simplifying Mock Implementations**
   ```typescript
   // BAD: Overly complex mocks with unnecessary functions
   vi.mock('~/components/ui/input', () => ({
     Input: vi.fn().mockImplementation(({ value, onChange }) => {
       const handleChange = (e) => { 
         // Complex logic here
         onChange(e);
       };
       return <input value={value} onChange={handleChange} />;
     })
   }));
   
   // GOOD: Simple, direct mocks
   vi.mock('~/components/ui/input', () => ({
     Input: ({ value, onChange, ...props }) => (
       <input value={value} onChange={onChange} {...props} />
     )
   }));
   ```

   c. **Using Flexible Text Matching**
   ```typescript
   // BAD: Brittle exact text matching
   expect(screen.getByText('$99.99')).toBeInTheDocument();
   
   // GOOD: Regex for more flexible matching
   expect(screen.getByText(/99\.99/)).toBeInTheDocument();
   
   // BETTER: Custom matcher for complex scenarios
   const priceElement = screen.getByText((content, element) => {
     return content.includes('99.99') && 
            element.classList.contains('text-blue-600');
   });
   expect(priceElement).toBeInTheDocument();
   ```

   d. **Semantic HTML in Components**
   ```typescript
   // BAD: Generic divs for lists
   <div className="grid grid-cols-3 gap-4">
     {items.map(item => (
       <div key={item.id}>{item.name}</div>
     ))}
   </div>
   
   // GOOD: Semantic HTML with proper roles
   <ul className="grid grid-cols-3 gap-4" role="list">
     {items.map(item => (
       <li key={item.id}>{item.name}</li>
     ))}
   </ul>
   ```

   e. **Testing Behavior, Not Implementation**
   ```typescript
   // BAD: Testing implementation details
   expect(component.find('div').at(3).hasClass('text-red-500')).toBe(true);
   
   // GOOD: Testing user-facing behavior
   expect(screen.getByText('Error message')).toHaveClass('text-red-500');
   ```

5. Best Practices
    - Clear test descriptions that explain what's being tested
    - Proper setup and teardown in beforeEach
    - Mock data that represents realistic scenarios
    - Test both success and error cases
    - Verify all parts of complex operations

## Mock Setup Example
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

## Testing Loading and Error States
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

## Dialog Testing Best Practices
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

## Element Selection Best Practices
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

## Singleton Pattern Testing
```typescript
// Testing a singleton service
describe('SingletonService', () => {
  beforeEach(() => {
    // Clear singleton instance before each test
    (getService as any).instance = null;
    // Reset mock call counts
    createMockService.mockClear();
  });

  it('should reuse the same instance', () => {
    // First call creates instance
    const firstInstance = getService();
    
    // Clear mocks after first instance creation
    createMockService.mockClear();

    // Second call should reuse instance
    const secondInstance = getService();

    // Verify instance was reused
    expect(firstInstance).toBe(secondInstance);
    expect(createMockService).not.toHaveBeenCalled();
  });
});
```

Key points for testing singletons:
- Clear the singleton instance before each test
- Track mock calls correctly by clearing at the right time
- Verify both instance creation and reuse
- Avoid clearing mocks too early

## Asynchronous Testing Example
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

## Route Testing
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

## Testing Remix Components

### Current Approach
Currently, we test Remix components by mocking the necessary Remix imports directly:

```typescript
// Mock the Link component from Remix
vi.mock('@remix-run/react', () => ({
  Link: ({ to, children, className }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  // Mock other Remix components/hooks as needed
  useLoaderData: vi.fn(),
  useActionData: vi.fn(),
  Form: ({ children, method, action, onSubmit }) => (
    <form method={method} action={action} onSubmit={onSubmit}>
      {children}
    </form>
  )
}));

// Then in your test
test("component with Remix dependencies", () => {
  render(<YourRemixComponent />);
  
  // Make assertions
  expect(screen.getByText("Some text")).toBeInTheDocument();
});
```

### Future Direction
In the future, we may adopt `@remix-run/testing` for more integrated testing of Remix routes and loaders:

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

> Note: This approach is not yet implemented in our codebase. Stick with the current approach until this is officially adopted.

## Related documents
- [Development guidelines](./guidelines.md)
- [Error handling testing](./error-handling.md)