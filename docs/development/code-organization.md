# Code Organization

## Remix Project Structure
```
notalock/
├── app/                   # Remix application code
│   ├── root.tsx          # Root route
│   ├── entry.client.tsx  # Client entry
│   ├── entry.server.tsx  # Server entry
│   ├── routes/           # Route modules
│   │   ├── _index.tsx    # Index route
│   │   ├── admin/        # Admin routes
│   │   └── categories/   # Category routes
│   ├── __mocks__/        # Test mocks
│   ├── components/       # Shared components
│   ├── config/           # Configuration files
│   └── features/         # Feature modules
├── public/              # Static assets
├── docs/               # Documentation
├── supabase/          # Supabase configuration
├── tests/             # End-to-end and integration tests
└── coverage/          # Test coverage reports
```

## Core Directory Structure

### Remix-specific Directories
- `app/routes/`: All route modules
  - Follows Remix file-based routing conventions
  - Nested routes in subdirectories
  - Route specific components co-located with routes

### Component Organization
- `app/components/`: Application-wide shared components
  - `common/`: Shared utility components
  - `features/`: Feature-specific shared components
  - `ui/`: shadcn/ui components and customizations

### Feature Module Structure
Each feature module is organized as:
```
feature/
├── __tests__/          # Feature-specific tests
├── api/                # API and loader/action functions
├── components/         # Route and shared components
├── hooks/              # Custom React hooks
├── types/              # TypeScript types and interfaces
└── utils/              # Helper functions and utilities
```

## Route Organization
- Routes follow Remix conventions
- Routes can import from feature modules
- Loaders and actions defined in route modules
- Complex logic moved to feature modules

## File Naming Conventions
- Route modules: Follow Remix conventions (e.g., `admin.categories.$id.tsx`)
- Components: PascalCase (e.g., `ProductList.tsx`)
- Loaders/Actions: camelCase (e.g., `categoryLoader.ts`)
- Hooks: camelCase with 'use' prefix (e.g., `useProducts.ts`)
- Types: PascalCase with '.types' suffix (e.g., `product.types.ts`)
- Tests: Same name as tested file with '.test' suffix

## Test Organization
- Unit tests: Co-located with source files
- Route tests: In `routes/__tests__`
- Integration tests: In root `tests` directory
- E2E tests: In `tests/e2e` directory
- Test mocks: In `app/__mocks__`

## Database Organization
- Migrations: In `supabase/migrations`
- Follow timestamp-based naming: `{timestamp}_{description}.sql`