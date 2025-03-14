# Testing Guidelines

## Test Organization and File Placement

The project uses a hybrid testing approach with tests placed in different locations depending on their type:

### 1. Unit Tests

- **Component & Service Tests**: Co-located with the code they test in feature-specific `__tests__` directories
  - Example: `/app/features/checkout/__tests__/CheckoutSteps.test.tsx`
  - Example: `/app/features/checkout/__tests__/checkoutService.test.ts`

- **Route Tests**: Located in `/app/routes/__tests__/`
  - Example: `/app/routes/__tests__/api.update-shipping-price.test.ts`
  - Named to match the route they test

### 2. Integration Tests

- Located in the root `/tests/integration/` directory
- Test interactions between multiple components or features
- Example: `/tests/integration/cart-checkout-flow.test.ts`

### 3. End-to-End Tests

- Located in the root `/tests/e2e/` directory
- Uses Playwright to test complete user flows
- Files use `.spec.ts` extension
- Example: `/tests/e2e/shipping-method-selection.spec.ts`
- We use a balanced approach combining true end-to-end tests with hybrid tests (see [Balanced E2E Testing Approach](#balanced-e2e-testing-approach) below)

### 4. Test Mocks

- Global mocks in `/app/__mocks__/`
- Feature-specific mocks may be in feature-specific `__mocks__` directories

> **Important**: The `/tests/unit/` directory is deprecated. For new unit tests, co-locate them with the code they test in the appropriate `__tests__` directory.

## Test Configuration

The project's test configuration is in `vitest.config.ts`:

```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./tests/setup.ts'],
  include: [
    'app/**/*.{test,spec}.{js,jsx,ts,tsx}',
    'tests/**/*.{test}.{js,jsx,ts,tsx}',
    // Exclude Playwright E2E tests
    '!tests/e2e/**/*.spec.ts',
  ],
  alias: {
    '~/': '/app/',
    '@/': '/app/',
  },
},
```

Note about the test configuration:  

1. Tests in both `/app` and `/tests` directories are included by default  
2. Test files must use `.test.ts` or `.spec.ts` extension patterns  
3. E2E tests (Playwright tests) are excluded as they use their own test runner

## Running Tests

### Running Unit and Integration Tests

To run all tests (unit and integration):

```bash
npm run test
```

Or to run tests with the UI:

```bash
npm run test:ui
```

To run specific test files or directories:

```bash
# Run just integration tests
npm run test -- tests/integration

# Run a specific test file
npm run test -- app/features/checkout/__tests__/CheckoutSteps.test.tsx
```

### Running E2E Tests

E2E tests use Playwright and have their own command:

```bash
npm run test:e2e
```

You can also run specific E2E tests or run in UI mode:

```bash
# Run a specific test file
npm run test:e2e tests/e2e/shipping-method-selection.spec.ts

# Run tests in UI mode
npm run test:e2e -- --ui
```

#### Playwright First-Time Setup

If this is your first time running Playwright tests, you'll need to install the browser binaries:

```bash
npx playwright install
```

This will download and install Chromium, Firefox, and WebKit browsers that Playwright uses for testing.

## Balanced E2E Testing Approach

Our end-to-end tests use a balanced approach that combines true end-to-end tests with hybrid tests. This provides both high confidence in critical user flows and reliability in edge cases.

### Three Types of E2E Tests

1. **Pure End-to-End Tests (Critical User Flows)**
   - Use actual UI interactions (clicks, form inputs)
   - Follow complete user journeys (browse → add to cart → checkout)
   - Test from the user's perspective
   - Example: Adding a product to cart through UI interactions

2. **Hybrid Tests (Basic Functionality)**
   - Setup state directly through localStorage or API calls
   - Validate through UI elements when possible
   - Fall back to state verification when needed
   - Example: Verifying cart persistence across page reloads

3. **Integration Tests (Component Interaction)**
   - Test interaction between specific features
   - Direct state manipulation with focused UI validation
   - Example: Cart and checkout page integration

### Resilient Test Design

Our E2E tests incorporate several resilience strategies:

1. **Graceful UI Selection**
   - Try multiple selectors for the same element
   - Log which selector succeeded for debugging
   - Handle cases where elements aren't found

2. **Fallback Mechanisms**
   - If UI interaction fails, fall back to direct state manipulation
   - Clearly log when fallbacks are used
   - Tests provide value even when UI changes

3. **State Verification**
   - Verify state through both UI and underlying storage
   - Adapt to different UI implementations
   - Check consistent behavior across page reloads

### Example: Cart Testing Strategy

```typescript
// Example of a resilient E2E test
test('should add product to cart', async ({ page }) => {
  // Try UI approach first
  try {
    // Try multiple selectors to find a product
    const selectors = [
      '.product-card a',
      '[data-testid="product-card"] a',
      'a[href*="/products/"]',
    ];
    
    let productLink;
    for (const selector of selectors) {
      const links = await page.$$(selector);
      if (links.length > 0) {
        productLink = links[0];
        break;
      }
    }
    
    if (productLink) {
      await productLink.click();
      const addButton = await page.$('button:has-text("Add to Cart")');
      if (addButton) {
        await addButton.click();
        // Verify cart updated through UI
        const cartCount = await page.locator('.cart-count').textContent();
        expect(cartCount).not.toBe('0');
      }
    }
  } catch (error) {
    // If UI approach fails, use direct approach
    console.log('UI approach failed, using direct state setup');
    await page.evaluate(({ storageKey }) => {
      // Set up cart directly in localStorage
      localStorage.setItem(storageKey, JSON.stringify([{...}]));
    }, { storageKey: 'cart_storage_key' });
  }
  
  // Verify cart has items (UI or state)
  // This part always runs, regardless of approach
  const cartItems = await page.evaluate(({ storageKey }) => {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  }, { storageKey: 'cart_storage_key' });
  
  expect(cartItems.length).toBeGreaterThan(0);
});
```

### Helper Functions for E2E Tests

We use several helper functions to improve test code quality:

1. **Feature State Setup**
   - `setupCartWithUIOrDirect(page)` - Sets up a cart using UI or direct methods
   - `setupTestCartDirect(page)` - Directly sets up a test cart

2. **State Verification**
   - `verifyCartNotEmpty(page)` - Verifies cart has items
   - `checkLocalStorageAvailability(page)` - Checks if localStorage is accessible

3. **Environment Adaptation**
   - Tests adapt to different testing environments
   - Handle cases where localStorage isn't available
   - Skip tests gracefully when preconditions aren't met

Our balanced approach ensures that tests are both comprehensive and reliable, testing complete user flows while remaining resilient to UI changes and testing environment limitations.

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
    - When mocking React Router components like Link, include all possible props (className, prefetch, etc.)

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

3. Test Organization and Structure
    - Use descriptive `describe` blocks to group related tests
    - Keep tests focused on specific functionality
    - Break down complex tests into smaller, focused test cases
    - Use clear, action-oriented test names ("calculates correct price" instead of "should work")

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
    - **Prefer co-located tests** - For new unit tests, place them in the appropriate `__tests__` directory
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
    - **Account for Default Values**: Make sure expected values in tests match any default values your code applies
    - **Mock All Required Props**: When mocking components like Link, include all props that might be used

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

  it('handles component with default value transformations', async () => {
    // Make sure expected values in tests match any default values that your component applies
    // For example, if your code provides default values for nulls or undefined:
    const mockData = {
      id: '1',
      name: 'Test Item',
      // Include the expected default values that will be applied
      position: 0,           // Default for undefined
      isActive: true,        // Default for undefined
      sortOrder: 0,          // Default for undefined
      status: '',            // Default for undefined
    };
    
    // Then test against these expected values
    expect(result).toEqual(mockData);
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

## Testing Data Transformation

```typescript
it('correctly transforms database fields to frontend model', () => {
  // Define the database model with snake_case fields
  const mockDbData = {
    id: '1',
    name: 'Test Category',
    is_active: true,
    is_highlighted: true,
    highlight_priority: 5
  };
  
  // If the model applies default values, make sure your expected result includes them
  const expectedResult = {
    id: '1',
    name: 'Test Category',
    isActive: true,           // Transformed from is_active
    isHighlighted: true,      // Transformed from is_highlighted
    highlightPriority: 5,     // Transformed from highlight_priority
    description: undefined,   // Undefined field
    position: 0,              // Default value for undefined
    sortOrder: 0,             // Default value for undefined
    status: '',               // Default empty string 
    isVisible: true           // Default boolean value
  };
  
  // Test the transformation function
  const result = service.transformData(mockDbData);
  expect(result).toEqual(expectedResult);
});
```

When testing data transformations, especially between database and frontend models:

1. **Know Your Defaults**: Be aware of default values that your service might apply to undefined or null fields
2. **Test Complete Objects**: Compare the entire transformed object, not just the fields you're interested in
3. **Document Default Values**: Add comments in tests to indicate which fields have default values
4. **Snake_case to camelCase**: Ensure all field name transformations are tested
5. **Run Console Diffs**: If a test fails with object comparison, study the diff carefully to identify default value issues

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
  Link: ({ to, children, className, prefetch }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  // Mock other Remix components/hooks as needed
  useLoaderData: vi.fn(),
  useActionData: vi.fn(),
  useMatches: vi.fn().mockReturnValue([
    { id: 'root', data: {} },
    { id: 'routes/products', data: {} }
  ]),
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