// app/features/products/components/ReorderableImageGallery.tsx
import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { X, Star, GripHorizontal, Upload, Loader2 } from 'lucide-react';
import type { ProductImage } from '../types/product.types';
import type { ProductImageService } from '../api/productImageService';
import { useImageReorder } from '../hooks/useImageReorder';
import { useDropzone } from 'react-dropzone';

interface ReorderableImageGalleryProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  imageService: ProductImageService;
}

const DraggableImage = ({
  image,
  index,
  moveImage,
  handleRemove,
  handleSetPrimary,
}: {
  image: ProductImage;
  index: number;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  handleRemove: (id: string) => void;
  handleSetPrimary: (id: string) => void;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'IMAGE',
    item: { id: image.id, index },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'IMAGE',
    hover(item: { id: string; index: number }, monitor) {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();

      if (!clientOffset) return;

      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;

      moveImage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`relative border rounded-lg overflow-hidden bg-white ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* Handle */}
      <div className="absolute top-2 left-2 cursor-move">
        <GripHorizontal className="w-4 h-4 text-gray-500" />
      </div>

      <img src={image.url} alt="Product" className="w-full aspect-square object-contain" />

      <div className="absolute top-2 right-2 flex gap-2">
        <button
          onClick={() => handleSetPrimary(image.id)}
          className={`p-1.5 rounded-full transition-colors ${
            image.is_primary
              ? 'bg-yellow-500 text-white'
              : 'bg-white text-gray-700 hover:bg-yellow-500 hover:text-white'
          }`}
          title={image.is_primary ? 'Primary image' : 'Set as primary'}
        >
          <Star className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleRemove(image.id)}
          className="p-1.5 rounded-full bg-white text-red-600 hover:bg-red-600 hover:text-white transition-colors"
          title="Remove image"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {image.is_primary && (
        <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
          Primary
        </div>
      )}
    </div>
  );
};

export default function ReorderableImageGallery({
  productId,
  images: initialImages,
  onImagesChange,
  imageService,
}: ReorderableImageGalleryProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const { images, isDragging, moveImage } = useImageReorder(
    initialImages,
    imageService,
    onImagesChange
  );

  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);
      setUploadError(null);

      try {
        const newImages = await imageService.uploadMultipleImages(acceptedFiles, productId);
        onImagesChange([...images, ...newImages]);
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

      <div
        className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${
          isDragging ? 'opacity-75' : 'opacity-100'
        }`}
      >
        {images.map((image, index) => (
          <DraggableImage
            key={image.id}
            image={image}
            index={index}
            moveImage={moveImage}
            handleRemove={handleRemoveImage}
            handleSetPrimary={handleSetPrimary}
          />
        ))}
      </div>
    </div>
  );
}
