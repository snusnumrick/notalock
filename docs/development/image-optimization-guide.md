# Image Optimization Integration Guide

## Overview

This guide explains how to integrate the image optimization system into the Notalock application. The system provides both server-side (Sharp) and client-side (Canvas) optimization with automatic fallback capabilities.

## Current Status

- ✅ Server middleware with Sharp is implemented
- ✅ Client-side fallback with Canvas is implemented
- ✅ API endpoint for server optimization is available
- ⏳ Integration with application components needs to be completed

## Integration Checklist

To properly utilize the image optimization system, follow this checklist:

- [ ] Update `ProductImageService` instantiation to use server optimization
- [ ] Configure optimization options based on use case
- [ ] Add feature flags to control optimization behavior
- [ ] Implement browser capability detection for format selection
- [ ] Add telemetry for tracking optimization effectiveness

## How to Use Server Optimization

### 1. Basic Integration

When creating a `ProductImageService` instance, enable server optimization:

```typescript
import { createImageService } from '~/features/products/api/productImageService';
import { createSupabaseClient } from '~/server/middleware';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseClient(request, response);
  
  // Create service with server optimization enabled
  const imageService = createImageService(supabase, {
    useServerOptimization: true,
    // Optional custom optimization config
    optimizationConfig: {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 85,
      format: 'webp'
    }
  });
  
  // Use the service normally - optimization happens transparently
  // ...
  
  return json(data, { headers: response.headers });
};
```

### 2. Advanced Configuration

For more control, create a `ServerImageOptimizer` instance directly:

```typescript
import { ServerImageOptimizer } from '~/features/products/api/optimization';
import { ProductImageService } from '~/features/products/api/productImageService';

// Create optimizer with custom configuration
const optimizer = new ServerImageOptimizer({
  endpoint: '/api/images/optimize',
  maxRetries: 2,
  clientFallback: true
});

// Create service with custom optimizer
const imageService = new ProductImageService(supabase, optimizer);
```

### 3. Environment-Based Configuration

Use environment variables to control optimization behavior:

```typescript
import { createImageService } from '~/features/products/api/productImageService';

// Function to decide optimization mode based on environment
function shouldUseServerOptimization() {
  // Check feature flag or environment variable
  const envFlag = process.env.ENABLE_SERVER_OPTIMIZATION;
  
  // Default to true in production, false in development
  if (envFlag === undefined) {
    return process.env.NODE_ENV === 'production';
  }
  
  return envFlag === 'true';
}

// Create appropriate service
const imageService = createImageService(supabase, {
  useServerOptimization: shouldUseServerOptimization()
});
```

## Implementation Examples

### Product Admin Route

Here's a complete example for a product admin route:

```typescript
// app/routes/admin.products.$id.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { requireAdmin, createSupabaseClient } from '~/server/middleware';
import { createImageService } from '~/features/products/api/productImageService';
import { ReorderableImageGallery } from '~/features/products/components/ReorderableImageGallery';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const { user, response } = await requireAdmin(request);
    const supabase = createSupabaseClient(request, response);
    const productId = params.id;
    
    // Create image service with server optimization
    const imageService = createImageService(supabase, {
      useServerOptimization: true,
      optimizationConfig: {
        maxWidth: 2000,
        maxHeight: 2000,
        quality: 85
      }
    });
    
    // Fetch product images
    const images = await imageService.getProductImages(productId);
    
    return json({ 
      product, 
      images,
      user
    }, {
      headers: response.headers
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    throw new Response('Failed to load product', { status: 500 });
  }
};

export default function ProductEditPage() {
  const { product, images } = useLoaderData<typeof loader>();
  
  // Component implementation
  return (
    <div>
      {/* Other product fields */}
      
      <ReorderableImageGallery
        productId={product.id}
        images={images}
        onImagesChange={handleImagesChange}
        imageService={imageService}
      />
    </div>
  );
}
```

### Testing the Optimization

Add tests to verify optimization is working properly:

```typescript
// app/features/products/api/__tests__/imageOptimization.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createImageService } from '../productImageService';
import { ServerImageOptimizer } from '../optimization/serverOptimizer';

vi.mock('../optimization/serverOptimizer');

describe('Image Service Optimization', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  it('should use client optimization by default', () => {
    const supabase = {} as any;
    const service = createImageService(supabase);
    
    expect(ServerImageOptimizer).not.toHaveBeenCalled();
  });
  
  it('should use server optimization when configured', () => {
    const supabase = {} as any;
    const service = createImageService(supabase, {
      useServerOptimization: true
    });
    
    expect(ServerImageOptimizer).toHaveBeenCalled();
  });
  
  it('should pass optimization config to the server optimizer', () => {
    const supabase = {} as any;
    const service = createImageService(supabase, {
      useServerOptimization: true,
      optimizationConfig: {
        maxWidth: 1000,
        quality: 75
      }
    });
    
    expect(ServerImageOptimizer).toHaveBeenCalledWith(expect.any(Object));
  });
});
```

## Best Practices

1. **Enable server optimization for admin routes only**
   - Server optimization adds overhead that's more appropriate for admin operations
   - For public-facing routes, consider client-side or CDN optimization

2. **Use appropriate image dimensions**
   - Don't over-optimize - set dimensions based on actual display requirements
   - For product images, 2000px maximum is a good balance of quality and size

3. **Always enable client fallback**
   - Server optimization may fail due to temporary issues
   - Client fallback ensures a good user experience even when server is unavailable

4. **Track optimization metrics**
   - Monitor compression ratios and size savings
   - Adjust quality/format settings based on real-world results

5. **Consider modern formats**
   - WebP offers better compression than JPEG/PNG with broad browser support
   - When targeting modern browsers, consider AVIF for even better results

## Troubleshooting

### Server optimization fails silently

Check that:
- The API route exists at `/api/images/optimize`
- The Sharp package is installed correctly
- The server has enough memory for image processing

### Client fallback is slow

- Reduce the maximum dimensions for optimization
- Use a more memory-efficient format
- Consider adding a loading indicator during optimization

### Poor image quality after optimization

- Increase the quality parameter (85-90 is a good balance)
- Adjust maximum dimensions to be appropriate for the display size
- For product images, ensure 2000px width/height to retain detail

## Related Documentation

- [Image Optimization Overview](../api/image-optimization.md)
- [Product Image Management](../features/products.md)
- [Server Middleware Documentation](./middleware.md)
