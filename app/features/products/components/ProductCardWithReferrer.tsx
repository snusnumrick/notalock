import React from 'react';
import type { TransformedProduct } from '../types/product.types';
import { storeReferringCategory } from '~/features/categories/utils/referringCategoryUtils';
import type { Category } from '~/features/categories/types/category.types';
import { ProductCard } from './ProductCard';

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
    const handleClick = (
      _: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>
    ) => {
      // Only store referring category if we have category context and not clicking the add to cart button
      // The add to cart button will call stopPropagation(), so this won't execute for that click
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
      <div
        onClick={handleClick}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === 'Space') {
            handleClick(e as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }}
        tabIndex={0}
        role="button"
      >
        <ProductCard product={product} index={index} variant="default" showAddToCartButton={true} />
      </div>
    );
  }
);

ProductCardWithReferrer.displayName = 'ProductCardWithReferrer'; // For React DevTools

export default ProductCardWithReferrer;
