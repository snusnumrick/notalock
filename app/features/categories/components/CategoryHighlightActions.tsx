import { useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Category } from '../types/category.types';
import { ChevronsUpDown } from 'lucide-react';

interface CategoryHighlightActionsProps {
  selectedCategories: Category[];
  onHighlight: (categoryIds: string[], highlight: boolean) => Promise<void>;
  onUpdatePriority: (categoryId: string, priority: number) => Promise<void>;
}

export function CategoryHighlightActions({
  selectedCategories,
  onHighlight,
  onUpdatePriority,
}: CategoryHighlightActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleHighlightAction = async (highlight: boolean) => {
    if (selectedCategories.length === 0 || isUpdating) return;

    setIsUpdating(true);
    try {
      const categoryIds = selectedCategories.map(cat => cat.id);
      await onHighlight(categoryIds, highlight);
    } catch (error) {
      console.error('Error updating highlights:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityAction = async (adjustment: number) => {
    if (selectedCategories.length === 0 || isUpdating) return;

    setIsUpdating(true);
    try {
      // Update priorities sequentially
      for (const category of selectedCategories) {
        const newPriority = Math.max(0, (category.highlightPriority || 0) + adjustment);
        await onUpdatePriority(category.id, newPriority);
      }
    } catch (error) {
      console.error('Error updating priorities:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const anyHighlighted = selectedCategories.some(cat => cat.isHighlighted);
  const allHighlighted =
    selectedCategories.length > 0 && selectedCategories.every(cat => cat.isHighlighted);

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => handleHighlightAction(!allHighlighted)}
        disabled={isUpdating || selectedCategories.length === 0}
      >
        {allHighlighted ? 'Remove from Highlights' : 'Add to Highlights'}
      </Button>

      {anyHighlighted && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isUpdating || selectedCategories.length === 0}>
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              Adjust Priority
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handlePriorityAction(1)}>
              Increase Priority (+1)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityAction(5)}>
              Increase Priority (+5)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityAction(-1)}>
              Decrease Priority (-1)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlePriorityAction(-5)}>
              Decrease Priority (-5)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
