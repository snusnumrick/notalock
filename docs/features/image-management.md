# Image Management System

## Overview
The image management system provides comprehensive functionality for handling product images in Notalock. It supports multiple images per product, drag-and-drop reordering, image optimization, and an enhanced customer gallery experience.

## Key Features
- Multi-file upload with progress feedback
- Drag-and-drop image reordering
- Automatic image optimization
- Enhanced customer gallery with zoom and lightbox
- Touch-friendly mobile experience
- Primary image designation
- Bulk upload support

## Components

### Customer-Facing Components

#### ProductGallery
Located at: `/app/features/products/components/ProductGallery.tsx`

The main product gallery component for customers, featuring:
- Image zoom functionality
- Lightbox view
- Touch swipe navigation
- Thumbnail navigation
- Keyboard controls (left/right arrows)
- Responsive design

Usage:
```typescript
<ProductGallery 
  images={[
    { id: '1', url: '/image-url', is_primary: true },
    // ... more images
  ]} 
/>
```

### Admin Components

#### ReorderableImageGallery
Located at: `/app/features/products/components/ReorderableImageGallery.tsx`

Admin interface for managing product images:
- Drag-and-drop reordering
- Multi-file upload
- Primary image selection
- Image deletion
- Upload progress feedback

Usage:
```typescript
<ReorderableImageGallery
  productId="product-123"
  images={productImages}
  onImagesChange={handleImagesChange}
  imageService={imageService}
/>
```

## Services

### ProductImageService
Located at: `/app/features/products/api/productImageService.ts`

Handles all image-related operations:

#### Methods

```typescript
// Upload a single image
uploadImage(file: File, productId: string, isPrimary?: boolean): Promise<ProductImage>

// Upload multiple images
uploadMultipleImages(files: File[], productId: string): Promise<ProductImage[]>

// Update image order
updateImageOrder(imageId: string, newOrder: number): Promise<void>

// Delete an image
deleteImage(imageId: string): Promise<void>

// Set primary image
setPrimaryImage(imageId: string): Promise<void>

// Get all product images
getProductImages(productId: string): Promise<ProductImage[]>
```

## Image Optimization

### Client-Side Optimization
- Automatic resizing of large images before upload
- Conversion to optimal format
- Quality optimization (85% quality setting)

### Server-Side Optimization
Located at: `/app/routes/api/images/optimize.ts`

Provides on-demand image optimization:
- Resizing for different screen sizes
- WebP conversion
- Quality adjustment
- Caching headers for performance

Usage:
```
GET /api/images/optimize?url=image-path&width=800&quality=80
```

## Custom Hooks

### useImageReorder
Located at: `/app/features/products/hooks/useImageReorder.ts`

Manages image reordering functionality:
- Handles drag and drop state
- Updates image order in the database
- Provides optimistic UI updates
- Handles error cases with rollback

Usage:
```typescript
const {
  images,
  isDragging,
  moveImage,
  handleDragStart,
  handleDragEnd
} = useImageReorder(initialImages, imageService, onImagesChange);
```

## Database Schema

### product_images Table
```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_sort_order ON product_images(sort_order);
```

### Storage Configuration
- Bucket: `product-images`
- Path structure: `{productId}/{uniqueId}.{extension}`
- Cache Control: 3600 seconds
- Public access enabled for customer viewing

## Best Practices

### Image Upload
- Use WebP format when supported
- Limit maximum dimensions (2000x2000)
- Optimize quality (85%)
- Implement retry logic for failed uploads
- Clean up storage on failed database inserts

### Performance
- Preload next/previous images
- Use appropriate image sizes for different screens
- Implement proper caching headers
- Lazy load thumbnails
- Use optimistic UI updates

### Security
- Validate file types
- Limit file sizes
- Implement proper RLS policies
- Sanitize file names
- Secure storage bucket configuration

## Error Handling
- Graceful fallbacks for failed uploads
- Clear error messages for users
- Automatic cleanup of orphaned files
- Optimistic UI updates with rollback
- Retry mechanisms for network issues

## Mobile Considerations
- Touch-friendly interfaces
- Swipe gestures for navigation
- Responsive image sizing
- Bandwidth-aware loading
- Mobile-optimized lightbox

## Future Improvements

### 1. Image Variant Generation
- Generate multiple sizes on upload
- Responsive image srcset
- Automatic format selection
- Custom crop variants
- Thumbnail optimization

### 2. Advanced Optimization
- AI-powered compression
- Automatic cropping
- Background removal options
- Image enhancement filters
- Metadata preservation

### 3. Enhanced Features
- Bulk editing capabilities
- Advanced sorting options
- Image tagging system
- AI-powered image search
- Version history

### 4. Advanced Analytics
- Image load performance tracking
- User interaction analytics
- Storage usage monitoring
- Optimization effectiveness metrics
- Error rate tracking

### 5. Integration Capabilities
- CDN integration
- Third-party optimization services
- Social media sharing
- External image import
- Backup solutions