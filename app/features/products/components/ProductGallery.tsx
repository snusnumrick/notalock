// app/features/products/components/ProductGallery.tsx
import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { Dialog, DialogContent } from '~/components/ui/dialog';

interface ProductGalleryProps {
  images: {
    id: string;
    url: string;
    is_primary: boolean;
  }[];
}

export default function ProductGallery({ images }: ProductGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Get primary image first, then sort rest by sort_order
  const sortedImages = useMemo(() => {
    if (!images.length) return [];
    const primaryImage = images.find(img => img.is_primary);
    const nonPrimaryImages = images.filter(img => !img.is_primary);
    return primaryImage ? [primaryImage, ...nonPrimaryImages] : images;
  }, [images]);

  // Process image URLs for optimization
  const processedImages = useMemo(() => {
    return sortedImages.map(image => {
      // Add query parameters for server-side optimization
      // For example: ?width=800&format=webp
      const mainImageUrl = `${image.url}?width=800&format=webp`;
      const thumbnailUrl = `${image.url}?width=150&height=150&format=webp`;

      return {
        ...image,
        optimizedUrl: mainImageUrl,
        thumbnailUrl: thumbnailUrl,
      };
    });
  }, [sortedImages]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = e.touches[0].clientX;
    const diff = touchStart - touchEnd;

    // Swipe threshold of 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentImageIndex < sortedImages.length - 1) {
        // Swipe left - next image
        setCurrentImageIndex(currentImageIndex + 1);
      } else if (diff < 0 && currentImageIndex > 0) {
        // Swipe right - previous image
        setCurrentImageIndex(currentImageIndex - 1);
      }
      setTouchStart(0);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(0);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev < sortedImages.length - 1 ? prev + 1 : prev));
  };

  return (
    <div className="w-full space-y-4" role="tabpanel" aria-label="Product image gallery">
      {/* Main Image Display */}
      <div
        className="relative w-full aspect-square bg-white rounded-lg overflow-hidden border"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="presentation"
      >
        <img
          src={
            processedImages[currentImageIndex]?.optimizedUrl ||
            processedImages[currentImageIndex]?.url
          }
          alt="Product"
          className={`w-full h-full object-contain transition-transform duration-300 ${
            isZoomed ? 'scale-150' : 'scale-100'
          }`}
          loading="eager"
        />

        {/* Navigation Arrows */}
        <div className="absolute inset-0 flex items-center justify-between p-4">
          <button
            onClick={handlePrevImage}
            onKeyDown={e => e.key === 'Enter' && handlePrevImage()}
            className={`p-2 rounded-full bg-white/80 text-gray-800 hover:bg-white transition-opacity ${
              currentImageIndex === 0 ? 'opacity-0' : 'opacity-100'
            }`}
            disabled={currentImageIndex === 0}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNextImage}
            onKeyDown={e => e.key === 'Enter' && handleNextImage()}
            className={`p-2 rounded-full bg-white/80 text-gray-800 hover:bg-white transition-opacity ${
              currentImageIndex === sortedImages.length - 1 ? 'opacity-0' : 'opacity-100'
            }`}
            disabled={currentImageIndex === sortedImages.length - 1}
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Zoom and Lightbox Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            onKeyDown={e => e.key === 'Enter' && setIsZoomed(!isZoomed)}
            className="p-2 rounded-full bg-white/80 text-gray-800 hover:bg-white"
            aria-label="Toggle zoom"
          >
            <ZoomIn className="w-6 h-6" />
          </button>
          <button
            onClick={() => setLightboxOpen(true)}
            onKeyDown={e => e.key === 'Enter' && setLightboxOpen(true)}
            className="p-2 rounded-full bg-white/80 text-gray-800 hover:bg-white"
            aria-label="Open fullscreen view"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-5V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="grid grid-cols-5 gap-2" role="tablist" aria-label="Product thumbnails">
        {processedImages.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setCurrentImageIndex(index)}
            className={`relative aspect-square border rounded-md overflow-hidden ${
              currentImageIndex === index
                ? 'border-blue-500 ring-2 ring-blue-500'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            role="tab"
            aria-selected={currentImageIndex === index}
            aria-label={`View product image ${index + 1}`}
          >
            <img
              src={image.thumbnailUrl || image.url}
              alt={`Product thumbnail ${index + 1}`}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-screen-lg w-full p-0">
          <div className="relative w-full aspect-square">
            <img
              src={
                processedImages[currentImageIndex]?.optimizedUrl ||
                processedImages[currentImageIndex]?.url
              }
              alt="Product full size"
              className="w-full h-full object-contain"
              loading="lazy"
            />
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
              aria-label="Close fullscreen view"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
