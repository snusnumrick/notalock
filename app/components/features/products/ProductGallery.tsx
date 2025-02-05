import { useState } from 'react';
import type { ProductImage } from '~/features/products/types/product.types';

interface ProductGalleryProps {
  images: ProductImage[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  // Find primary image or use first image as default
  const primaryImage = images.find(img => img.is_primary) || images[0];
  const [selectedImage, setSelectedImage] = useState(primaryImage?.url || '');

  if (!images.length) {
    return (
      <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square w-full bg-white border rounded-lg overflow-hidden">
        <img src={selectedImage} alt="Product" className="w-full h-full object-contain" />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map(image => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image.url)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors
                ${
                  image.url === selectedImage
                    ? 'border-blue-500'
                    : 'border-transparent hover:border-gray-300'
                }`}
            >
              <img src={image.url} alt="Product thumbnail" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
