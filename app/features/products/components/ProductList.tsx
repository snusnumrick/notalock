import React from 'react';
import { Link } from '@remix-run/react';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { formattedPrice } from '~/lib/utils';
import type { Product } from '../types/product.types';

interface ProductListProps {
  products: Product[];
}

export const ProductList: React.FC<ProductListProps> = ({ products }) => {
  return (
    <div className="space-y-4">
      {products.map(product => (
        <Link key={product.id} to={`/products/${product.id}`}>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-40 h-40 flex-shrink-0">
                  <div className="aspect-square w-full relative overflow-hidden rounded-lg">
                    <img
                      src={product.thumbnailUrl}
                      alt={product.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                        {product.description}
                      </p>
                      {product.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.categories.map(category => (
                            <Badge key={category.id} variant="secondary">
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-lg">{formattedPrice(product.price)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};
