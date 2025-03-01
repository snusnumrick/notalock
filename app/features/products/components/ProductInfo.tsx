import { useState, useEffect } from 'react';
import type { Product } from '../types/product.types';
import { useCart } from '~/features/cart/context/CartContext';
import { Input } from '~/components/ui/input';
import { AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription } from '~/components/ui/alert';
import {
  Toast,
  ToastProvider,
  ToastTitle,
  ToastDescription,
  ToastViewport,
} from '~/components/ui/toast';

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isAddingToCart, cartError, cartSuccess, cartItems } = useCart();
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Debug cart state - minimal logging
  useEffect(() => {
    if (cartItems.length > 0) {
      console.log('ProductInfo - Cart has items:', cartItems.length);
    }
  }, [cartItems]);

  // Show success toast when cart success state changes
  useEffect(() => {
    if (cartSuccess) {
      setShowSuccessToast(true);
      // Auto-hide toast after 3 seconds
      const timer = setTimeout(() => setShowSuccessToast(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [cartSuccess]);

  const handleAddToCart = () => {
    if (quantity <= 0 || quantity > (product.stock || 0)) {
      return;
    }

    // Add to cart via hook
    addToCart({
      productId: product.id,
      quantity: quantity,
      price: product.retail_price || 0,
    });

    // Show a toast notification locally rather than dispatching additional events
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
        <p className="mt-1 text-sm text-gray-500">SKU: {product.sku}</p>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h2 className="text-lg font-medium text-gray-900">Description</h2>
        <p className="mt-2 text-gray-600">{product.description}</p>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-medium text-gray-900">Retail Price</p>
            <p className="text-2xl font-bold text-blue-600">
              {product.retail_price != null ? (
                <>
                  $<span>{product.retail_price.toFixed(2)}</span>
                </>
              ) : (
                '$N/A'
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium text-gray-900">Stock</p>
            <p className="text-lg text-gray-600">{product.stock} available</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center space-x-2 mb-4">
          <label htmlFor="quantity" className="text-sm text-gray-600 font-medium">
            Quantity:
          </label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max={product.stock || 0}
            value={quantity}
            onChange={e => {
              // Parse the input value as an integer
              const newValue = e.target.value === '' ? 1 : parseInt(e.target.value, 10);
              // Use the parsed value directly (don't fall back to 1 if newValue is 0)
              setQuantity(isNaN(newValue) ? 1 : newValue);
            }}
            className="w-20"
            aria-label="Product quantity"
            disabled={isAddingToCart}
          />
        </div>

        {cartError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{cartError}</AlertDescription>
          </Alert>
        )}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAddingToCart || (product.stock ?? 0) <= 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                  focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          aria-label={(product.stock ?? 0) <= 0 ? 'Out of stock' : 'Add to cart'}
        >
          {isAddingToCart
            ? 'Adding...'
            : (product.stock ?? 0) <= 0
              ? 'Out of Stock'
              : 'Add to Cart'}
        </button>
      </div>

      <ToastProvider>
        {showSuccessToast && (
          <Toast className="fixed bottom-4 right-4 bg-green-100 border-green-500">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <ToastTitle className="text-green-800 font-medium">Added to Cart</ToastTitle>
                <ToastDescription className="text-green-700">
                  {quantity} × {product.name} added to your cart
                </ToastDescription>
              </div>
            </div>
          </Toast>
        )}
        <ToastViewport />
      </ToastProvider>
    </div>
  );
}
