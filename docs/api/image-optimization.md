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

#### ServerImageOptimizer (Fully Implemented)
Located at: `/app/features/products/api/optimization/serverOptimizer.ts`

Server-side optimization:
- Advanced image processing with Sharp
- Format conversion (JPEG, PNG, WebP)
- Better compression
- Dimension control
- Client-side fallback for reliability

```typescript
const optimizer = new ServerImageOptimizer();
const optimizedBlob = await optimizer.optimizeImage(file, {
  maxWidth: 2000,
  maxHeight: 2000,
  quality: 85,
  format: 'webp'
});
```

## Server-Side Optimization

### API Endpoint
Located at: `/app/routes/api.images.optimize.ts`

The API endpoint accepts `POST` requests with multipart form data containing:
- `file`: The image file to optimize
- `maxWidth`: Optional maximum width
- `maxHeight`: Optional maximum height
- `quality`: Optional quality percentage (1-100)
- `format`: Optional output format (webp, jpeg, png)

### Middleware
Located at: `/app/server/middleware/image.server.ts`

The server middleware uses Sharp for high-quality image processing with features:
- Image resizing with aspect ratio preservation
- Format conversion (WebP, JPEG, PNG)
- Quality adjustment
- Proper error handling

### Integration System
Located at: `/app/features/products/api/imageServiceProvider.ts`

Provides factory functions to create properly configured image services:
- `getImageService`: Creates an image service with optimal configuration
- `getAdminImageService`: Creates a service optimized for admin operations (server-side)
- `getCustomerImageService`: Creates a service optimized for customer operations (client-side)

```typescript
// In admin routes
import { getAdminImageService } from '~/features/products/api/imageServiceProvider';

// Get an image service with server-side optimization
const imageService = getAdminImageService(supabase);
```

### Configuration System
Located at: `/app/config/image-optimization.ts`

Provides centralized configuration for image optimization:
- Method selection (server, client, auto)
- Quality presets (thumbnail, preview, full)
- Format preferences
- Server configuration options

## ProductImageService
Located at: `/app/features/products/api/productImageService.ts`

Handles image upload and management:

```typescript
// Integration with the image service provider
import { getImageService } from '~/features/products/api/imageServiceProvider';

const service = getImageService(supabaseClient);
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
- Use server-side optimization for better results
- Clean up object URLs to prevent memory leaks
- Implement proper error boundaries
- Show loading states

## Future Improvements

### Enhanced Features
- Add advanced format options (AVIF support)
- Enhance middleware with metadata preservation
- Add telemetry to track optimization metrics
- Create developer documentation with usage examples

### Production Optimization
- Add CDN integration
- Implement caching headers
- Create size variants (thumbnail, preview, full)
- Add responsive image generation
- Implement lazy loading integration
