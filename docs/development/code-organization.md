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
│   │   │   │   └── CategoryManagement.test.tsx # Management tests
│   │   │   ├── api/      # Category-specific API
│   │   │   │   └── categoryService.ts     # Core category operations
│   │   │   ├── components/  # Category components
│   │   │   │   ├── CategoryForm.tsx           # Category editing
│   │   │   │   ├── CategoryList.tsx           # Basic category list view
│   │   │   │   ├── DraggableCategoryList.tsx  # Draggable category list with reordering
│   │   │   │   ├── SortableCategoryItem.tsx   # Individual draggable category item
│   │   │   │   └── CategoryManagement.tsx     # Main category view
│   │   │   ├── hooks/    # Category-specific hooks
│   │   │   │   └── useCategories.ts # Category management hook
│   │   │   └── types/    # Category types
│   │   │       └── category.types.ts # Category interfaces
│   │   └── products/   # Product management
[Rest of the file content remains the same...]