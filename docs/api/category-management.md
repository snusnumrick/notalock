# Category Management API

## Overview
The category management API in Notalock provides interfaces for:
1. Hierarchical category CRUD operations
2. Category tree management
3. Category highlighting and visibility
4. Sort order management

## Components

### CategoryService
Located at: `/app/features/categories/api/categoryService.ts`

Main service class for category operations:

```typescript
const categoryService = new CategoryService(supabaseClient);

// Fetch categories
const categories = await categoryService.fetchCategories();

// Create category
const newCategory = await categoryService.createCategory({
  name: "Door Handles",
  description: "Premium door handles and levers",
  parent_id: parentId,
  is_visible: true
});
```

### Types
Located at: `/app/features/categories/types/category.types.ts`

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_visible: boolean;
  is_highlighted: boolean;
  highlight_priority: number;
  parent_id?: string | null;
  created_at?: string;
  updated_at?: string;
  children?: Category[];
}

interface CategoryFormData {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: string | null;
  sort_order: number;
  is_visible: boolean;
  is_highlighted: boolean;
  highlight_priority: number;
}
```

## API Methods

### Fetching Categories

#### Get All Categories
```typescript
async fetchCategories(): Promise<Category[]>
```
Retrieves all categories ordered by sort_order.

Example:
```typescript
const categories = await categoryService.fetchCategories();
```

#### Get Highlighted Categories
```typescript
async fetchHighlightedCategories(): Promise<Category[]>
```
Retrieves highlighted categories ordered by priority.

Example:
```typescript
const highlighted = await categoryService.fetchHighlightedCategories();
```

#### Get Category Tree
```typescript
async fetchCategoryTree(): Promise<CategoryNode[]>
```
Retrieves categories in a hierarchical structure.

Example:
```typescript
const tree = await categoryService.fetchCategoryTree();
```

### Category Management

#### Create Category
```typescript
async createCategory(data: CategoryFormData): Promise<Category>
```
Creates a new category with automatic slug generation.

Example:
```typescript
const category = await categoryService.createCategory({
  name: "Smart Locks",
  description: "Electronic and smart locking systems",
  parent_id: null,
  sort_order: 0,
  is_visible: true,
  is_highlighted: false,
  highlight_priority: 0
});
```

#### Update Category
```typescript
async updateCategory(id: string, data: Partial<CategoryFormData>): Promise<Category>
```
Updates an existing category.

Example:
```typescript
const updated = await categoryService.updateCategory(id, {
  name: "Updated Name",
  description: "Updated description"
});
```

#### Delete Category
```typescript
async deleteCategory(id: string): Promise<void>
```
Deletes a category.

Example:
```typescript
await categoryService.deleteCategory(id);
```

### Sort Order Management

#### Update Positions
```typescript
async updatePositions(updates: { id: string; position: number }[]): Promise<void>
```
Updates sort order for multiple categories.

Example:
```typescript
await categoryService.updatePositions([
  { id: "cat1", position: 0 },
  { id: "cat2", position: 1 }
]);
```

### Highlight Management

#### Update Highlight Status
```typescript
async updateHighlightStatus(
  categoryIds: string[], 
  isHighlighted: boolean
): Promise<void>
```
Updates highlight status for multiple categories.

Example:
```typescript
await categoryService.updateHighlightStatus(
  ["cat1", "cat2"],
  true
);
```

#### Update Highlight Priority
```typescript
async updateHighlightPriority(
  categoryId: string,
  priority: number
): Promise<void>
```
Updates priority for a highlighted category.

Example:
```typescript
await categoryService.updateHighlightPriority("cat1", 1);
```

## Error Handling

The API implements consistent error handling:
- All methods throw errors with descriptive messages
- Database errors are wrapped in user-friendly messages
- Validation is performed before database operations
- Constraint violations are properly handled

Example:
```typescript
try {
  await categoryService.updateHighlightPriority(id, -1);
} catch (error) {
  // Handles: "Priority must be non-negative"
}
```

## Best Practices

### Tree Operations
- Always validate parent-child relationships
- Prevent circular references
- Maintain sort order consistency
- Use transactions for complex operations
- Cache tree structure when appropriate

### Highlight Management
- Validate priority values
- Update priorities in batch when possible
- Consider performance of highlighted queries
- Maintain priority uniqueness
- Handle priority conflicts

### Performance
- Use appropriate indexes
- Batch updates when possible
- Implement proper caching
- Monitor query performance
- Use optimistic updates in UI

## Security Considerations

The API respects row-level security policies:
- Public read access for visible categories
- Admin-only write access
- Proper permission validation
- Audit logging
- Input sanitization

For detailed security policies, see [Database Documentation](../database/schema.md#categories).

## Future Improvements

### Enhanced Features
- Batch operations
- Category merging
- Import/export functionality
- Advanced search
- Versioning support

### Performance Enhancements
- Improved caching
- Query optimization
- Bulk operations
- Real-time updates
- Advanced indexing