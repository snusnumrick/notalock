import React from 'react';
import { Button } from '~/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ view, onViewChange }) => {
  return (
    <div className="flex gap-2">
      <Button
        variant={view === 'grid' ? 'default' : 'outline'}
        size="icon"
        onClick={() => onViewChange('grid')}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={view === 'list' ? 'default' : 'outline'}
        size="icon"
        onClick={() => onViewChange('list')}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};
