# Middleware Documentation

## Overview
The middleware layer provides reusable functionality for common server-side operations:
- Authentication and authorization
- Image processing and optimization
- Supabase client management

## Authentication Middleware
Located in `app/server/middleware/auth.server.ts`

### Authentication Functions

#### `requireAuth(request: Request)`
Ensures a user is authenticated before accessing a route.

```typescript
import { requireAuth } from '~/server/middleware';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { user, response } = await requireAuth(request);
    // ... rest of loader logic
    return json(data, { headers: response.headers });
  } catch (error) {
    // ... error handling
  }
};
```

#### `requireAdmin(request: Request)`
Ensures a user is authenticated and has admin role.

```typescript
import { requireAdmin } from '~/server/middleware';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { user, response } = await requireAdmin(request);
    // user object includes role information
    return json(data, { headers: response.headers });
  } catch (error) {
    // ... error handling
  }
};
```

#### `checkUserRole(request: Request, allowedRoles: string[])`
Checks if a user has specific roles without throwing redirects.

```typescript
const isAdmin = await checkUserRole(request, ['admin']);
```

## Image Processing Middleware
Located in `app/server/middleware/image.server.ts`

### Image Functions

#### `processImage(request: Request, options?: ImageProcessingOptions)`
Processes image uploads with optimization.

```typescript
import { processImage, ImageProcessingOptions } from '~/server/middleware';

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const options: ImageProcessingOptions = {
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 85,
      format: 'webp'
    };

    const { buffer, contentType } = await processImage(request, options);
    // ... handle processed image
  } catch (error) {
    // ... error handling
  }
};
```

## Supabase Client Middleware
Located in `app/server/middleware/supabase.server.ts`

### Supabase Functions

#### `createSupabaseClient(request: Request, response: Response)`
Creates a Supabase client with cookie handling.

```typescript
import { createSupabaseClient } from '~/server/middleware';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const response = new Response();
    const supabase = createSupabaseClient(request, response);
    
    // ... use supabase client
    
    return json(data, { headers: response.headers });
  } catch (error) {
    // ... error handling
  }
};
```

## Best Practices

### Error Handling
See [Error Handling Guidelines](./error-handling.md) for our error handling patterns.

### Authentication
1. Use appropriate auth middleware based on requirements:
```typescript
// For admin-only routes
const { user, response } = await requireAdmin(request);

// For authenticated routes
const { user, response } = await requireAuth(request);

// For conditional checks
const hasAccess = await checkUserRole(request, ['admin', 'editor']);
```

2. Always include response headers:
```typescript
return json(data, { headers: response.headers });
```

### Image Processing
1. Define image options explicitly:
```typescript
const options: ImageProcessingOptions = {
  maxWidth: 2000,
  maxHeight: 2000,
  quality: 85,
  format: 'webp'
};
```

2. Handle processed images properly:
```typescript
const { buffer, contentType } = await processImage(request, options);

// When returning processed image
return new Response(buffer, {
  headers: {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable'
  }
});
```

### Supabase Integration
1. Create client and handle response:
```typescript
const response = new Response();
const supabase = createSupabaseClient(request, response);

// After Supabase operations
return json(data, { headers: response.headers });
```

## Common Patterns

### Protected Route Pattern
```typescript
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { requireAdmin, createSupabaseClient } from '~/server/middleware';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { user, response } = await requireAdmin(request);
    const supabase = createSupabaseClient(request, response);

    const { data, error } = await supabase
      .from('some_table')
      .select('*');

    if (error) {
      throw new Error('Failed to fetch data');
    }

    return json({ data, user }, { headers: response.headers });
  } catch (error) {
    // Handle error according to error-handling.md
  }
};
```

### File Upload Pattern
```typescript
import { 
  requireAdmin,
  processImage,
  createSupabaseClient 
} from '~/server/middleware';

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    if (request.method !== 'POST') {
      throw new Error('Method not allowed');
    }
    
    const { user, response } = await requireAdmin(request);
    const { buffer, contentType } = await processImage(request, {
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 85,
      format: 'webp'
    });

    const supabase = createSupabaseClient(request, response);
    
    // Handle file upload...

    return json({ success: true }, { headers: response.headers });
  } catch (error) {
    // Handle error according to error-handling.md
  }
};
```