import { useState, useEffect, useCallback } from 'react';
import { Button } from '~/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog';
import { CategoryForm } from './CategoryForm';
import { DraggableCategoryList } from './DraggableCategoryList';
import { CategoryService } from '../services/categoryService';
import type { Category, CategoryFormData } from '../types/category.types';
import { useToast } from '~/hooks/use-toast';

interface CategoryManagementProps {
  categoryService: CategoryService;
}

export function CategoryManagement({ categoryService }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoryService.fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    }
  }, [categoryService, toast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreate = async (data: CategoryFormData) => {
    try {
      await categoryService.createCategory(data);
      await loadCategories();
      setIsDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Category created successfully',
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: CategoryFormData) => {
    if (!selectedCategory) return;

    try {
      await categoryService.updateCategory(selectedCategory.id, data);
      await loadCategories();
      setIsDialogOpen(false);
      setSelectedCategory(null);
      toast({
        title: 'Success',
        description: 'Category updated successfully',
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryService.deleteCategory(id);
      await loadCategories();
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await categoryService.updateCategory(id, { is_visible: isActive });
      await loadCategories();
      toast({
        title: 'Success',
        description: `Category ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating category status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category status',
        variant: 'destructive',
      });
    }
  };

  const handleReorder = async (updates: { id: string; position: number }[]) => {
    try {
      await categoryService.updatePositions(updates);
      await loadCategories();
      toast({
        title: 'Success',
        description: 'Category order updated successfully',
      });
    } catch (error) {
      console.error('Error updating category positions:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category order',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCategory(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <DraggableCategoryList
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        onReorder={handleReorder}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? 'Edit the details of the existing category.'
                : 'Create a new category by filling out the form below.'}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            initialData={selectedCategory || {}}
            onSubmit={selectedCategory ? handleUpdate : handleCreate}
            categories={categories.filter(cat => cat.id !== selectedCategory?.id)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
