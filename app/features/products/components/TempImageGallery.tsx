// app/features/products/components/TempImageGallery.tsx
import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, X, Star, Upload } from 'lucide-react';
import type { TempImage } from '../types/product.types';

interface TempImageGalleryProps {
  images: TempImage[];
  onImagesChange: (images: TempImage[]) => void;
}

export function TempImageGallery({ images, onImagesChange }: TempImageGalleryProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsLoading(true);
      setError(null);

      try {
        const newImages: TempImage[] = await Promise.all(
          acceptedFiles.map(async file => ({
            file,
            previewUrl: URL.createObjectURL(file),
            isPrimary: images.length === 0, // First image is primary by default
          }))
        );

        onImagesChange([...images, ...newImages]);
      } catch {
        setError('Failed to process images');
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

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach(image => URL.revokeObjectURL(image.previewUrl));
    };
  }, [images]);

  return (
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
              </>
            )}
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Processing images...</span>
        </div>
      )}

      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        role="list"
        aria-label="Product images"
      >
        {images.map((image, index) => (
          <div
            key={image.previewUrl}
            className="group relative border rounded-lg overflow-hidden bg-white"
            role="listitem"
          >
            <img
              src={image.previewUrl}
              alt={`Product preview ${index + 1}`}
              className="w-full aspect-square object-contain"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleSetPrimary(index)}
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
                onClick={() => handleRemoveImage(index)}
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
          </div>
        ))}
      </div>
    </div>
  );
}
