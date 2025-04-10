import React from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { Link } from '@remix-run/react';
import { Category } from '../types/category.types';
import { Info, ArrowRight, LayoutPanelTop } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface CategoryHighlightProps {
  categories: Category[];
  isLoading?: boolean;
  view?: 'grid' | 'list';
}

const CategoryHighlightSkeleton = ({ view = 'grid' }: { view?: 'grid' | 'list' }) => {
  const isGrid = view === 'grid';
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className={`overflow-hidden ${!isGrid && isMounted ? 'flex' : ''}`}>
      <div className={`${!isGrid && isMounted ? 'w-1/4 min-w-48' : 'w-full'}`}>
        <Skeleton className="w-full h-32" />
      </div>
      <CardContent className={`p-6 ${!isGrid && isMounted ? 'flex-1' : ''}`}>
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
      <h3 className="text-xl font-semibold mb-2 text-text-primary">No Highlighted Categories</h3>
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

  // Use React's useEffect for client-side only styling
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Link
      to={`/products/category/${category.slug}`}
      className="group block hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <Card
        className={`overflow-hidden h-full bg-product-card hover:shadow-md transition-all ${
          !isGrid && isMounted ? 'flex' : ''
        } group-hover:border-blue-200 border border-border`}
      >
        <div
          className={`${
            !isGrid && isMounted
              ? 'hidden md:flex w-16 bg-gradient-to-r from-product-hover to-product-hover/70 items-center justify-center'
              : 'h-16 bg-gradient-to-r from-product-hover to-product-hover/70 flex items-center justify-center'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-product-card shadow-sm flex items-center justify-center text-btn-primary">
            <LayoutPanelTop className="w-5 h-5" />
          </div>
        </div>
        <CardContent className={`p-6 ${!isGrid && isMounted ? 'flex-1' : ''}`}>
          <h3 className="text-xl font-semibold mb-3 text-text-primary group-hover:text-btn-primary transition-colors flex items-center justify-between">
            {category.name}
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-btn-primary" />
          </h3>
          {category.description && (
            <p className="text-text-secondary line-clamp-2 mb-4">{category.description}</p>
          )}
          <div className="mt-2">
            <span className="text-sm text-btn-primary font-medium group-hover:underline">
              Browse Products
            </span>
          </div>
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
    .filter(category => category.isVisible)
    .sort((a, b) => {
      // Handle null values by placing them at the end
      if (a.highlightPriority === null && b.highlightPriority === null) return 0;
      if (a.highlightPriority === null) return 1;
      if (b.highlightPriority === null) return -1;
      return a.highlightPriority - b.highlightPriority;
    });

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
    <div>
      <div className={containerClass}>
        {visibleHighlightedCategories.map(category => (
          <CategoryCard key={category.id} category={category} view={view} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button
          asChild
          variant="default"
          className="px-6 transition-all hover:scale-105 hover:shadow-md bg-btn-primary hover:bg-btn-primary-hover text-btn-primary-text"
        >
          <Link to="/products">
            View All Categories <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default CategoryHighlightGrid;
