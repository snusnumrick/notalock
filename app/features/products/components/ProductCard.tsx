import React, { useState } from 'react';
import { Link } from '@remix-run/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { ShoppingCart, ImageIcon, Check } from 'lucide-react';
import { formattedPrice } from '~/lib/utils';
import { isProductNew } from '../utils/product-utils';
import type { TransformedProduct } from '../types/product.types';
import { useCart } from '~/features/cart/hooks/useCart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { CART_INDICATOR_EVENT_NAME } from '~/features/cart/constants';

interface ProductCardProps {
  product: TransformedProduct;
  index?: number;
  variant?: 'default' | 'featured';
  showAddedDate?: boolean;
  showAddToCartButton?: boolean;
  className?: string;
  imageClassName?: string;
  cardClassName?: string;
}

const ProductCardComponent = React.memo(
  ({
    product,
    index = 0,
    variant = 'default',
    showAddedDate = false,
    showAddToCartButton = true,
    className = '',
    imageClassName = '',
    cardClassName = '',
  }: ProductCardProps) => {
    const { addToCart, cartItems, isAddingToCart } = useCart();
    const [isAdded, setIsAdded] = useState(false);

    // Determine if we should use the featured variant styling
    const isFeatured = variant === 'featured';

    // Calculate how many of this product are in the cart
    const productInCart = cartItems.find(item => item.product_id === product.id);
    const cartQuantity = productInCart ? productInCart.quantity : 0;

    // Handle adding to cart
    const handleAddToCart = (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent navigation to product page
      e.stopPropagation(); // Stop event propagation

      // Calculate current cart quantity before adding
      const currentCartItems = cartItems.reduce((total, item) => total + item.quantity, 0);

      // Show success animation immediately
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);

      // Update cart indicator with optimistic update
      if (typeof window !== 'undefined') {
        console.log(
          'ProductCard - Dispatching optimistic cart indicator update:',
          currentCartItems + 1
        );
        window.dispatchEvent(
          new CustomEvent(CART_INDICATOR_EVENT_NAME, {
            detail: { count: currentCartItems + 1 },
          })
        );
      }

      // Call the API to add to cart
      addToCart({
        productId: product.id,
        quantity: 1,
        price: product.price,
      });
    };

    return (
      <div className={`${className} ${isFeatured ? 'group relative' : ''}`}>
        <Card
          className={`h-full ${
            isFeatured
              ? 'transition-all duration-300 hover:scale-105 hover:shadow-lg border border-border overflow-hidden bg-product-card'
              : 'hover:shadow-lg transition-shadow bg-product-card'
          } ${cardClassName}`}
        >
          <div className="p-0">
            {' '}
            {/* Using a div instead of CardHeader for the image wrapper */}
            {isProductNew(product.created_at) && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-green-500 hover:bg-green-600 text-white">New</Badge>
              </div>
            )}
            <div
              className={`aspect-square w-full relative overflow-hidden ${isFeatured ? 'rounded-t-lg' : 'rounded-t-lg'}`}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className={`object-cover w-full h-full ${isFeatured ? 'transition-transform duration-300 group-hover:scale-110' : ''} ${imageClassName}`}
                  loading={index < 8 ? 'eager' : 'lazy'}
                />
              ) : (
                <div className="h-full w-full bg-product-hover flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-text-secondary" data-testid="image-icon" />
                </div>
              )}
            </div>
          </div>

          {isFeatured ? (
            // Featured variant (like in NewArrivals)
            <>
              <CardHeader className="p-4 pb-0">
                <Link to={`/products/${product.slug}`}>
                  <CardTitle className="text-lg font-semibold line-clamp-2 hover:text-blue-600 transition-colors">
                    {product.name}
                  </CardTitle>
                </Link>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                  {product.description || ''}
                </p>
                {product.categories && product.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2" data-testid="category-container">
                    {product.categories.slice(0, 2).map(category => (
                      <Badge key={category.id} variant="secondary" role="listitem">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {showAddedDate && (
                  <div className="mt-3 text-xs text-text-secondary opacity-70">
                    Added{' '}
                    {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-1 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-text-secondary uppercase">Price</span>
                  <p className="text-xl font-bold text-btn-primary">
                    {formattedPrice(product.price)}
                  </p>
                </div>
                {showAddToCartButton && (
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
                          {isAdded ? 'Added' : cartQuantity > 0 ? `Cart (${cartQuantity})` : 'Add'}
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
                )}
              </CardFooter>
            </>
          ) : (
            // Default variant (original ProductCard)
            <>
              <Link to={`/products/${product.slug}`}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  {product.categories && product.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.categories.map(category => (
                        <Badge key={category.id} variant="secondary">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {showAddedDate && (
                    <div className="mt-3 text-xs text-text-secondary opacity-70">
                      Added{' '}
                      {product.created_at
                        ? new Date(product.created_at).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  )}
                </CardContent>
              </Link>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <p className="font-bold text-lg">{formattedPrice(product.price)}</p>
                {showAddToCartButton && (
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
                          {isAdded ? 'Added' : cartQuantity > 0 ? `Cart (${cartQuantity})` : 'Add'}
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
                )}
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    );
  }
);

ProductCardComponent.displayName = 'ProductCard'; // For React DevTools

export const ProductCard = ProductCardComponent;
