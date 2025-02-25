# Error Handling Guidelines

## Core Principles

### Server vs Client Error Handling

1. Server-Side (Routes)
   - Use Response throws for auth failures, not found, server errors
   - Let Remix error boundaries handle routing
   - Include proper status codes
   ```typescript
   // Route loader
   if (!session) {
     throw new Response('Please log in', {
       status: 401,
       statusText: 'Unauthorized'
     });
   }
   ```

2. Client-Side (Components)
   - Use direct navigation for auth redirects
   - Handle validation errors inline
   - Show loading/error states in UI
   ```typescript
   // Component
   if (error instanceof AuthApiError) {
     await navigate('/auth/login');
     return;
   }
   ```

### Error Types

1. Route-Level Errors
   - Authentication/Authorization failures (401/403)
   - Not found errors (404)
   - Server errors (500)
   - Handle via ErrorBoundary components
   - Throw Response objects with appropriate status

2. Component-Level Errors
   - Form validation errors
   - Data loading failures
   - API errors
   - Handle via direct UI feedback
   - Use navigation for auth redirects

3. Form Validation Errors
   - Return as JSON with status 400
   - Display inline with form fields
   - Handle client-side when possible

## Error Handling Patterns

### Route Error Handling
```typescript
export const loader: LoaderFunction = async ({ request }) => {
  try {
    const data = await someOperation();
    return json(data);
  } catch (error) {
    // Always let Remix handle redirects
    if (error instanceof Response) {
      throw error;
    }

    if (error instanceof AuthError) {
      throw new Response('Please log in', {
        status: 401,
        statusText: 'Unauthorized'
      });
    }

    console.error('Loader error:', error);
    throw new Response('An unexpected error occurred', {
      status: 500,
      statusText: error instanceof Error ? error.message : 'Server Error'
    });
  }
};
```

### Form Validation Pattern
```typescript
// Synchronous validation
const fieldErrors = validateFields(formData);
if (Object.keys(fieldErrors).length > 0) {
  return json({ fieldErrors }, { status: 400 });
}

// Async validation
try {
  await validateAsync(formData);
} catch (error) {
  if (error instanceof ValidationError) {
    return json({ 
      fieldErrors: error.validationErrors 
    }, { status: 400 });
  }
  throw error;
}
```

### Component Error Handling
```typescript
const handleError = useCallback(async (error: Error) => {
  if (error instanceof AuthApiError) {
    await navigate('/auth/login');
    return;
  }

  if (error instanceof ValidationError) {
    setFieldErrors(error.validationErrors);
    return;
  }

  console.error('Operation failed:', error);
  setError('An unexpected error occurred');
}, [navigate]);
```

### Error Recovery UI
```typescript
function ErrorRecovery({ error, onRetry }) {
  return (
    <div>
      <p>{error.message}</p>
      <Button onClick={onRetry}>Try Again</Button>
      <Button onClick={onReset}>Start Over</Button>
    </div>
  );
}
```

### Error Boundary Implementation
```typescript
export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 401:
        return <UnauthorizedError message={error.data} />;
      case 404:
        return <NotFoundError message={error.data} />;
      default:
        return <GenericError 
          status={error.status} 
          message={error.data || error.statusText} 
        />;
    }
  }

  return <GenericError 
    status={500} 
    message="An unexpected error occurred" 
  />;
}
```

## Testing Error Handling

### Important Note
When running tests that verify error handling, error messages in stderr are expected and help verify that errors are being properly logged. These logs do not indicate test failures.

### Route Tests
```typescript
describe('Route Error Handling', () => {
  it('handles auth errors with 401 response', async () => {
    const authError = new AuthError('Token expired');
    mockLoader.mockRejectedValueOnce(authError);

    const response = await loader({ request: new Request('/') });
    expect(response.status).toBe(401);
    expect(response.statusText).toBe('Unauthorized');
  });
});
```

### Component Tests
```typescript
describe('Component Error Handling', () => {
  it('redirects to login on auth error', async () => {
    const authError = new AuthApiError('Token expired');
    mockOperation.mockRejectedValueOnce(authError);

    render(<YourComponent />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('displays validation errors inline', async () => {
    const validationError = new ValidationError({
      email: 'Invalid email'
    });
    mockOperation.mockRejectedValueOnce(validationError);

    render(<YourComponent />);

    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });
});
```

### Error Boundary Tests
```typescript
describe('ErrorBoundary', () => {
  it('renders unauthorized error for 401', () => {
    vi.mocked(useRouteError).mockReturnValue(
      new Response('Please log in', {
        status: 401,
        statusText: 'Unauthorized'
      })
    );

    render(<ErrorBoundary />);
    expect(screen.getByText('Please log in')).toBeInTheDocument();
  });
});
```

## Best Practices

1. Route-Level Error Handling
   - Use Response throws for routing-level errors
   - Include appropriate status codes
   - Provide user-friendly error messages
   - Log errors with full context

2. Component-Level Error Handling
   - Handle errors close to where they occur
   - Provide immediate user feedback
   - Use navigation for auth redirects
   - Log unexpected errors

3. Form Validation
   - Validate early client-side when possible
   - Return specific field-level errors
   - Show errors inline with fields
   - Clear errors on form changes

4. Error Recovery
   - Provide retry mechanisms
   - Clear error state on new attempts 
   - Show helpful recovery actions
   - Preserve user input when possible

5. Error Logging
   - Development:
     - Log full error details
     - Include stack traces
     - Show in console
   - Production:
     - Log to monitoring service
     - Sanitize sensitive data
     - Include request context
     - Track error frequency

6. Testing
   - Test both success and error paths
   - Verify error messages are displayed
   - Test error boundary rendering
   - Ensure proper error logging
   - Expect stderr output for error tests

## Common Patterns

### Authentication Errors
- Routes: Throw 401 Response
- Components: Navigate to login
- Always clean up user state
- Preserve intended destination

### Validation Errors
- Return 400 status with field errors
- Display errors inline with fields
- Clear errors on form changes
- Support async validation

### Unexpected Errors
- Log full error details
- Show user-friendly messages
- Provide retry/recovery options
- Maintain app stability
- Track error patterns

## Related Documents
- [Development Guidelines](./guidelines.md)
- [Testing Guidelines](./testing.md)