import { Category } from '../types/category.types';
import { CategoryTreeView } from './CategoryTreeView';
import { DraggableCategoryList } from './DraggableCategoryList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Card } from '~/components/ui/card';

interface CategorySplitViewProps {
  categories: Category[];
  selectedCategoryId?: string;
  onSelectCategory: (category: Category) => void;
  onSelectionChange?: (selectedCategories: Category[]) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onReorder: (updates: { id: string; position: number }[]) => void;
}

export function CategorySplitView({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
  onSelectionChange,
}: CategorySplitViewProps) {
  return (
    <div className="space-y-4">
      {/* Desktop view: Side by side */}
      <div className="hidden md:grid grid-cols-2 gap-6">
        <Card className="h-[calc(100vh-12rem)] overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Category Tree</h3>
            <CategoryTreeView
              categories={categories}
              onSelectCategory={onSelectCategory}
              selectedCategoryId={selectedCategoryId}
              idPrefix="desktop"
            />
          </div>
        </Card>
        <Card className="h-[calc(100vh-12rem)] overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Category List</h3>
            <DraggableCategoryList
              categories={categories}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
              onReorder={onReorder}
              onSelectionChange={onSelectionChange}
            />
          </div>
        </Card>
      </div>

      {/* Mobile view: Tabs */}
      <Tabs defaultValue="tree" className="md:hidden">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tree">Tree View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="tree" className="mt-4">
          <Card>
            <div className="p-4">
              <CategoryTreeView
                categories={categories}
                onSelectCategory={onSelectCategory}
                selectedCategoryId={selectedCategoryId}
                idPrefix="mobile"
              />
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <Card>
            <div className="p-4">
              <DraggableCategoryList
                categories={categories}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
                onReorder={onReorder}
                onSelectionChange={onSelectionChange}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
