# Error Handling Guidelines

## Route Error Handling Pattern

### Loader Error Handling
```typescript
import { json, redirect } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';

export const loader: LoaderFunction = async ({ request }) => {
  try {
    // Your loader logic here
    const data = await someOperation();
    
    return json(data);
  } catch (error) {
    // Always let Remix handle redirects
    if (error instanceof Response) {
      throw error;
    }

    console.error('Loader error:', error);
    
    // Throw error response for the ErrorBoundary to handle
    throw new Response('An unexpected error occurred', {
      status: 500,
      statusText: error instanceof Error ? error.message : 'Server Error'
    });
  }
};
```

### Action Error Handling
```typescript
import { json, redirect } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';

export const action: ActionFunction = async ({ request }) => {
  // Field validation errors should return json with fieldErrors
  const fieldErrors = validateFields(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return json({ fieldErrors }, { status: 400 });
  }

  try {
    // Your action logic here
    const result = await someOperation();
    
    return json({ success: true, data: result });
  } catch (error) {
    // Always let Remix handle redirects
    if (error instanceof Response) {
      throw error;
    }

    console.error('Action error:', error);
    
    // Throw error response for the ErrorBoundary to handle
    throw new Response(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      { 
        status: 500,
        statusText: 'Server Error'
      }
    );
  }
};
```

### Error Boundary Component
```typescript
import { useRouteError, isRouteErrorResponse } from '@remix-run/react';

export function ErrorBoundary() {
  const error = useRouteError();

  // Handle route error responses
  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 401:
        return <UnauthorizedError message={error.data} />;
      case 403:
        return <ForbiddenError message={error.data} />;
      case 404:
        return <NotFoundError message={error.data} />;
      default:
        return <GenericError 
          status={error.status} 
          message={error.data || error.statusText} 
        />;
    }
  }

  // Handle unexpected errors
  return <GenericError 
    status={500} 
    message="An unexpected error occurred. Please try again later." 
  />;
}
```

### Form Error Handling Example (Login Form)
```typescript
// Action with field validation and authentication error handling
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  
  // Handle field validation
  const fieldErrors: ActionData['fieldErrors'] = {};
  if (!email || typeof email !== 'string') {
    fieldErrors.email = 'Email is required';
  }
  if (!password || typeof password !== 'string') {
    fieldErrors.password = 'Password is required';
  }

  // Return field errors as JSON
  if (Object.keys(fieldErrors).length > 0) {
    return json({ fieldErrors }, { status: 400 });
  }

  // Handle authentication
  const { error } = await authenticate(email, password);
  if (error) {
    // Throw Response for ErrorBoundary to handle
    throw new Response('Invalid email or password', {
      status: 401,
      statusText: 'Invalid credentials'
    });
  }

  return redirect('/dashboard');
};

// Component with error handling
function LoginForm({ errorMessage }: { errorMessage?: string }) {
  const actionData = useActionData<ActionData>();
  
  return (
    <Form method="post">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <input
        name="email"
        type="email"
        className={actionData?.fieldErrors?.email ? 'border-red-500' : 'border-gray-300'}
      />
      {actionData?.fieldErrors?.email && (
        <p className="text-red-600">{actionData.fieldErrors.email}</p>
      )}
      
      {/* ... rest of the form */}
    </Form>
  );
}

// Error boundary for login-specific errors
export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    if (error.status === 401) {
      return <LoginForm errorMessage="Invalid email or password" />;
    }
    return <LoginForm errorMessage={`Error: ${error.statusText}`} />;
  }

  return <LoginForm errorMessage="An unexpected error occurred" />;
}
```

## Best Practices

### Error Types and Handling
1. Field Validation Errors
   - Return as JSON with `fieldErrors` object
   - Use status 400
   - Display inline with form fields
   ```typescript
   return json({ fieldErrors }, { status: 400 });
   ```

2. Authentication/Authorization Errors
   - Throw Response with appropriate status
   - Use ErrorBoundary to render form with error
   ```typescript
   throw new Response('Invalid credentials', {
     status: 401,
     statusText: 'Unauthorized'
   });
   ```

3. Unexpected Errors
   - Log error details
   - Throw Response with 500 status
   - Show user-friendly message
   ```typescript
   console.error('Unexpected error:', error);
   throw new Response('Server error', { status: 500 });
   ```

### Error Response Patterns
1. Field Validation:
   - Return JSON with fieldErrors
   - Status 400
   - Display inline with form

2. Authentication/Authorization:
   - Throw Response
   - Status 401/403
   - Re-render form with error

3. Server Errors:
   - Throw Response
   - Status 500
   - Generic error message

### Error Boundaries
1. Common patterns:
   - Re-render form with error message
   - Show error state UI
   - Provide recovery actions

2. Error handling hierarchy:
   - Field errors (inline)
   - Route errors (ErrorBoundary)
   - Root errors (fallback)

### Error Logging
1. Development:
   - Log full error details
   - Include stack traces
   - Show in console

2. Production:
   - Log to monitoring service
   - Sanitize sensitive data
   - Include request context

## Examples

### Authentication Error Pattern
```typescript
if (!session) {
  throw new Response('Please log in', {
    status: 401,
    statusText: 'Unauthorized'
  });
}
```

### Database Error Pattern
```typescript
try {
  const result = await db.query();
} catch (error) {
  console.error('Database error:', error);
  throw new Response('Database operation failed', {
    status: 500,
    statusText: 'Server Error'
  });
}
```

### Validation Error Pattern
```typescript
const errors = validateData(formData);
if (errors) {
  return json({ fieldErrors: errors }, { status: 400 });
}
```