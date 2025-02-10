import React from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { Category } from '../types/category.types';
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';

interface CategoryTreeViewProps {
  categories: Category[];
  onSelectCategory?: (category: Category) => void;
  selectedCategoryId?: string;
  idPrefix?: string;
}

interface CategoryNodeProps {
  category: Category;
  level: number;
  onSelectCategory?: (category: Category) => void;
  selectedCategoryId?: string;
  idPrefix?: string;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  level,
  onSelectCategory,
  selectedCategoryId,
  idPrefix,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasChildren = category.children && category.children.length > 0;

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onSelectCategory?.(category);
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer',
          selectedCategoryId === category.id && 'bg-blue-50 hover:bg-blue-100',
          !category.is_visible && 'opacity-50'
        )}
        style={{ paddingLeft: `${level * 1.5}rem` }}
        onClick={handleSelect}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleSelect();
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={hasChildren ? isExpanded : undefined}
        data-testid={`${idPrefix ? `${idPrefix}-` : ''}category-${category.id}`}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleToggle(e);
              }
            }}
            className="p-1 hover:bg-gray-200 rounded"
            aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <span className="w-6" /> // Spacing for alignment
        )}

        {isExpanded ? (
          <FolderOpen className="w-5 h-5 mr-2 text-blue-500" />
        ) : (
          <Folder className="w-5 h-5 mr-2 text-blue-500" />
        )}

        <span className="truncate">{category.name}</span>

        {!category.is_visible && <span className="ml-2 text-sm text-gray-500">(Hidden)</span>}
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-2" role="group" aria-label={`${category.name} subcategories`}>
          {category.children?.map(child => (
            <CategoryNode
              key={child.id}
              category={child}
              level={level + 1}
              onSelectCategory={onSelectCategory}
              selectedCategoryId={selectedCategoryId}
              idPrefix={idPrefix}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryTreeView: React.FC<CategoryTreeViewProps> = ({
  categories,
  onSelectCategory,
  selectedCategoryId,
  idPrefix,
}) => {
  // Build the tree structure
  const buildTree = (flatCategories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const tree: Category[] = [];

    // First pass: Create category objects and handle direct children
    flatCategories.forEach(category => {
      const categoryWithChildren = {
        ...category,
        children: category.children || [],
      };
      categoryMap.set(category.id, categoryWithChildren);

      if (!category.parent_id) {
        tree.push(categoryWithChildren);
      }
    });

    // Second pass: Handle parent_id references for categories without direct children
    flatCategories.forEach(category => {
      if (category.parent_id && !category.children) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          // Only add if not already present as a direct child
          if (!parent.children.some(child => child.id === category.id)) {
            parent.children.push(categoryMap.get(category.id) || category);
          }
        } else {
          // If no parent found, add to root level
          tree.push(categoryMap.get(category.id) || category);
        }
      }
    });

    // Sort function
    const sortByOrder = (categories: Category[]) => {
      categories.sort((a, b) => a.sort_order - b.sort_order);
      categories.forEach(category => {
        if (category.children?.length) {
          sortByOrder(category.children);
        }
      });
    };

    sortByOrder(tree);
    return tree;
  };

  const treeData = buildTree(categories);

  return (
    <Card>
      <CardContent className="p-4">
        {treeData.map(category => (
          <CategoryNode
            key={category.id}
            category={category}
            level={0}
            onSelectCategory={onSelectCategory}
            selectedCategoryId={selectedCategoryId}
            idPrefix={idPrefix}
          />
        ))}
        {treeData.length === 0 && (
          <div className="text-gray-500 text-center py-4">No categories found</div>
        )}
      </CardContent>
    </Card>
  );
};

export { CategoryTreeView };
