# Image Management System

## Overview
The image management system provides comprehensive functionality for handling product images in Notalock. It supports multiple images per product, drag-and-drop reordering, and an enhanced customer gallery experience.

## Components

### Core Components

#### ImageGalleryBase
Located at: `/app/features/products/components/shared/ImageGalleryBase.tsx`

A foundational component that handles common image gallery functionality:
- Drag-and-drop reordering
- Primary image selection
- Image deletion
- Upload interface
- Keyboard accessibility
- Customer preview integration

Usage:
```typescript
<ImageGalleryBase
  images={images}
  onImagesChange={handleImagesChange}
  onUpload={handleUpload}
  onDelete={handleDelete}
  onSetPrimary={handleSetPrimary}
  showCustomerView={true}
/>
```

#### TempImageGallery
Located at: `/app/features/products/components/TempImageGallery.tsx`

Used during product creation/editing for temporary image management:
- Handles temporary image storage using URLs
- Auto-assigns first image as primary
- Provides customer preview
- No server persistence

Usage:
```typescript
<TempImageGallery
  images={tempImages}
  onImagesChange={handleTempImagesChange}
  showCustomerView={true}
/>
```

#### ReorderableImageGallery
Located at: `/app/features/products/components/ReorderableImageGallery.tsx`

Used for managing persisted product images:
- Integrates with ProductImageService for CRUD operations
- Handles server-side image storage
- Maintains image order in database
- Supports primary image designation

Usage:
```typescript
<ReorderableImageGallery
  productId="product-123"
  images={productImages}
  onImagesChange={handleImagesChange}
  imageService={imageService}
/>
```

### Customer-Facing Components

#### ProductGallery
Located at: `/app/features/products/components/ProductGallery.tsx`

The main product gallery component for customers:
- Image zoom functionality
- Lightbox view
- Touch swipe navigation
- Thumbnail navigation
- Keyboard controls

## Services

### ProductImageService
Located at: `/app/features/products/api/productImageService.ts`

Handles all image-related operations:

```typescript
interface ProductImageService {
  // Upload multiple images
  uploadMultipleImages(files: File[], productId: string): Promise<ProductImage[]>;

  // Delete an image
  deleteImage(imageId: string): Promise<void>;

  // Set primary image
  setPrimaryImage(imageId: string): Promise<void>;
}
```

## Types

### Image Types
Located at: `/app/features/products/types/product.types.ts`

```typescript
interface GalleryImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface TempImage extends GalleryImage {
  file: File;
}

interface ProductImage extends GalleryImage {
  product_id: string;
  storage_path: string;
  file_name: string;
  sort_order: number;
  created_at: string;
}
```

## Best Practices

### Image Upload
- Support WebP, JPG, and PNG formats
- Handle client-side preview generation
- Clean up object URLs to prevent memory leaks
- Implement proper error handling
- Show upload progress feedback

### User Experience
- Drag-and-drop support
- Keyboard accessibility
- Clear visual feedback
- Mobile-friendly interface
- Instant preview updates

### Error Handling
- Clear error messages
- Graceful fallbacks
- Loading states
- Upload validation
- Network error recovery

## Future Improvements

### 1. Image Optimization
- Client-side image compression
- Automatic format conversion
- Size restrictions
- Quality optimization
- Responsive image generation

### 2. Enhanced Features
- Multiple selection
- Batch operations
- Advanced sorting
- Image editing
- Custom cropping

### 3. Performance
- Lazy loading
- Progressive loading
- Caching strategy
- Bandwidth optimization
- Upload queue management