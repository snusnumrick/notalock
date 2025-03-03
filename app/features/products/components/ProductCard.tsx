import React from 'react';
import { Link } from '@remix-run/react';
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { formattedPrice } from '~/lib/utils';
import type { TransformedProduct } from '../types/product.types';

interface ProductCardProps {
  product: TransformedProduct;
  index: number;
}

const ProductCardComponent = React.memo(({ product, index }: ProductCardProps) => {
  return (
    <Link to={`/products/${product.slug}`} prefetch="intent" className="block">
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader className="p-0">
          <div className="aspect-square w-full relative overflow-hidden rounded-t-lg">
            <img
              src={product.image_url || '/placeholder-product.png'}
              alt={product.name}
              className="object-cover w-full h-full"
              loading={index < 8 ? 'eager' : 'lazy'}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
          {product.categories && product.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.categories.map(category => (
                <Badge key={category.id} variant="secondary">
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <p className="font-bold text-lg">{formattedPrice(product.price)}</p>
        </CardFooter>
      </Card>
    </Link>
  );
});

ProductCardComponent.displayName = 'ProductCard'; // For React DevTools

export const ProductCard = ProductCardComponent;
