# Testing Utilities and Organization

This directory contains tests and testing utilities for the Notalock project. All testing follows the guidelines established in [testing.md](/docs/development/testing.md).

## Directory Structure

- [`e2e/`](./e2e) - End-to-end tests
- [`integration/`](./integration) - Integration tests
- [`unit/`](./unit) - Unit tests that aren't co-located with source files
- [`utils/`](./utils) - Utility functions for testing components

## Mock Implementations

Mock implementations for external dependencies are located in the app directory:
- [`app/__mocks__/`](/app/__mocks__) - Mock implementations for external dependencies

## Usage Examples

### Testing Remix Components

Use the `renderWithRemix` utility to render components that depend on Remix context:

```tsx
import { renderWithRemix } from '~/app/__mocks__/utils/render-with-remix';
import { screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderWithRemix(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Mocking Supabase

Create a Supabase client mock with predefined data and response behaviors:

```tsx
import { createSupabaseMock } from '~/app/__mocks__/supabase';

const mockProduct = {
  id: 'prod-1',
  name: 'Test Product',
  price: 99.99
};

const mockSupabase = createSupabaseMock({
  fromData: {
    products: mockProduct
  },
  singleData: {
    data: mockProduct,
    error: null
  }
});

// Mock the createSupabaseClient function
vi.mock('~/server/services/supabase.server', () => ({
  createSupabaseClient: vi.fn().mockReturnValue(mockSupabase)
}));
```

## Common Patterns

### Testing Loading States

```tsx
// Setup navigation mock to show loading state
vi.mocked(useNavigation).mockReturnValue({ state: 'loading' });

// Render component
renderWithRemix(<ProductPage />);

// Check for loading UI
expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
```

### Testing Error States

```tsx
// Create a mock with error responses
const errorMockSupabase = createSupabaseMock({
  singleData: {
    data: null,
    error: new Error('Not found')
  }
});

createSupabaseClient.mockReturnValue(errorMockSupabase);

// Test error handling in loaders or components
await expect(loader({ request, params, context })).rejects.toEqual(
  expect.objectContaining({
    status: 404,
  })
);
```

## Key Principles

1. Keep mock setup code organized and reusable
2. Test both success and error paths
3. Use proper data router context for Remix hooks
4. Create chainable mocks for Supabase queries
5. Ensure proper cleanup in tests that use subscriptions

## Testing Organization Rules

1. **Unit Tests**: Co-located with source files when possible
2. **Route Tests**: In `routes/__tests__` directory
3. **Integration Tests**: In the `/tests/integration` directory
4. **E2E Tests**: In the `/tests/e2e` directory
5. **Test Mocks**: In `app/__mocks__` directory

This organization follows the structure defined in [code-organization.md](/docs/development/code-organization.md).
