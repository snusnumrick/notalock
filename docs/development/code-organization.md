# Code Organization

## Remix Project Structure
```
notalock/
├── app/                  # Remix application code
│   ├── root.tsx         # Root route
│   ├── entry.client.tsx # Client entry
│   ├── entry.server.tsx # Server entry
│   ├── __mocks__/       # Test mocks
│   ├── components/      # Shared components
│   │   ├── common/      # Common utility components
│   │   ├── debug/       # Debugging components
│   │   ├── features/    # Feature-specific shared components
│   │   └── ui/          # shadcn/ui components and customizations
│   ├── config/          # Configuration files
│   ├── data/            # Data-related files
│   ├── features/        # Feature modules
│   │   ├── cart/        # Shopping cart feature
│   │   ├── categories/  # Category management
│   │   ├── checkout/    # Checkout process feature
│   │   ├── hero-banners/# Hero banner/slider
│   │   ├── orders/      # Order management
│   │   ├── payment/     # Payment processing
│   │   ├── products/    # Product management
│   │   └── supabase/    # Supabase integration
│   ├── hooks/           # Shared React hooks
│   ├── lib/             # Library code and utilities
│   ├── routes/          # Route modules
│   │   ├── __tests__/   # Route tests
│   │   ├── _layout.tsx  # Main layout route
│   │   ├── _layout._index.tsx # Index route
│   │   ├── api/         # API routes
│   │   │   ├── payment/ # Payment API endpoints
│   │   │   └── webhooks/# Payment webhook handlers
│   │   ├── admin/       # Admin routes
│   │   └── products/    # Product routes
│   ├── server/          # Server-side code
│   ├── styles/          # Global styles
│   ├── test/            # Test utilities
│   ├── types/           # Global TypeScript types
│   └── utils/           # Utility functions
├── public/              # Static assets
├── docs/                # Documentation
├── supabase/            # Supabase configuration
├── tests/               # End-to-end and integration tests
├── coverage/            # Test coverage reports
└── hooks/               # Git hooks and other hooks
```

## Core Directory Structure

### Route Organization and Conventions
- Routes follow Remix file-based routing conventions with some project-specific patterns
- Route patterns:
- `_layout.tsx` - Main layout route
- `_layout._index.tsx` - Site index route
- `_layout.[page].tsx` - Pages using the main layout (about, cart, etc.)
    - Multi-step flows:
      - `_layout.checkout.tsx` - Main checkout router
      - `_layout.checkout.[step].tsx` - Individual checkout steps (information, shipping, payment, etc.)
      - `_layout.checkout.confirmation.tsx` - Order confirmation page
  - Admin section:
    - `admin.tsx` - Admin layout
    - `admin.products.tsx` - Admin products management
    - `admin.hero-banners.tsx` - Hero banners listing
    - `admin.hero-banners.new.tsx` - Create new hero banner
    - `admin.hero-banners.$id.edit.tsx` - Edit existing hero banner
  - Product routes:
    - `products.tsx` - Products layout
    - `products._index.tsx` - Products list page
    - `products.category.$slug.tsx` - Category page
    - `products.category.$parentSlug.$slug.tsx` - Nested category page
    - `products.category.$grandparentSlug.$parentSlug.$slug.tsx` - Deep nested category page
  - API routes:
    - `api.[endpoint].tsx/ts` - API endpoints (e.g., `api.cart.tsx`, `api.upload-product-image.ts`)
    - `api/payment/` - Payment processing API endpoints
    - `api/webhooks/` - Webhook handlers for payment providers
- Loaders and actions defined in route modules
- Complex logic moved to feature modules

### Component Organization
- `app/components/`: Application-wide shared components
  - `common/`: Shared utility components
  - `debug/`: Debugging components
  - `features/`: Feature-specific shared components
  - `ui/`: shadcn/ui components and customizations

### Configuration Organization
- `app/config/`: Application-wide configuration
  - `image-optimization.ts`: Image processing configuration
  - `pagination/`: Pagination-related configuration
    - `constants.ts`: Page size limits and options

### Feature Module Structure
Each feature module is organized as:
```
feature/
├── api/                # API and loader/action functions
│   ├── loaders.ts     # Data fetching functions
│   ├── actions.ts     # Data modification functions
│   └── service.ts     # Service classes
├── components/         # Route and shared components
│   ├── admin/         # Admin-specific components
│   └── public/        # Public-facing components
├── utils/              # Feature-specific utilities
└── types/              # TypeScript types and interfaces
```

Some feature modules may also include:
```
feature/
├── __tests__/          # Feature-specific tests
├── hooks/              # Custom React hooks
└── utils/              # Helper functions and utilities
```

Example implementation: The payment feature module contains:
```
payment/
├── components/         # Payment form components
│   ├── PaymentSelector.tsx
│   └── providers/     # Provider-specific components
│       ├── SquarePaymentForm.tsx
│       └── StripePaymentForm.tsx
├── config/            # Payment configuration
│   └── paymentConfig.server.ts
├── errors/            # Error handling
│   └── PaymentError.ts
├── providers/         # Provider implementations
│   ├── PaymentProviderInterface.ts
│   ├── SquarePaymentProvider.ts
│   └── StripePaymentProvider.ts
├── receipts/          # Receipt generation
│   └── ReceiptGenerator.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── utils/             # Utility functions
│   └── sdkLoader.ts
├── PaymentService.ts  # Main service facade
└── initializePayment.server.ts
```

## File Naming Conventions
- Layout routes: Start with `_layout` (e.g., `_layout.tsx`, `_layout.about.tsx`)
- Admin routes: Start with `admin.` (e.g., `admin.products.tsx`, `admin.hero-banners.new.tsx`)
- API routes: Start with `api.` (e.g., `api.cart.tsx`, `api.upload-product-image.ts`)
- Route parameters: Use `$` prefix (e.g., `products.$slug.tsx`, `admin.hero-banners.$id.edit.tsx`)
- Components: PascalCase (e.g., `ProductList.tsx`, `HeroSlider.tsx`)
- Loaders/Actions: camelCase (e.g., `categoryLoader.ts`, `heroBannersLoader.ts`)
- Service classes: PascalCase with 'Service' suffix (e.g., `CategoryService.ts`, `HeroBannerService.server.ts`)
- Interface files: PascalCase with 'Interface' suffix (e.g., `PaymentProviderInterface.ts`)
- Configuration files: camelCase with descriptive names (e.g., `paymentConfig.server.ts`)
- Server-only files: Use `.server.ts` suffix to indicate server-only usage

## Test Organization
- Route tests: In `routes/__tests__`
- Feature tests: May be in feature-specific `__tests__` directories
- Unit tests: Co-located with source files or in test directories
- Integration tests: In root `tests` directory
- Test mocks: In `app/__mocks__`

## Database Organization
- Migrations: In `supabase/migrations`
- Follow timestamp-based naming: `{timestamp}_{description}.sql`