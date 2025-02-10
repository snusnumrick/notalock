import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableCell, TableRow } from '~/components/ui/table';
import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { Category } from '../types/category.types';

interface SortableCategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isVisible: boolean) => void;
}

export function SortableCategoryItem({
  category,
  onEdit,
  onDelete,
  onToggleActive,
}: SortableCategoryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isDragging ? 'var(--background-muted)' : undefined,
    cursor: 'grab',
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="cursor-grab touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell className="font-medium" data-testid="category-name">
        {category.name}
      </TableCell>
      <TableCell>{category.description}</TableCell>
      <TableCell>
        <Switch
          checked={category.is_visible}
          onCheckedChange={checked => onToggleActive(category.id, checked)}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit category"
            onClick={() => onEdit(category)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete category"
            onClick={() => onDelete(category.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
