import React from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { Link } from '@remix-run/react';
import { Category } from '../types/category.types';
import { Info } from 'lucide-react';

interface CategoryHighlightProps {
  categories: Category[];
  isLoading?: boolean;
  view?: 'grid' | 'list';
}

const CategoryHighlightSkeleton = ({ view = 'grid' }: { view?: 'grid' | 'list' }) => {
  const isGrid = view === 'grid';

  return (
    <Card className={`overflow-hidden ${!isGrid ? 'flex' : ''}`}>
      <div className={`${!isGrid ? 'w-1/4 min-w-48' : 'w-full'}`}>
        <Skeleton className="w-full h-32" />
      </div>
      <CardContent className={`p-6 ${!isGrid ? 'flex-1' : ''}`}>
        <Skeleton className="h-7 w-3/4 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState = () => (
  <Card className="p-8">
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Info className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Highlighted Categories</h3>
      <p className="text-muted-foreground mb-6">
        There are no highlighted categories to display at the moment. Highlighted categories will
        appear here once they are added.
      </p>
      <div className="w-full max-w-xs p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Tip: Categories can be highlighted from the admin panel under category management.
        </p>
      </div>
    </div>
  </Card>
);

const LoadingGrid = ({ view, count = 6 }: { view: 'grid' | 'list'; count?: number }) => {
  const containerClass =
    view === 'grid'
      ? 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 animate-fade-in'
      : 'flex flex-col gap-4 animate-fade-in';

  return (
    <div className={containerClass}>
      {[...Array(count)].map((_, index) => (
        <CategoryHighlightSkeleton key={index} view={view} />
      ))}
    </div>
  );
};

const CategoryCard = ({ category, view }: { category: Category; view: 'grid' | 'list' }) => {
  const isGrid = view === 'grid';

  return (
    <Link
      to={`/categories/${category.slug}`}
      className="group block hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <Card
        className={`overflow-hidden h-full bg-white hover:bg-gray-50 transition-colors ${
          !isGrid ? 'flex' : ''
        }`}
      >
        <CardContent className={`p-6 ${!isGrid ? 'flex-1' : ''}`}>
          <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-muted-foreground line-clamp-2">{category.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export const CategoryHighlightGrid: React.FC<CategoryHighlightProps> = ({
  categories,
  isLoading = false,
  view = 'grid',
}) => {
  const visibleHighlightedCategories = categories
    .filter(category => category.is_visible)
    .sort((a, b) => a.highlight_priority - b.highlight_priority);

  if (isLoading) {
    return <LoadingGrid view={view} />;
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
        <CategoryCard key={category.id} category={category} view={view} />
      ))}
    </div>
  );
};

export default CategoryHighlightGrid;
