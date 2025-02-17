import type { Product } from '../types/product.types';

interface ProductInfoProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export function ProductInfo({ product, onAddToCart }: ProductInfoProps) {
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
            <p className="text-2xl font-bold text-blue-600">${product.retail_price.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium text-gray-900">Stock</p>
            <p className="text-lg text-gray-600">{product.stock} available</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onAddToCart?.(product.id)}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
                 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                 focus:ring-blue-500"
      >
        Add to Cart
      </button>
    </div>
  );
}
