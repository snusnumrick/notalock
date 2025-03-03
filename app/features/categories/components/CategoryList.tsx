import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';
import { Pencil, Trash2, Star } from 'lucide-react';
import type { Category } from '../types/category.types';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { Badge } from '~/components/ui/badge';

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isVisible: boolean) => void;
}

export function CategoryList({ categories, onEdit, onDelete, onToggleActive }: CategoryListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Highlight</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map(category => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>{category.description}</TableCell>
              <TableCell>
                <Switch
                  checked={category.isVisible}
                  onCheckedChange={checked => onToggleActive(category.id, checked)}
                />
              </TableCell>
              <TableCell>
                {category.isHighlighted ? (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        <span>Priority: {category.highlightPriority}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Featured on Homepage</p>
                    </TooltipContent>
                  </Tooltip>
                ) : null}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
