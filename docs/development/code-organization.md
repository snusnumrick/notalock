# Code Organization

## Project Structure
```
notalock/
├── app/                   # Main application code
│   ├── __mocks__/        # Test mocks
│   │   └── web-encoding.ts
│   ├── components/
│   │   ├── common/       # Shared components
│   │   ├── features/     # Feature-specific components
│   │   └── ui/           # UI components (shadcn/ui)
│   ├── config/           # Configuration files
│   ├── features/         # Feature modules
│   │   ├── categories/   # Category management
│   │   │   ├── __tests__/
│   │   │   ├── api/
│   │   │   │   └── categoryService.ts
│   │   │   ├── components/
│   │   │   │   ├── CategoryForm.tsx
│   │   │   │   ├── CategoryList.tsx
│   │   │   │   ├── DraggableCategoryList.tsx
│   │   │   │   ├── SortableCategoryItem.tsx
│   │   │   │   ├── CategoryTreeView.tsx
│   │   │   │   ├── CategorySplitView.tsx
│   │   │   │   └── CategoryManagement.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useCategories.ts
│   │   │   └── types/
│   │   │       └── category.types.ts
│   │   └── products/    # Product management
│   │       ├── api/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── types/
│   │       └── utils/
├── docs/                 # Documentation
│   ├── development/     # Development guides
│   │   ├── code-organization.md
│   │   └── claude-instructions.md
│   └── roadmap/        # Project roadmap
│       └── development-plan.md
├── supabase/           # Supabase configuration
│   └── migrations/     # Database migrations
├── tests/              # End-to-end and integration tests
├── coverage/           # Test coverage reports
└── public/             # Static assets
```

## Feature Module Structure
Each feature module (e.g., categories, products) follows a consistent structure:

```
feature/
├── __tests__/          # Feature-specific tests
├── api/                # API services and data access
├── components/         # React components
│   └── shared/         # Components shared within the feature
├── hooks/              # Custom React hooks
├── types/              # TypeScript types and interfaces
└── utils/              # Helper functions and utilities
```

## Component Organization
- `components/common/`: Shared components used across multiple features
- `components/features/`: Feature-specific components that don't fit in feature modules
- `components/ui/`: shadcn/ui components and their customizations

## Test Organization
- Unit tests: Co-located with source files in `__tests__` directories
- Integration tests: In the root `tests` directory
- E2E tests: In the root `tests/e2e` directory
- Test mocks: In `app/__mocks__`

## Database Management
- Migrations: Located in `supabase/migrations/`
- Naming convention: `{timestamp}_{description}.sql`
