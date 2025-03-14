// app/features/products/components/ReorderableImageGallery.tsx
import { useCallback } from 'react';
import type { ProductImage } from '../types/product.types';
import type { ProductImageService } from '../api/productImageService';
import { ImageGalleryBase } from './shared/ImageGalleryBase';
import { DraggableGalleryWrapper } from './shared/DraggableGalleryWrapper';

interface ReorderableImageGalleryProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  imageService: ProductImageService;
  uploading?: boolean;
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
    async (files: File[]): Promise<{ id: string; url: string; isPrimary: boolean }[]> => {
      if (!productId) {
        console.error('Cannot upload images - product ID is missing');
        return [];
      }
      const uploadedImages = await imageService.uploadMultipleImages(files, productId);

      // Get fresh list from server
      const allImages = await imageService.getProductImages(productId);

      // Update parent component with complete list
      onImagesChange(allImages);

      // Return just the newly uploaded images for the gallery component
      return uploadedImages.map(mapToGalleryImage);
    },
    [imageService, productId, onImagesChange]
  );

  const handleDelete = useCallback(
    async (imageId: string): Promise<void> => {
      console.log('handleDelete', imageId);
      await imageService.deleteImage(imageId);

      if (!productId) {
        console.warn('Cannot fetch updated images - product ID is missing');
        return;
      }

      // Get the updated list of images after deletion
      const updatedImages = await imageService.getProductImages(productId);
      onImagesChange(updatedImages);
    },
    [imageService, productId, onImagesChange]
  );

  // Rest of the component remains the same
  const handleSetPrimary = useCallback(
    async (imageId: string): Promise<void> => {
      await imageService.setPrimaryImage(imageId);

      if (!productId) {
        console.warn('Cannot fetch updated images - product ID is missing');
        return;
      }

      // Get the updated list of images after changing primary
      const updatedImages = await imageService.getProductImages(productId);
      onImagesChange(updatedImages);
    },
    [imageService, productId, onImagesChange]
  );

  const handleReorder = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      const newImages = [...images];
      const draggedImage = newImages[dragIndex];
      newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, draggedImage);

      try {
        if (!productId) {
          console.warn('Cannot reorder images - product ID is missing');
          return;
        }
        await Promise.all(
          newImages.map((image, index) => imageService.updateImageOrder(image.id, index))
        );

        // Get the updated list of images after reordering
        const updatedImages = await imageService.getProductImages(productId);
        onImagesChange(updatedImages);
      } catch (error) {
        console.error('Failed to update image order:', error);
        onImagesChange(images);
      }
    },
    [images, onImagesChange, imageService, productId]
  );

  const galleryImages = images.map(mapToGalleryImage);

  const handleImagesChange = (
    updatedGalleryImages: Array<{ id: string; url: string; isPrimary: boolean }>
  ) => {
    console.log('handleImagesChange', updatedGalleryImages);

    // Create a map of updated gallery images by ID for easy lookup
    const updatedGalleryMap = new Map(updatedGalleryImages.map(img => [img.id, img]));

    // Only keep images that exist in the updated gallery
    const updatedImages = images
      .filter(img => updatedGalleryMap.has(img.id))
      .map(originalImage => {
        const updatedGalleryImage = updatedGalleryMap.get(originalImage.id);
        return preserveDatabaseFields(originalImage, {
          isPrimary: updatedGalleryImage?.isPrimary || false,
        });
      });

    onImagesChange(updatedImages);
  };

  return (
    <DraggableGalleryWrapper
      BaseGallery={ImageGalleryBase}
      images={galleryImages}
      onImagesChange={handleImagesChange}
      onUpload={handleUpload}
      onDelete={handleDelete}
      onSetPrimary={handleSetPrimary}
      onReorder={handleReorder}
    />
  );
}
