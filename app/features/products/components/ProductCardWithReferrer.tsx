import React from 'react';
import { Link } from '@remix-run/react';
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { formattedPrice } from '~/lib/utils';
import type { TransformedProduct } from '../types/product.types';
import { storeReferringCategory } from '~/features/categories/utils/referringCategoryUtils';
import type { Category } from '~/features/categories/types/category.types';

interface ProductCardWithReferrerProps {
  product: TransformedProduct;
  index: number;
  category?: Category; // Optional category context for breadcrumb referrer
}

/**
 * Enhanced ProductCard that stores the referring category when clicked
 * Used within category pages to maintain breadcrumb context
 */
const ProductCardWithReferrer = React.memo(
  ({ product, index, category }: ProductCardWithReferrerProps) => {
    const handleClick = () => {
      // Only store referring category if we have category context
      if (category) {
        storeReferringCategory({
          id: category.id,
          name: category.name,
          slug: category.slug,
          path: category.path || undefined, // For nested categories
        });
      }
    };

    return (
      <Link
        to={`/products/${product.slug}`}
        prefetch="intent"
        className="block"
        onClick={handleClick}
      >
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
  }
);

ProductCardWithReferrer.displayName = 'ProductCardWithReferrer'; // For React DevTools

export default ProductCardWithReferrer;
