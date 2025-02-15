# Category Management Feature

## Overview
The category management feature in Notalock provides a user interface for organizing products in a hierarchical structure. This document focuses on the frontend implementation, component architecture, and user interactions.

For API implementation details, see [Category Management API](../api/category-management.md).
For database schema details, see [Database Documentation](../database.md#categories).

## User Interface Features

### Hierarchical Tree View
- Visual representation of category hierarchy
- Expandable/collapsible nodes
- Visual indicators for:
  - Nesting levels
  - Visibility status
  - Highlight status
  - Sort order
- Drag handles for reordering
- Selection indicators

### Category Actions
- Create new categories
- Edit existing categories
- Delete categories with confirmation
- Toggle visibility
- Manage highlights and priority
- Reorder via drag-and-drop

### Mobile Interface
- Touch-friendly drag handles
- Responsive layout adjustments
- Gesture-based interactions
- Optimized touch targets
- Mobile-specific navigation

## Component Architecture

### CategoryManagement
Main orchestrator component:
```typescript
import React from 'react';
import { CategorySplitView } from './CategorySplitView';
import { useCategoryStore } from '../stores/categoryStore';

export const CategoryManagement: React.FC = () => {
  const {
    categories,
    isLoading,
    error,
    actions
  } = useCategoryStore();

  if (isLoading) return <div>Loading categories...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="h-full">
      <CategorySplitView
        categories={categories}
        onCreateCategory={actions.createCategory}
        onUpdateCategory={actions.updateCategory}
        onDeleteCategory={actions.deleteCategory}
        onReorderCategories={actions.reorderCategories}
      />
    </div>
  );
};
```

### CategorySplitView
Layout component that manages the split view between tree and form:
```typescript
import React from 'react';
import { CategoryTreeView } from './CategoryTreeView';
import { CategoryForm } from './CategoryForm';

export const CategorySplitView: React.FC<Props> = ({
  categories,
  selectedCategory,
  onSelect,
  ...actions
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      <div className="overflow-auto border rounded-lg p-4">
        <CategoryTreeView
          categories={categories}
          selectedId={selectedCategory?.id}
          onSelect={onSelect}
          {...actions}
        />
      </div>
      <div className="overflow-auto border rounded-lg p-4">
        <CategoryForm
          category={selectedCategory}
          categories={categories}
          {...actions}
        />
      </div>
    </div>
  );
};
```

### CategoryHighlightGrid
Frontend grid/list component for displaying highlighted categories:
```typescript
import React from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { Link } from '@remix-run/react';
import { Category } from '../types/category.types';

export const CategoryHighlightGrid: React.FC<Props> = ({
  categories,
  isLoading = false,
  view = 'grid'
}) => {
  const visibleHighlightedCategories = categories
    .filter(category => category.is_visible && category.is_highlighted)
    .sort((a, b) => a.highlight_priority - b.highlight_priority);

  if (isLoading) {
    return (
      <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}`}>
        {[...Array(6)].map((_, index) => (
          <CategoryHighlightSkeleton key={index} view={view} />
        ))}
      </div>
    );
  }

  return (
    <div className={getLayoutClass(view)}>
      {visibleHighlightedCategories.map(category => (
        <Link to={`/categories/${category.slug}`} key={category.id}>
          <Card className="h-full">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-muted-foreground line-clamp-2">
                  {category.description}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};
```

### CategoryForm
Form component for category creation and editing:
```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export const CategoryForm: React.FC<Props> = ({
  category,
  onSubmit
}) => {
  const form = useForm({
    defaultValues: category || {
      name: '',
      description: '',
      is_visible: true,
      is_highlighted: false,
      highlight_priority: 0
    }
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Name"
        {...form.register('name', { required: true })}
      />
      <textarea
        label="Description"
        {...form.register('description')}
        className="w-full h-32"
      />
      <Switch
        label="Visible"
        {...form.register('is_visible')}
      />
      <Switch
        label="Highlighted"
        {...form.register('is_highlighted')}
      />
      {form.watch('is_highlighted') && (
        <Input
          type="number"
          label="Priority"
          {...form.register('highlight_priority')}
        />
      )}
      <button type="submit" className="btn-primary">
        Save Changes
      </button>
    </form>
  );
};
```

[Rest of file remains the same...]