# Code Organization

## Project Structure
```
notalock/
├── app/
│   ├── components/
│   │   ├── common/      # Shared components
│   │   ├── features/    # Feature-specific components
│   │   └── ui/          # UI components
│   ├── config/         # Configuration files
│   ├── features/        # Feature modules
│   │   └── products/    # Product management
│   │       ├── api/     # Product-specific API
│   │       ├── components/ # Product components
│   │       ├── hooks/   # Product-specific hooks
│   │       ├── types/   # Product types
│   │       └── utils/   # Product utilities
│   ├── lib/            # Third-party library configurations
│   ├── routes/         # Route components
│   │   ├── admin/      # Admin routes
│   │   │   └── products/ # Product management routes
│   │   ├── api/        # API endpoints
│   │   └── _index.tsx  # Main app route
│   ├── server/         # Server-side code
│   │   ├── middleware/ # Request middleware
│   │   ├── services/   # Core services (e.g., Supabase)
│   │   └── utils/      # Server utilities
│   ├── styles/         # Global styles
│   ├── types/          # TypeScript types
│   └── utils/          # Client utilities
│   ├── entry.client.tsx # Client entry point
│   ├── entry.server.tsx # Server entry point
│   └── root.tsx        # Root component
├── docs/              # Documentation
│   └── development/    # Development documentation
├── public/           # Static assets
└── tests/            # Test files
```

## Feature Module Structure
Each feature module follows this structure:
```
features/[feature-name]/
├── api/           # Feature-specific API calls and data management
├── components/    # Feature-specific UI components
├── hooks/         # Feature-specific React hooks
├── types/         # Feature-specific TypeScript types
└── utils/         # Feature-specific utilities
```

Feature routes are organized in `app/routes/` following the Remix file-based routing convention. For admin features, routes are placed under `app/routes/admin/[feature-name]/`.

Feature-specific components that are shared across multiple routes should be registered in `app/components/features/` for better organization and reusability.

## Import Guidelines

### Feature-Specific Imports
```typescript
// Feature API
import { createProduct } from "~/features/products/api";

// Feature components
import { ProductForm } from "~/features/products/components/ProductForm";

// Feature hooks
import { useProductUpload } from "~/features/products/hooks/useProductUpload";

// Feature types
import type { Product } from "~/features/products/types";

// Feature utilities
import { formatProductPrice } from "~/features/products/utils";

// Shared feature components
import { ProductCard } from "~/components/features/products/ProductCard";
```

### Server-Side Imports
```typescript
// Core services
import { createServerClient } from "~/server/services/supabase.server";

// Server utilities
import { requireAdmin } from "~/server/utils/auth";

// Server middleware
import { validateRequest } from "~/server/middleware/validation";
```

### Shared Resources
```typescript
// UI components
import { Button } from "~/components/ui/button";

// Common components
import { PageLayout } from "~/components/common/PageLayout";

// Environment configuration
import { env } from "~/config/env";

// Global types
import type { User } from "~/types";
```

## Best Practices

### Code Organization
1. Feature-first organization
   - Place feature-specific code in `app/features/[feature-name]`
   - Group related functionality (API, components, hooks, etc.)
   - Use feature-specific types and utilities

2. Route organization
   - Follow Remix file-based routing conventions
   - Group admin routes under `app/routes/admin`
   - Place API endpoints under `app/routes/api`
   - Keep route components focused on data fetching and layout

3. Component organization
   - Keep components focused and single-purpose
   - Place reusable UI components in `components/ui`
   - Share common layouts and patterns in `components/common`
   - Register feature components in `components/features` when shared

### Data and State Management
1. Server-side data flow
   - Use Remix loaders for data fetching
   - Handle mutations with Remix actions
   - Implement proper error handling and validation
   - Use server middleware where needed

2. Supabase integration
   - Create server clients in route loaders
   - Handle authentication in server utils
   - Manage database operations in API handlers
   - Follow proper security practices

### Development Practices
1. TypeScript usage
   - Define types in feature-specific `types` directories
   - Use global types for shared interfaces
   - Leverage TypeScript for API definitions
   - Run `typecheck` before commits

2. Code quality
   - Follow ESLint and Prettier configurations
   - Use Husky pre-commit hooks
   - Maintain consistent file and directory naming
   - Keep dependencies updated

3. Styling practices
   - Use Tailwind CSS core utilities only
   - Apply `class-variance-authority` for variants
   - Use `clsx` or `tailwind-merge` for conditions
   - Follow established component patterns