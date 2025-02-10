import { useCallback, useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableCategoryItem } from './SortableCategoryItem';
import type { Category } from '../types/category.types';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '~/components/ui/table';

interface DraggableCategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isVisible: boolean) => void;
  onReorder: (updates: { id: string; position: number }[]) => Promise<void>;
}

export function DraggableCategoryList({
  categories,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
}: DraggableCategoryListProps) {
  const [items, setItems] = useState(categories);

  // Update items when categories prop changes
  useEffect(() => {
    setItems(categories);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Update sort orders in the database
      const updates = newItems.map((item, index) => ({
        id: item.id,
        position: index,
      }));

      try {
        await onReorder(updates);
      } catch (error) {
        // Revert the UI state if the update fails
        setItems(categories);
        console.error('Failed to update category positions:', error);
      }
    },
    [items, categories, onReorder]
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {items.map(category => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleActive={onToggleActive}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </div>
    </DndContext>
  );
}
