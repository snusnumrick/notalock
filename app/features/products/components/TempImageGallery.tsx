// app/features/products/components/TempImageGallery.tsx
import { useCallback, useEffect } from 'react';
import type { TempImage } from '../types/product.types';
import { ImageGalleryBase } from './shared/ImageGalleryBase';

interface TempImageGalleryProps {
  images: TempImage[];
  onImagesChange: (images: TempImage[]) => void;
  showCustomerView?: boolean;
}

export function TempImageGallery({
  images,
  onImagesChange,
  showCustomerView = false,
}: TempImageGalleryProps) {
  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach(image => URL.revokeObjectURL(image.url));
    };
  }, [images]);

  const handleUpload = useCallback(
    async (files: File[]): Promise<TempImage[]> => {
      return files.map((file, index) => ({
        id: URL.createObjectURL(file), // Use URL as temporary ID
        file,
        url: URL.createObjectURL(file),
        isPrimary: images.length === 0 && index === 0,
      }));
    },
    [images.length]
  );

  const handleDelete = useCallback((imageId: string) => {
    // Clean up the object URL when deleting
    URL.revokeObjectURL(imageId);
    return Promise.resolve();
  }, []);

  return (
    <ImageGalleryBase
      images={images}
      onImagesChange={onImagesChange}
      onUpload={handleUpload}
      onDelete={handleDelete}
      showCustomerView={showCustomerView}
    />
  );
}
