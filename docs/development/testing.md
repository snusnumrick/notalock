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

## Related documents
- [Development guidelines](./guidelines.md)
- [Error handling testing](./error-handling.md)