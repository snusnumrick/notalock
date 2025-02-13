# Code Organization

## Project Structure
```
notalock/
├── app/
│   ├── __mocks__/      # Test mocks
│   │   └── web-encoding.ts  # Web Encoding API mocks
│   ├── components/
│   │   ├── common/     # Shared components
│   │   ├── features/   # Feature-specific components
│   │   └── ui/         # UI components (shadcn/ui)
│   ├── config/         # Configuration files
│   ├── features/       # Feature modules
│   │   ├── categories/ # Category management
│   │   │   ├── __tests__/  # Category feature tests
│   │   │   │   ├── categoryService.test.ts    # Service tests
│   │   │   │   ├── CategoryForm.test.tsx      # Form tests
│   │   │   │   ├── CategoryList.test.tsx      # List tests
│   │   │   │   ├── DraggableCategoryList.test.tsx  # Drag-and-drop tests
│   │   │   │   ├── CategoryTreeView.test.tsx  # Tree view tests
│   │   │   │   ├── CategorySplitView.test.tsx # Split view tests
│   │   │   │   └── CategoryManagement.test.tsx # Management tests
│   │   │   ├── api/      # Category-specific API
│   │   │   │   └── categoryService.ts     # Core category operations
│   │   │   ├── components/  # Category components
│   │   │   │   ├── CategoryForm.tsx           # Category editing
│   │   │   │   ├── CategoryList.tsx           # Basic category list view
│   │   │   │   ├── DraggableCategoryList.tsx  # Draggable category list with reordering
│   │   │   │   ├── SortableCategoryItem.tsx   # Individual draggable category item
│   │   │   │   ├── CategoryTreeView.tsx       # Hierarchical tree visualization
│   │   │   │   ├── CategorySplitView.tsx      # Combined tree and list view
│   │   │   │   └── CategoryManagement.tsx     # Main category view
│   │   │   ├── hooks/    # Category-specific hooks
│   │   │   │   └── useCategories.ts # Category management hook
│   │   │   └── types/    # Category types
│   │   │       └── category.types.ts # Category interfaces
│   │   └── products/   # Product management
│   │       ├── api/    # Product-specific API
│   │       │   ├── productService.ts     # Core product operations
│   │       │   ├── productImageService.ts # Image management
│   │       │   └── variantService.ts     # Variant management
│   │       ├── components/  # Product components
│   │       │   ├── shared/  # Shared product components
│   │       │       └── DraggableGalleryWrapper.tsx # Draggable gallery component
│   │       │   ├── ProductForm.tsx       # Product editing
│   │       │   ├── ProductManagement.tsx # Product list view
│   │       │   ├── ProductSearch.tsx     # Advanced search
│   │       │   ├── BulkOperations.tsx    # Bulk actions
│   │       │   ├── VariantForm.tsx       # Variant editing
│   │       │   ├── VariantManagement.tsx # Variant management
│   │       │   └── FeaturedProducts.tsx  # Featured products section
│   │       ├── hooks/   # Product-specific hooks
│   │       │   └── useVariants.ts   # Variant management hook
│   │       ├── types/   # Product types
│   │       │   ├── product.types.ts # Product interfaces
│   │       │   └── variant.types.ts # Variant interfaces
│   │       └── utils/   # Product utilities
[Rest of the content remains the same...]