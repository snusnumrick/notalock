// app/features/products/components/TempImageGallery.tsx
import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Loader2, X, Star, Upload, Move } from 'lucide-react';
import type { TempImage, ProductImage } from '../types/product.types';
import ProductGallery from './ProductGallery';

interface TempImageGalleryProps {
  images: TempImage[];
  onImagesChange: (images: TempImage[]) => void;
  showCustomerView?: boolean;
}

interface DraggableImageProps {
  image: TempImage;
  index: number;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  onSetPrimary: () => void;
  onRemove: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const DraggableImage = ({
  image,
  index,
  moveImage,
  onSetPrimary,
  onRemove,
  onKeyDown,
}: DraggableImageProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'IMAGE',
    item: { index },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'IMAGE',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveImage(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={node => drag(drop(node))}
      className={`group relative border rounded-lg overflow-hidden bg-white ${
        isDragging ? 'opacity-50' : ''
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label={`Product image ${index + 1}${image.isPrimary ? ' (Primary)' : ''}`}
    >
      <img
        src={image.previewUrl}
        alt={`Product preview ${index + 1}`}
        className="w-full aspect-square object-contain"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onSetPrimary}
          className={`p-1.5 rounded-full transition-colors ${
            image.isPrimary
              ? 'bg-yellow-500 text-white'
              : 'bg-white text-gray-700 hover:bg-yellow-500 hover:text-white'
          }`}
          aria-label={image.isPrimary ? 'Primary image' : 'Set as primary image'}
        >
          <Star className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-full bg-white text-red-600 hover:bg-red-600 hover:text-white transition-colors"
          aria-label="Remove image"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {image.isPrimary && (
        <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
          Primary
        </div>
      )}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Move className="h-4 w-4 text-gray-500" />
      </div>
    </div>
  );
};

export function TempImageGallery({
  images,
  onImagesChange,
  showCustomerView = false,
}: TempImageGalleryProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerViewImages, setCustomerViewImages] = useState<ProductImage[]>([]);

  useEffect(() => {
    // Convert TempImages to ProductImages for customer view
    const convertedImages = images.map(
      (img, index): ProductImage => ({
        id: `temp-${index}`,
        product_id: 'temp',
        url: img.previewUrl,
        storage_path: '',
        file_name: img.file.name,
        is_primary: img.isPrimary,
        sort_order: index,
        created_at: new Date().toISOString(),
      })
    );
    setCustomerViewImages(convertedImages);
  }, [images]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      console.log('TempImageGallery :: onDrop');
      setIsLoading(true);
      setError(null);

      try {
        const newImages: TempImage[] = await Promise.all(
          acceptedFiles.map(async (file, index) => ({
            file,
            previewUrl: URL.createObjectURL(file),
            isPrimary: images.length === 0 && index === 0, // Only the first image should be primary, and only if no existing images
          }))
        );

        onImagesChange([...images, ...newImages]);
      } catch (err) {
        setError('Failed to process images');
        console.error('Error processing images:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [images, onImagesChange]
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

  const handleRemoveImage = useCallback(
    (index: number) => {
      const newImages = [...images];
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(newImages[index].previewUrl);
      newImages.splice(index, 1);

      // If we removed the primary image and there are other images,
      // make the first remaining image primary
      if (images[index].isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }

      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  const handleSetPrimary = useCallback(
    (index: number) => {
      const newImages = images.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }));
      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  const moveImage = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const newImages = [...images];
      const draggedImage = newImages[dragIndex];
      newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, draggedImage);
      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          handleRemoveImage(index);
          break;
        case 'p':
        case 'P':
          handleSetPrimary(index);
          break;
        case 'ArrowLeft':
          if (index > 0) {
            moveImage(index, index - 1);
          }
          break;
        case 'ArrowRight':
          if (index < images.length - 1) {
            moveImage(index, index + 1);
          }
          break;
      }
    },
    [handleRemoveImage, handleSetPrimary, moveImage, images.length]
  );

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach(image => URL.revokeObjectURL(image.previewUrl));
    };
  }, [images]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}
          `}
          role="button"
          tabIndex={0}
          aria-label="Drag and drop zone for product images"
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
                  <p className="text-gray-500 mt-2">
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Spacebar</kbd> to select primary
                    <span className="mx-2">•</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">←</kbd>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">→</kbd> to reorder
                    <span className="mx-2">•</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded">Delete</kbd> to remove
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div
            className="text-sm text-red-600 bg-red-50 p-3 rounded"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {isLoading && (
          <div
            className="flex items-center justify-center gap-2 text-blue-600"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Processing images...</span>
          </div>
        )}

        <DndProvider backend={HTML5Backend}>
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            role="list"
            aria-label="Product images"
          >
            {images.map((image, index) => (
              <DraggableImage
                key={image.previewUrl}
                image={image}
                index={index}
                moveImage={moveImage}
                onSetPrimary={() => handleSetPrimary(index)}
                onRemove={() => handleRemoveImage(index)}
                onKeyDown={e => handleKeyDown(e, index)}
              />
            ))}
          </div>
        </DndProvider>
      </div>

      {showCustomerView && images.length > 0 && (
        <div className="border-t pt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Preview</h3>
          <div className="border rounded-lg p-6 bg-gray-50">
            <ProductGallery images={customerViewImages} />
          </div>
        </div>
      )}
    </div>
  );
}
