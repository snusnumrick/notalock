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
│   ├── config/          # Configuration files
│   └── features/        # Feature modules
│       ├── categories/   # Category management
│       ├── products/     # Product management
│       └── hero-banners/ # Hero banner/slider
├── public/              # Static assets
├── docs/               # Documentation
├── supabase/          # Supabase configuration
├── tests/             # End-to-end and integration tests
└── coverage/          # Test coverage reports
```

## Core Directory Structure

### Route Organization and Conventions
- Routes follow Remix file-based routing conventions
- Route patterns:
  - `_index.tsx` - Site index route
  - Layout routes (e.g. `products.tsx`) - Provide shared UI for child routes
  - Nested routes inherit parent layout:
    - `products._index.tsx` - Products list page
    - `products.$id.tsx` - Individual product page
  - Admin section examples:
    - `admin.tsx` - Admin layout
    - `admin._index.tsx` - Admin dashboard
    - `admin.products.tsx` - Admin products management
    - `admin.hero-banners.tsx` - Hero banners listing
    - `admin.hero-banners.new.tsx` - Create new hero banner
    - `admin.hero-banners.$id.edit.tsx` - Edit existing hero banner
- Use underscore prefix for:
  - Main index route (`_index.tsx`)
  - Nested index routes (`parent._index.tsx`)
  - Layout routes that apply to multiple children
- Routes can import from feature modules
- Loaders and actions defined in route modules
- Complex logic moved to feature modules

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
│   ├── __tests__/     # API layer tests
│   ├── loaders.ts     # Data fetching functions
│   ├── actions.ts     # Data modification functions
│   └── service.ts     # Service classes
├── components/         # Route and shared components
│   ├── __tests__/     # Component tests
│   ├── admin/         # Admin-specific components
│   └── public/        # Public-facing components
├── hooks/              # Custom React hooks
├── types/              # TypeScript types and interfaces
└── utils/              # Helper functions and utilities
```

Example implementation: The hero-banners feature module follows this structure, containing:
- API layer with HeroBannerService and related loaders/actions
- Components for both public-facing (HeroSlider) and admin interfaces
- Type definitions for hero banner data
- Comprehensive tests for all parts of the feature

## File Naming Conventions
- Route modules: Follow Remix conventions (e.g., `admin.categories.$id.tsx`, `admin.hero-banners.new.tsx`)
- Components: PascalCase (e.g., `ProductList.tsx`, `HeroSlider.tsx`)
- Loaders/Actions: camelCase (e.g., `categoryLoader.ts`, `heroBannersLoader.ts`)
- Service classes: PascalCase with 'Service' suffix (e.g., `CategoryService.ts`, `HeroBannerService.server.ts`)
- Hooks: camelCase with 'use' prefix (e.g., `useProducts.ts`)
- Types: PascalCase with '.types' suffix (e.g., `product.types.ts`, `hero-banner.types.ts`)
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