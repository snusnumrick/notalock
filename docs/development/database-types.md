## Initial Setup

Before generating types for the first time, you need to initialize the Supabase configuration:

```bash
npm run db:types:setup
```

This will:
1. Initialize the Supabase project configuration (`supabase init`)
2. Generate the types from your local Supabase instance

For subsequent updates, you can simply run `npm run db:types`.

# Database Types

## Overview

This project uses Supabase as its database backend. To ensure type safety between the database and our TypeScript application, we automatically generate TypeScript type definitions from the Supabase schema.

## Generated Types

The database types are auto-generated in:
```
app/features/supabase/types/Database.types.ts
```

This file is created by the Supabase CLI and should not be edited manually. It contains TypeScript interfaces and types that match your Supabase database schema.

## Type Generation Commands

We have two npm scripts to generate the types:

1. For local development:
   ```bash
   npm run db:types
   ```
   This generates types from your local Supabase instance.

2. For production:
   ```bash
   npm run db:types:prod
   ```
   This generates types from the production Supabase project.

The type generation is also automatically run during `npm install` via the `prepare` script.

## Using Database Types in Your Code

Instead of directly importing from the generated types file, use the shared types defined in:
```
app/types/shared.ts
```

This file imports and re-exports the database types, and also provides additional utility type guards. This approach provides a stable API for the rest of the application while allowing the underlying database types to be regenerated.

Example:
```typescript
import { OrderStatus, isValidOrderStatus } from '~/types';

function processOrder(status: OrderStatus) {
  // TypeScript will ensure this is a valid order status
  console.log(`Processing order with status: ${status}`);
}

// Type guard for dynamic values
function handleStatusChange(newStatus: string) {
  if (isValidOrderStatus(newStatus)) {
    processOrder(newStatus); // TypeScript knows this is safe
  } else {
    console.error(`Invalid order status: ${newStatus}`);
  }
}
```

## Database Schema Changes

When making changes to the database schema:

1. Create a new migration file in `supabase/migrations/`
2. Update any affected enum types to match the TypeScript definitions
3. Run `npm run db:types` to regenerate the types
4. Verify that the shared types in `app/types/shared.ts` still match the database types

## Type Synchronization

To ensure your application's types stay in sync with your database schema:

- Run `npm run db:types` after pulling changes that include database migrations
- Include type generation in your CI/CD pipeline
- Make database schema changes before updating application code
