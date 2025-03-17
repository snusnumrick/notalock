# Remix v2 Routing Patterns

## Overview

Remix v2 introduces changes to the routing system that require specific patterns when using flat routes. This document outlines the best practices for handling parent and index routes in Remix v2, particularly when using the flat route file naming convention.

## Parent Route to Index Route Resolution

In Remix v2, when a user navigates to a parent route (e.g., `/admin/orders`), the system doesn't automatically render the index route, even if an index route file exists (e.g., `admin.orders.index.tsx`).

### The Problem

For example, with these route files:
- `admin.orders.tsx` (parent route)
- `admin.orders.index.tsx` (index route)

Navigating to `/admin/orders` would load the parent route's loader, but would not automatically render the index route's component.

### Solution: Explicit Index Route Handling

The recommended approach is to add explicit handling in the parent route's loader to redirect to the index route when visited directly:

```typescript
// In parent route loader (e.g., admin.orders.tsx)
export async function loader({ request }: LoaderFunctionArgs) {
  // Authenticate or perform other checks
  await requireAdmin(request);
  
  // Check if we're directly on the parent route path
  const url = new URL(request.url);
  if (url.pathname === '/admin/orders') {
    // Redirect to the index route
    return redirect('/admin/orders/index');
  }

  return null;
}
```

## Route Pattern Examples

### Parent and Index Route Pattern

```typescript
// app/routes/admin.orders.tsx (parent route)
import { Outlet } from '@remix-run/react';
import { redirect } from '@remix-run/node';

export async function loader({ request }) {
  // Authentication and other checks
  
  // Redirect if accessing parent route directly
  const url = new URL(request.url);
  if (url.pathname === '/admin/orders') {
    return redirect('/admin/orders/index');
  }
  
  return null;
}

export default function OrdersLayout() {
  return (
    <div className="layout-container">
      <Outlet />
    </div>
  );
}
```

```typescript
// app/routes/admin.orders.index.tsx (index route)
import { useLoaderData } from '@remix-run/react';

export async function loader({ request }) {
  // Load data for the index route
  const data = await getOrderData(request);
  return json({ data });
}

export default function OrdersIndex() {
  const { data } = useLoaderData<typeof loader>();
  
  return (
    <div>
      {/* Render index route content */}
    </div>
  );
}
```

### Alternative: Conditional Rendering in Parent

An alternative to redirection is conditional rendering based on the current pathname:

```typescript
// app/routes/admin.products.tsx
import { Outlet, useLoaderData, useLocation } from '@remix-run/react';

export default function AdminProductsPage() {
  const { products } = useLoaderData<typeof loader>();
  const location = useLocation();
  
  // Condition based on current path
  if (location.pathname === '/admin/products') {
    return <ProductList products={products} />;
  }
  
  // Otherwise render child routes
  return <Outlet />;
}
```

## Best Practices

1. **Use Explicit Redirects**: For clarity and consistency, use explicit redirects in parent loaders to handle direct access.

2. **Avoid Path Hardcoding**: If possible, use relative paths or path constants to avoid hardcoding URLs.

3. **Consider User Experience**: Choose between redirection and conditional rendering based on the UX requirements.

4. **Consistent Pattern**: Use the same approach throughout the application for consistency.

5. **Documentation**: Document the chosen pattern in code comments for clarity.

## Common Issues

- **Empty UI**: If you see a parent layout rendering without content, check if the index route is being properly resolved.

- **Multiple Redirects**: Be careful not to create redirect loops between parent and index routes.

- **Missing Outlet**: Ensure parent routes include an `<Outlet />` component to render child routes.

## Related Documents

- [Code Organization](./code-organization.md)
- [Development Guidelines](./guidelines.md)
