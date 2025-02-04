// app/features/products/components/ProductImageUpload.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFetcher } from '@remix-run/react';
import { Loader2, X, Star } from 'lucide-react';
import type { ProductImage } from '~/types/product.types';

interface ProductImageUploadProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
}

export function ProductImageUpload({ productId, images, onImagesChange }: ProductImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fetcher = useFetcher();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);

      try {
        for (const file of acceptedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('productId', productId);

          const response = await fetch('/api/upload-product-image', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload image');
          }

          const newImage = await response.json();
          onImagesChange([...images, newImage]);
        }
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
      }
    },
    [productId, images, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    multiple: true,
  });

  const handleRemoveImage = async (imageId: string) => {
    fetcher.submit(
      { _action: 'deleteImage' },
      { method: 'DELETE', action: `/api/delete-product-image/${imageId}` }
    );

    onImagesChange(images.filter(img => img.id !== imageId));
  };

  const handleSetPrimary = async (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      is_primary: img.id === imageId,
    }));

    fetcher.submit(
      { is_primary: 'true' },
      { method: 'PATCH', action: `/api/update-product-image/${imageId}` }
    );

    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <div className="text-gray-600">
            {isDragActive ? (
              <p>Drop the files here</p>
            ) : (
              <p>Drag and drop images here, or click to select files</p>
            )}
          </div>
          <p className="text-sm text-gray-500">Supports: PNG, JPG, JPEG, WebP</p>
        </div>
      </div>

      {isUploading && (
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading images...</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(image => (
          <div key={image.id} className="group relative border rounded-lg overflow-hidden">
            <img src={image.url} alt="Product" className="w-full h-48 object-cover" />
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleSetPrimary(image.id)}
                className={`p-1 rounded-full ${
                  image.is_primary
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-yellow-500 hover:text-white'
                }`}
              >
                <Star className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleRemoveImage(image.id)}
                className="p-1 rounded-full bg-white text-red-600 hover:bg-red-600 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {image.is_primary && (
              <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                Primary
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
