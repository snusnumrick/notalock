# Notalock - European Door Hardware Store

[Previous sections remain the same until Project Structure...]

## Development Guidelines

### Import Paths

The project uses the `~` alias to reference files from the `app` directory. Follow these import patterns:

1. **Feature-Specific Imports**
   ```typescript
   // Components within the same feature
   import { ProductForm } from '../components/ProductForm';
   
   // Types from the same feature
   import { ProductFormData } from '../types/product.types';
   
   // API services from the same feature
   import { ProductService } from '../api/productService';
   ```

2. **Server-Side Imports**
   ```typescript
   // Server services
   import { createSupabaseServerClient } from "~/server/services/supabase.server";
   
   // Server utilities
   import { validateSession } from "~/server/utils/auth";
   ```

3. **Shared Resources**
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

4. **Assets and Styles**
   ```typescript
   // Styles
   import styles from "~/styles/tailwind.css";
   ```

### Import Best Practices

1. **Absolute vs Relative Paths**
   - Use relative paths (`../`) within a feature module
   - Use absolute paths (`~/`) when importing from outside the feature module
   - Always use absolute paths for shared resources

2. **Common Mistakes to Avoid**
   - Don't import from old directory structure (e.g., `~/services/` → use `~/server/services/`)
   - Don't cross-import between features directly (use shared components instead)
   - Don't use plain Node.js style imports (`./` or `../`) from the root of the project

3. **Feature Module Boundaries**
   - Keep feature-specific code within its feature directory
   - If code is used by multiple features, move it to the appropriate shared directory
   - Consider creating a new shared component rather than copying code between features

### Code Organization

1. **New Features**
   ```
   app/features/[feature-name]/
   ├── api/           # API services
   ├── components/    # UI components
   ├── hooks/         # Custom hooks
   ├── types/         # TypeScript types
   └── utils/         # Helper functions
   ```

2. **Server Code**
   - All server-side code should go in the `server` directory
   - Use the appropriate subdirectory based on the code's purpose:
     - Services: Database/external service interactions
     - Middleware: Request processing
     - Utils: Helper functions

3. **Shared Resources**
   - Only move code to shared directories if it's used by multiple features
   - Document shared components with clear usage examples
   - Keep shared utilities pure and side-effect free

[Rest of the README remains the same...]