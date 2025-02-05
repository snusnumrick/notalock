// app/features/products/hooks/useImageReorder.ts
import { useState, useCallback } from 'react';
import type { ProductImage } from '../types/product.types';
import type { ProductImageService } from '../api/productImageService';

export function useImageReorder(
  initialImages: ProductImage[],
  imageService: ProductImageService,
  onImagesChange: (images: ProductImage[]) => void
) {
  const [images, setImages] = useState(initialImages);
  const [isDragging, setIsDragging] = useState(false);

  const moveImage = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      const draggedImage = images[dragIndex];

      // Create new array with reordered images
      const newImages = [...images];
      newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, draggedImage);

      // Update local state immediately for smooth UI
      setImages(newImages);
      onImagesChange(newImages);

      try {
        // Update sort orders in database
        await Promise.all(
          newImages.map((image, index) => imageService.updateImageOrder(image.id, index))
        );
      } catch (error) {
        console.error('Failed to update image order:', error);
        // Revert to original order on error
        setImages(images);
        onImagesChange(images);
      }
    },
    [images, imageService, onImagesChange]
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    images,
    isDragging,
    moveImage,
    handleDragStart,
    handleDragEnd,
  };
}
