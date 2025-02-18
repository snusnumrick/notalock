import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <Card className="h-full">
      <CardHeader className="p-0">
        <Skeleton className="aspect-square w-full rounded-t-lg" />
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-1 mt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-6 w-24" />
      </CardFooter>
    </Card>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};
