// app/features/products/components/ReorderableImageGallery.tsx
import { useCallback } from 'react';
import type { ProductImage } from '../types/product.types';
import type { ProductImageService } from '../api/productImageService';
import { ImageGalleryBase } from './shared/ImageGalleryBase';

interface ReorderableImageGalleryProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  imageService: ProductImageService;
}

// Helper function to convert database image to gallery format
const mapToGalleryImage = (image: ProductImage) => ({
  id: image.id,
  url: image.url,
  isPrimary: image.is_primary,
});

// Helper function to preserve database fields while updating from gallery format
const preserveDatabaseFields = (original: ProductImage, updated: { isPrimary: boolean }) => ({
  ...original,
  is_primary: updated.isPrimary,
});

export default function ReorderableImageGallery({
  productId,
  images,
  onImagesChange,
  imageService,
}: ReorderableImageGalleryProps) {
  const handleUpload = useCallback(
    async (files: File[]): Promise<ProductImage[]> => {
      return await imageService.uploadMultipleImages(files, productId);
    },
    [imageService, productId]
  );

  const handleDelete = useCallback(
    async (imageId: string): Promise<void> => {
      await imageService.deleteImage(imageId);
    },
    [imageService]
  );

  const handleSetPrimary = useCallback(
    async (imageId: string): Promise<void> => {
      await imageService.setPrimaryImage(imageId);
    },
    [imageService]
  );

  const handleReorder = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      const newImages = [...images];
      const draggedImage = newImages[dragIndex];
      newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, draggedImage);

      // Update the order in the database
      try {
        // Update sort_order for each image
        await Promise.all(
          newImages.map((image, index) => imageService.updateImageOrder(image.id, index))
        );
        onImagesChange(newImages);
      } catch (error) {
        console.error('Failed to update image order:', error);
        // Revert the order if update fails
        onImagesChange(images);
      }
    },
    [images, onImagesChange, imageService]
  );

  const galleryImages = images.map(mapToGalleryImage);

  const handleImagesChange = (
    updatedGalleryImages: Array<{ id: string; url: string; isPrimary: boolean }>
  ) => {
    const updatedImages = images.map((originalImage, index) =>
      preserveDatabaseFields(originalImage, updatedGalleryImages[index])
    );
    onImagesChange(updatedImages);
  };

  return (
    <ImageGalleryBase
      images={galleryImages}
      onImagesChange={handleImagesChange}
      onUpload={handleUpload}
      onDelete={handleDelete}
      onSetPrimary={handleSetPrimary}
      onReorder={handleReorder}
    />
  );
}
