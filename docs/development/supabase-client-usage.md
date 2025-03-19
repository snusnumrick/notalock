# Supabase Client Usage Guide

This document provides guidelines for how to properly use Supabase clients in the Notalock application.

## Available Clients

The application provides several ways to access Supabase, each designed for different contexts:

### 1. Browser Client

```typescript
import { getSupabaseClient } from '~/features/supabase/client';

// In browser environments
const supabase = getSupabaseClient();
```

- **Use when**: Your code runs exclusively in the browser
- **Features**: Handles browser-specific environments, manages auth state in browser
- **Location**: `~/features/supabase/client.ts`

### 2. Server Client with Request Context

```typescript
import { createSupabaseClient } from '~/features/supabase/supabase.server';

// In loaders/actions with request context
export async function loader({ request }: LoaderFunctionArgs) {
  const supabase = createSupabaseClient(request);
  // ...
}
```

- **Use when**: You have access to the request object (loaders, actions)
- **Features**: Proper cookie management for authentication
- **Location**: `~/server/services/supabase.server.ts`

### 3. Universal Client (Environment-aware)

```typescript
import { getEnvironmentSupabaseClient } from '~/features/supabase/utils';

// Works in both browser and server environments
const supabase = await getEnvironmentSupabaseClient();
```

- **Use when**: Your code needs to run in both server and browser environments
- **Features**: Automatically detects environment and uses appropriate client
- **Location**: `~/features/supabase/utils.ts`
- **Note**: Perfect for services that need to work universally but don't have request context

## Best Practices

1. **Always use the appropriate client** for your context:
   - Request-aware server code: Use `createSupabaseClient(request)`
   - Browser-only code: Use `getSupabaseClient()`
   - Universal code (services): Use `getEnvironmentSupabaseClient()`

2. **Avoid direct instantiation** of Supabase clients with environment variables

3. **Handle authentication properly**:
   - Server-side authentication requires cookie handling via the request context
   - Browser-side authentication is handled automatically by the client

4. **Service implementation pattern**:
   ```typescript
   // For services that need to run in both client and server
   export async function getMyService(): Promise<MyService> {
     if (!serviceInstance) {
       const { getEnvironmentSupabaseClient } = await import('~/features/supabase/utils');
       const supabase = await getEnvironmentSupabaseClient();
       serviceInstance = new MyService(supabase);
     }
     return serviceInstance;
   }
   ```

## Environment Variables

The Supabase client implementations handle environment variables correctly for each context:

- **Browser**: Uses `window.ENV.SUPABASE_URL` and `window.ENV.SUPABASE_ANON_KEY`
- **Server**: Uses `process.env.SUPABASE_URL` and `process.env.SUPABASE_ANON_KEY`

You should never need to manually access these environment variables directly.
