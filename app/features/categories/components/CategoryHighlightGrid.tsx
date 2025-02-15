// app/features/categories/components/CategoryHighlightGrid.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';
import { Category } from '../types/category.types';

interface CategoryHighlightProps {
  categories: Category[];
  isLoading?: boolean;
  view?: 'grid' | 'list';
}

const CategoryHighlightSkeleton = ({ view = 'grid' }: { view?: 'grid' | 'list' }) => {
  return (
    <Card className={`overflow-hidden ${view === 'list' ? 'flex gap-4' : ''}`}>
      <div className={`relative ${view === 'grid' ? 'h-48' : 'h-24 w-24'}`}>
        <Skeleton className="h-full w-full" />
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
    </Card>
  );
};

const EmptyState = () => (
  <Card className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">No Highlighted Categories</h3>
    <p className="text-muted-foreground">
      There are no highlighted categories to display at the moment.
    </p>
  </Card>
);

export const CategoryHighlightGrid: React.FC<CategoryHighlightProps> = ({
  categories,
  isLoading = false,
  view = 'grid',
}) => {
  // Filter only visible and highlighted categories, sorted by highlight_priority
  const visibleHighlightedCategories = categories
    .filter(category => category.is_visible && category.is_highlighted)
    .sort((a, b) => a.highlight_priority - b.highlight_priority);

  if (isLoading) {
    return (
      <div
        className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}`}
      >
        {[...Array(6)].map((_, index) => (
          <CategoryHighlightSkeleton key={index} view={view} />
        ))}
      </div>
    );
  }

  if (!visibleHighlightedCategories || visibleHighlightedCategories.length === 0) {
    return <EmptyState />;
  }

  const containerClass =
    view === 'grid'
      ? 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      : 'flex flex-col gap-4';

  return (
    <div className={containerClass}>
      {visibleHighlightedCategories.map(category => (
        <Link
          href={`/categories/${category.slug}`}
          key={category.id}
          className="group hover:opacity-90 transition-opacity"
        >
          <Card className={`overflow-hidden ${view === 'list' ? 'flex gap-4' : ''}`}>
            <div className={`relative ${view === 'grid' ? 'h-48' : 'h-24 w-24'}`}>
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes={
                    view === 'grid'
                      ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                      : '96px'
                  }
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default CategoryHighlightGrid;
