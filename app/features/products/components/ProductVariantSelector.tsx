import { useState } from 'react';
import type { ProductVariant } from '../types/product.types';

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  onVariantChange: (variantId: string) => void;
}

/**
 * Component for selecting product variants
 * Organizes variants by type (size, color, etc.) for better user experience
 */
export function ProductVariantSelector({ variants, onVariantChange }: ProductVariantSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    variants.length > 0 ? variants[0].id : null
  );

  const handleVariantChange = (variantId: string) => {
    setSelectedVariant(variantId);
    onVariantChange(variantId);
  };

  // If no variants, don't render anything
  if (!variants.length) return null;

  // Group variants by type for better organization (color, size, material, etc.)
  const variantsByType = variants.reduce(
    (acc, variant) => {
      const type = variant.type || 'Options';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(variant);
      return acc;
    },
    {} as Record<string, ProductVariant[]>
  );

  return (
    <div className="border-t border-gray-200 pt-4">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Variants</h2>

      {Object.entries(variantsByType).map(([type, typeVariants]) => (
        <div key={type} className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{type}</h3>
          <div className="flex flex-wrap gap-2">
            {typeVariants.map((variant, index) => (
              <button
                key={variant.id}
                onClick={() => handleVariantChange(variant.id)}
                className={`px-3 py-2 border rounded-md text-sm transition-colors
                  ${
                    selectedVariant === variant.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                aria-pressed={selectedVariant === variant.id}
                data-testid={`variant-button-${variant.id}`}
              >
                <span data-testid={`variant-name-${variant.id}`}>
                  {variant.name || `Variant ${index + 1}`}
                </span>
                {variant.price_adjustment && variant.price_adjustment > 0 && (
                  <span className="ml-1 text-gray-500" data-testid={`variant-price-${variant.id}`}>
                    (+${variant.price_adjustment.toFixed(2)})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
