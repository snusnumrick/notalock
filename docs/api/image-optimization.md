# Image Optimization Documentation

## Overview
The image management system in Notalock provides two main components:
1. Image Gallery UI components for managing product images
2. Image optimization service for processing uploaded images

## Components

### ImageGalleryBase
Located at: `/app/features/products/components/shared/ImageGalleryBase.tsx`

A foundational component that handles:
- Drag-and-drop reordering
- Image upload interface
- Primary image selection
- Image deletion
- Keyboard accessibility
- Customer preview integration

### TempImageGallery
Located at: `/app/features/products/components/TempImageGallery.tsx`

Manages temporary images during product creation/editing:
```typescript
<TempImageGallery
  images={tempImages}
  onImagesChange={handleTempImagesChange}
  showCustomerView={true}
/>
```

### ReorderableImageGallery
Located at: `/app/features/products/components/ReorderableImageGallery.tsx`

Manages persisted product images:
```typescript
<ReorderableImageGallery
  productId="product-123"
  images={productImages}
  onImagesChange={handleImagesChange}
  imageService={imageService}
/>
```

## Image Optimization

### Architecture
The image optimization system is designed with flexibility in mind, supporting both client-side and server-side optimization strategies.

### ImageOptimizer Interface
Located at: `/app/features/products/api/optimization/types.ts`

```typescript
interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: string;
}

interface ImageOptimizer {
  optimizeImage(file: File, options?: OptimizationOptions): Promise<Blob>;
}
```

### Available Implementations

#### ClientImageOptimizer
Located at: `/app/features/products/api/optimization/clientOptimizer.ts`

Browser-based image optimization:
- Resizes images to maximum dimensions
- Adjusts quality
- Maintains aspect ratio
- No external dependencies

```typescript
const optimizer = new ClientImageOptimizer();
const optimizedBlob = await optimizer.optimizeImage(file, {
  maxWidth: 2000,
  maxHeight: 2000,
  quality: 85
});
```

#### ServerImageOptimizer (Future)
Located at: `/app/features/products/api/optimization/serverOptimizer.ts`

Server-side optimization (planned):
- Advanced image processing
- Format conversion
- Better compression
- CDN integration

## ProductImageService
Located at: `/app/features/products/api/productImageService.ts`

Handles image upload and management:

```typescript
// Default usage (client-side optimization)
const service = new ProductImageService(supabaseClient);

// With server-side optimization
const serverOptimizer = new ServerImageOptimizer();
const service = new ProductImageService(supabaseClient, serverOptimizer);
```

### Features
- Image upload with optimization
- Primary image management
- Sort order management
- Storage cleanup on errors
- Transaction-like behavior

## Best Practices

### Image Upload
- Use WebP format when supported
- Limit maximum dimensions (2000x2000)
- Set appropriate quality (85%)
- Implement proper error handling
- Clean up temporary resources

### Performance
- Use client-side optimization for immediate feedback
- Consider server-side optimization for better results
- Clean up object URLs to prevent memory leaks
- Implement proper error boundaries
- Show loading states

## Future Improvements

### Server-Side Optimization
- Implement the server optimization API
- Add format conversion
- Improve compression
- Add CDN integration
- Add caching headers

### Enhanced Features
- Batch optimization
- Custom crop regions
- Multiple size variants
- Background removal
- Metadata preservati