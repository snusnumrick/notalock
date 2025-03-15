import React, { useState } from 'react';
import { Link } from '@remix-run/react';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';
import { formattedPrice } from '~/lib/utils';
import { isProductNew } from '../utils/product-utils';
import type { TransformedProduct } from '../types/product.types';
import { useCart } from '~/features/cart/hooks/useCart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';

interface ProductListItemProps {
  product: TransformedProduct;
  onCategoryClick?: () => void;
}

export const ProductListItem: React.FC<ProductListItemProps> = ({ product, onCategoryClick }) => {
  const { addToCart, cartItems, isAddingToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  // Calculate how many of this product are in the cart
  const productInCart = cartItems.find(item => item.product_id === product.id);
  const cartQuantity = productInCart ? productInCart.quantity : 0;

  // Handle adding to cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product page
    e.stopPropagation(); // Stop event propagation

    addToCart({
      productId: product.id,
      quantity: 1,
      price: product.price,
    });

    // Show success animation
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-40 h-40 flex-shrink-0 relative">
            {isProductNew(product.created_at) && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-green-500 hover:bg-green-600 text-white">New</Badge>
              </div>
            )}
            <Link to={`/products/${product.slug}`} onClick={onCategoryClick} className="block">
              <div className="aspect-square w-full relative overflow-hidden rounded-lg">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.alt_text || product.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                )}
              </div>
            </Link>
          </div>
          <div className="flex-grow flex flex-col">
            <div>
              <div className="flex justify-between items-start">
                <Link to={`/products/${product.slug}`} onClick={onCategoryClick}>
                  <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <p className="font-bold text-lg">{formattedPrice(product.price)}</p>
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">{product.description}</p>
              {product.categories && product.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {product.categories.map(category => (
                    <Badge key={category.id} variant="secondary">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Spacer to push button to bottom */}
            <div className="flex-grow"></div>

            {/* Action button at bottom */}
            <div className="flex justify-end mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={isAdded ? 'default' : cartQuantity > 0 ? 'default' : 'outline'}
                      className={`rounded-full transition-all ${isAdded ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-blue-600 hover:text-white'}`}
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || (product.stock || 0) <= 0}
                    >
                      {isAdded ? (
                        <Check className="w-4 h-4 mr-1" />
                      ) : (
                        <ShoppingCart className="w-4 h-4 mr-1" />
                      )}
                      {isAdded
                        ? 'Added'
                        : cartQuantity > 0
                          ? `Cart (${cartQuantity})`
                          : 'Add to Cart'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {(product.stock || 0) <= 0
                      ? 'Out of stock'
                      : cartQuantity > 0
                        ? `${cartQuantity} in cart - Add another`
                        : 'Add to cart'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
