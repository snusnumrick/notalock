# Code Organization

## Project Structure
```
notalock-store/
├── app/
│   ├── components/
│   │   ├── admin/       # Admin-specific components
│   │   ├── common/      # Shared components
│   │   └── ui/          # UI components
│   ├── features/        # Feature modules
│   │   ├── products/
│   │   ├── orders/
│   │   └── users/
│   ├── hooks/           # Custom React hooks
│   ├── lib/            # Third-party library configurations
│   ├── routes/         # Route components
│   ├── server/         # Server-side code
│   │   ├── services/   # Server services
│   │   └── utils/      # Server utilities
│   ├── styles/         # Global styles
│   ├── types/          # TypeScript types
│   └── utils/          # Client utilities
├── docs/              # Documentation
├── public/           # Static assets
└── tests/            # Test files
```

## Feature Module Structure
Each feature module follows this structure:
```
features/[feature-name]/
├── api/           # API services
├── components/    # UI components
├── hooks/         # Custom hooks
├── types/         # TypeScript types
└── utils/         # Helper functions
```

## Import Guidelines

### Feature-Specific Imports
```typescript
// Components within the same feature
import { ProductForm } from '../components/ProductForm';

// Types from the same feature
import { ProductFormData } from '../types/product.types';

// API services from the same feature
import { ProductService } from '../api/productService';
```

### Server-Side Imports
```typescript
// Server services
import { createSupabaseServerClient } from "~/server/services/supabase.server";

// Server utilities
import { validateSession } from "~/server/utils/auth";
```

### Shared Resources
```typescript
// UI components
import { Button } from "~/components/ui/button";

// Common components
import { PageLayout } from "~/components/common/PageLayout";

// Shared hooks
import { useAuth } from "~/hooks/useAuth";

// Global types
import { User } from "~/types/auth.types";
```

## Best Practices

### Component Organization
1. Keep components focused and single-purpose
2. Use consistent naming conventions
3. Co-locate related files
4. Implement proper error boundaries

### State Management
1. Keep state close to where it's used
2. Use appropriate state management tools
3. Implement proper data fetching strategies
4. Handle loading and error states

### Code Splitting
1. Use dynamic imports for routes
2. Implement proper chunking
3. Optimize bundle sizes
4. Use proper lazy loading strategies