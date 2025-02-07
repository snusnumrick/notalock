// app/features/products/components/shared/DraggableGalleryWrapper.tsx
import type { ComponentType } from 'react';
import type { GalleryImage, ImageGalleryBaseProps } from './ImageGalleryBase';

export interface DraggableGalleryProps<T extends GalleryImage> {
  BaseGallery: ComponentType<ImageGalleryBaseProps<T>>;
  onReorder: (dragIndex: number, hoverIndex: number) => Promise<void>;
}

export function DraggableGalleryWrapper<T extends GalleryImage>({
  BaseGallery,
  onReorder: _onReorder,
  ...baseProps
}: DraggableGalleryProps<T> & ImageGalleryBaseProps<T>) {
  // Add drag-drop functionality here
  return <BaseGallery {...baseProps} />;
}
