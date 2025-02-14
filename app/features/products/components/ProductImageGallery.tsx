// app/features/products/components/ProductImageGallery.tsx
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, X, Star, Upload } from 'lucide-react';
import type { ProductImage } from '../types/product.types';
import type { ProductImageService } from '../api/productImageService';

interface ProductImageGalleryProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  imageService: ProductImageService;
}

export function ProductImageGallery({
  productId,
  images,
  onImagesChange,
  imageService,
}: ProductImageGalleryProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      console.log('ProductImageGallery :: onDrop. Accepted files:', acceptedFiles);
      setIsUploading(true);
      setUploadError(null);

      try {
        for (const file of acceptedFiles) {
          const newImage = await imageService.uploadImage(file, productId);
          onImagesChange([...images, newImage]);
        }
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Failed to upload images');
      } finally {
        setIsUploading(false);
      }
    },
    [productId, images, onImagesChange, imageService]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: true,
  });

  const handleRemoveImage = async (imageId: string) => {
    try {
      console.log('handleRemoveImage', imageId);
      await imageService.deleteImage(imageId);
      onImagesChange(images.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await imageService.setPrimaryImage(imageId);
      onImagesChange(
        images.map(img => ({
          ...img,
          is_primary: img.id === imageId,
        }))
      );
    } catch (error) {
      console.error('Failed to set primary image:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className={`w-8 h-8 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="text-sm">
            {isDragActive ? (
              <p className="text-blue-500">Drop the files here</p>
            ) : (
              <>
                <p className="font-medium">Drop product images here or click to select</p>
                <p className="text-gray-500">Upload JPG, PNG, or WebP files</p>
              </>
            )}
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{uploadError}</div>
      )}

      {isUploading && (
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Uploading images...</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(image => (
          <div key={image.id} className="group relative border rounded-lg overflow-hidden bg-white">
            <img src={image.url} alt="Product" className="w-full aspect-square object-contain" />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleSetPrimary(image.id)}
                className={`p-1.5 rounded-full transition-colors ${
                  image.is_primary
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-yellow-500 hover:text-white'
                }`}
                title={image.is_primary ? 'Primary image' : 'Set as primary'}
              >
                <Star className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleRemoveImage(image.id)}
                className="p-1.5 rounded-full bg-white text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {image.is_primary && (
              <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                Primary
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
