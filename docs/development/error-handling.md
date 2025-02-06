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
    
    return json(data, {
      headers: response.headers // If you have headers to include
    });
  } catch (error) {
    // Always let Remix handle redirects
    if (error instanceof Response) {
      throw error;
    }

    console.error('Loader error:', error);
    
    // Throw a json response for other errors
    throw json(
      { 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { 
        status: 500 
      }
    );
  }
};
```

### Action Error Handling
```typescript
import { json, redirect } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';

export const action: ActionFunction = async ({ request }) => {
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
    
    // Return error response
    throw json(
      { 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { 
        status: 500 
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

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {error.status} {error.statusText}
          </h1>
          <p className="text-gray-600">{error.data.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600">An unexpected error occurred. Please try again later.</p>
      </div>
    </div>
  );
}
```

## Best Practices

### Error Types
1. Routing/Navigation Errors
   - Use `redirect` for navigation
   - Always let Remix handle Response objects
   ```typescript
   if (error instanceof Response) {
     throw error;
   }
   ```

2. Data Operation Errors
   - Log the error for debugging
   - Return appropriate status code
   - Include helpful error message
   ```typescript
   throw json(
     { error: error.message },
     { status: 500 }
   );
   ```

3. Validation Errors
   - Return 400 status code
   - Include specific validation messages
   ```typescript
   throw json(
     { 
       error: 'Validation failed',
       details: validationErrors 
     },
     { status: 400 }
   );
   ```

### Error Responses
1. Always include:
   - Clear error message
   - Appropriate status code
   - Consistent response structure

2. Status codes:
   - 400: Bad Request (validation errors)
   - 401: Unauthorized (not logged in)
   - 403: Forbidden (insufficient permissions)
   - 404: Not Found
   - 500: Server Error

### Error Boundaries
1. Handle both:
   - Route error responses (`isRouteErrorResponse`)
   - Unexpected errors

2. Provide:
   - Clear error message
   - User-friendly display
   - Consistent styling

### Error Logging
1. Always log errors for debugging:
   ```typescript
   console.error('Error context:', error);
   ```

2. Include relevant context:
   - Error message
   - Stack trace
   - Request data (when appropriate)
   - User context (when appropriate)

## Handling Specific Cases

### Authentication Errors
```typescript
if (!session) {
  throw redirect('/login');
}

if (!hasPermission) {
  throw json(
    { error: 'Insufficient permissions' },
    { status: 403 }
  );
}
```

### Database Errors
```typescript
try {
  const result = await db.query();
} catch (error) {
  console.error('Database error:', error);
  throw json(
    { error: 'Database operation failed' },
    { status: 500 }
  );
}
```

### Validation Errors
```typescript
const errors = validateData(formData);
if (errors) {
  throw json(
    { 
      error: 'Validation failed',
      details: errors 
    },
    { status: 400 }
  );
}
```