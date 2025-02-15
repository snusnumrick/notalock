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
- Manage highlights
- Set highlight priority
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

### CategoryTreeView
Interactive tree visualization component:
```typescript
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CategoryNode } from './CategoryNode';

export const CategoryTreeView: React.FC<Props> = ({
  categories,
  selectedId,
  onSelect,
  onReorder
}) => {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (expanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  return (
    <div className="space-y-2">
      {categories.map(category => (
        <CategoryNode
          key={category.id}
          category={category}
          depth={0}
          isExpanded={expanded.has(category.id)}
          isSelected={category.id === selectedId}
          onToggleExpand={() => toggleExpand(category.id)}
          onSelect={() => onSelect(category.id)}
          onReorder={onReorder}
        />
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

### DraggableCategoryList
Enhanced list component with drag-and-drop support:
```typescript
import React from 'react';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

export const DraggableCategoryList: React.FC<Props> = ({
  items,
  onReorder
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor)
  );

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          onReorder(active.id, over.id);
        }
      }}
    >
      <SortableContext
        items={items}
        strategy={verticalListSortingStrategy}
      >
        {items.map(item => (
          <SortableItem key={item.id} item={item} />
        ))}
      </SortableContext>
    </DndContext>
  );
};
```

## Frontend State Management

### Category Store
```typescript
import create from 'zustand';
import { categoryService } from '../api/categoryService';

interface CategoryStore {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  selectedId: string | null;
  actions: {
    fetchCategories: () => Promise<void>;
    selectCategory: (id: string | null) => void;
    // ... other actions
  };
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  selectedId: null,
  actions: {
    fetchCategories: async () => {
      set({ isLoading: true });
      try {
        const categories = await categoryService.fetchCategories();
        set({ categories, isLoading: false });
      } catch (error) {
        set({ error, isLoading: false });
      }
    },
    selectCategory: (id) => {
      set({ selectedId: id });
    }
    // ... other actions
  }
}));
```

## Frontend Testing Strategy

### Component Tests
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryTreeView } from '../components/CategoryTreeView';

describe('CategoryTreeView', () => {
  it('expands/collapses categories on click', () => {
    render(<CategoryTreeView categories={mockCategories} />);
    
    const expandButton = screen.getByLabelText('Expand category');
    fireEvent.click(expandButton);
    
    expect(screen.getByText('Subcategory')).toBeVisible();
  });

  it('handles category selection', () => {
    const onSelect = jest.fn();
    render(<CategoryTreeView categories={mockCategories} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByText('Category 1'));
    expect(onSelect).toHaveBeenCalledWith('category-1-id');
  });
});
```

### User Interaction Tests
```typescript
describe('Category Management', () => {
  it('successfully reorders categories via drag and drop', async () => {
    render(<CategoryManagement />);
    
    const item = screen.getByText('Category 1');
    const target = screen.getByText('Category 2');
    
    await dragAndDrop(item, target);
    
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Category 2');
    expect(items[1]).toHaveTextContent('Category 1');
  });
});
```

## Frontend Performance Optimizations

### Tree Rendering
1. Virtual scrolling for large category trees
2. Memoization of category nodes
3. Optimistic updates for drag-and-drop
4. Efficient tree updates using immutable patterns
5. Lazy loading of subcategories

### Mobile Performance
1. Touch event debouncing
2. Progressive loading
3. Reduced tree depth on mobile
4. Optimized touch interactions
5. Efficient re-renders

### State Management
1. Normalized category data
2. Cached tree structure
3. Optimistic UI updates
4. Efficient tree traversal
5. Lazy state updates

## Accessibility

### Keyboard Navigation
1. Full keyboard support for tree navigation
2. ARIA roles and attributes
3. Focus management
4. Screen reader support
5. Keyboard shortcuts

### Mobile Accessibility
1. Proper touch targets
2. Clear visual feedback
3. Gesture alternatives
4. Voice-over support
5. High contrast support