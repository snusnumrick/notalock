# Code Organization

## Project Structure
```
notalock/
├── app/
│   ├── __mocks__/      # Test mocks
│   ├── components/
│   │   ├── common/     # Shared components
│   │   ├── features/   # Feature-specific components
│   │   └── ui/         # UI components
│   ├── config/         # Configuration files
│   ├── features/       # Feature modules
│   │   └── products/   # Product management
│   │       ├── api/    # Product-specific API
│   │       ├── components/ # Product components
│   │       │   └── shared/ # Shared product components
│   │       │       └── DraggableGalleryWrapper.tsx # Draggable gallery component
│   │       ├── hooks/  # Product-specific hooks
│   │       ├── types/  # Product types
│   │       └── utils/  # Product utilities
│   ├── lib/           # Third-party library configurations
│   ├── routes/        # Route components
│   │   ├── _index.tsx # Main app route
│   │   ├── admin/     # Admin routes
│   │   ├── admin.products/ # Product management routes
│   │   ├── api/       # API endpoints
│   │   │   ├── images/ # Image processing endpoints
│   │   │   └── products/ # Product management endpoints
│   │   ├── products/  # Product routes
│   │   └── auth/      # Authentication routes
│   ├── server/        # Server-side code
│   │   ├── middleware/ # Server middleware (auth, images, etc.)
│   │   ├── services/  # Core services (e.g., Supabase)
│   │   └── utils/     # Server utilities
│   ├── styles/        # Global styles
│   ├── test/          # Test utilities and setup
│   ├── types/         # TypeScript types
│   │   └── css.d.ts   # CSS type definitions
│   └── utils/         # Client utilities
│   ├── entry.client.tsx # Client entry point
│   ├── entry.server.tsx # Server entry point
│   └── root.tsx       # Root component
├── docs/             # Documentation
│   └── development/  # Development documentation
└── public/          # Static assets
```

## Server Organization
The server directory follows a middleware-first approach for common functionality:

### Middleware Layer
Located in `app/server/middleware/`:
- `auth.server.ts`: Authentication and authorization
- `error.server.ts`: Error handling and validation
- `image.server.ts`: Image processing and optimization
- `supabase.server.ts`: Supabase client management

For detailed middleware documentation, see [Middleware Documentation](./middleware.md).

### Core Services
Located in `app/server/services/`:
- Supabase client configuration
- Future service integrations (e.g., payment processing)

### Server Utilities
Located in `app/server/utils/`:
- Session management
- Helper functions
- Type definitions

## Route Organization

### API Routes
API routes follow a consistent pattern:
```typescript
import { withErrorHandler, requireAdmin, validateMethod } from '~/server/middleware';

export const action = withErrorHandler(async ({ request }) => {
  validateMethod(request, ['POST']);
  const { user, response } = await requireAdmin(request);
  // ... route logic
});
```

### Protected Routes
Admin and protected routes use authentication middleware:
```typescript
import { withErrorHandler, requireAdmin } from '~/server/middleware';

export const loader = withErrorHandler(async ({ request }) => {
  const { user, response } = await requireAdmin(request);
  // ... route logic
});
```

### Public Routes
Public routes can still benefit from error handling:
```typescript
import { withErrorHandler } from '~/server/middleware';

export const loader = withErrorHandler(async ({ request }) => {
  // ... route logic
});
```

## Feature Organization
Each feature follows this structure:
```
features/[feature-name]/
├── api/           # Feature-specific API calls and data management
├── components/    # Feature-specific UI components
├── hooks/         # Feature-specific React hooks
├── types/         # Feature-specific TypeScript types
└── utils/         # Feature-specific utilities
```

## Import Guidelines

### Server-Side Imports
```typescript
// Middleware
import { requireAdmin, processImage } from '~/server/middleware';

// Core services
import { createSupabaseClient } from '~/server/services/supabase.server';

// Server utilities
import { getSession } from '~/server/utils/session.server';
```

### Feature Imports
```typescript
// Feature API
import { createProduct } from '~/features/products/api';

// Feature components
import { ProductForm } from '~/features/products/components/ProductForm';

// Feature hooks
import { useProductUpload } from '~/features/products/hooks/useProductUpload';
```

### UI Imports
```typescript
// UI components
import { Button } from '~/components/ui/button';

// Common components
import { PageLayout } from '~/components/common/PageLayout';

// Feature-specific components
import { ProductCard } from '~/components/features/products/ProductCard';
```

## Best Practices

### Route Implementation
1. Use middleware for common functionality
2. Implement proper error handling
3. Validate request methods
4. Handle authentication appropriately

### Middleware Usage
1. Wrap routes with `withErrorHandler`
2. Use appropriate auth middleware
3. Handle response headers consistently
4. Follow middleware-specific best practices

### State Management
1. Keep state close to where it's used
2. Use loaders for data fetching
3. Implement proper error boundaries
4. Handle loading states appropriately

### Error Handling
We follow a consistent error handling pattern across routes. See [Error Handling Guidelines](./error-handling.md) for details.

1. Use try/catch in loaders and actions
2. Implement error boundaries for each route
3. Follow status code conventions
4. Log errors appropriately
5. Handle redirects correctly

### Security
1. Always validate user permissions
2. Sanitize user input
3. Implement proper CORS headers
4. Follow security best practices