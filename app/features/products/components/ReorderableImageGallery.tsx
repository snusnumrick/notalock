// app/features/products/components/ReorderableImageGallery.tsx
import type { ProductImage } from '../types/product.types';
import type { ProductImageService } from '../api/productImageService';
import { ImageGalleryBase } from './shared/ImageGalleryBase';

interface ReorderableImageGalleryProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  imageService: ProductImageService;
}

export default function ReorderableImageGallery({
  productId,
  images,
  onImagesChange,
  imageService,
}: ReorderableImageGalleryProps) {
  const handleUpload = async (files: File[]): Promise<ProductImage[]> => {
    return await imageService.uploadMultipleImages(files, productId);
  };

  const handleDelete = async (imageId: string): Promise<void> => {
    await imageService.deleteImage(imageId);
  };

  const handleSetPrimary = async (imageId: string): Promise<void> => {
    await imageService.setPrimaryImage(imageId);
  };

  return (
    <ImageGalleryBase
      images={images}
      onImagesChange={onImagesChange}
      onUpload={handleUpload}
      onDelete={handleDelete}
      onSetPrimary={handleSetPrimary}
    />
  );
}
