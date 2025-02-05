# Image Optimization API

## Overview
The image optimization API provides on-demand image processing capabilities, including resizing, format conversion, and quality optimization. It's designed to deliver optimized images for different device sizes and network conditions.

## Endpoint

```
GET /api/images/optimize
```

## Query Parameters

| Parameter | Type    | Required | Default | Description                                                          |
|-----------|---------|----------|---------|----------------------------------------------------------------------|
| url       | string  | Yes      | -       | Path to the original image in Supabase storage                      |
| width     | number  | No       | 800     | Desired width of the output image                                   |
| quality   | number  | No       | 80      | Output image quality (1-100)                                        |
| format    | string  | No       | 'webp'  | Output format ('webp', 'jpeg', 'png')                              |
| fit       | string  | No       | 'inside'| Resizing behavior ('inside', 'cover', 'contain', 'fill')           |

## Response

### Success Response

```
Status: 200 OK
Content-Type: image/webp (or image/jpeg, image/png)
Cache-Control: public, max-age=31536000, immutable
```

The response body contains the optimized image binary data.

### Error Responses

#### Missing URL
```json
Status: 400 Bad Request
{
  "error": "Image URL is required"
}
```

#### Image Not Found
```json
Status: 404 Not Found
{
  "error": "Failed to download image"
}
```

#### Processing Error
```json
Status: 500 Internal Server Error
{
  "error": "Failed to optimize image"
}
```

## Examples

### Basic Usage
```typescript
// Get an optimized image at default settings
fetch('/api/images/optimize?url=products/123/image.jpg')
```

### Custom Size and Quality
```typescript
// Get a 1200px wide image at 90% quality
fetch('/api/images/optimize?url=products/123/image.jpg&width=1200&quality=90')
```

### Specific Format
```typescript
// Get a PNG version of the image
fetch('/api/images/optimize?url=products/123/image.jpg&format=png')
```

## Implementation Details

### Processing Pipeline
1. Image download from Supabase storage
2. Format conversion (if requested)
3. Resize operation
4. Quality optimization
5. Response delivery

### Sharp Configuration
```typescript
sharp(imageBuffer)
  .resize(width, null, {
    withoutEnlargement: true,
    fit: 'inside',
  })
  .webp({ quality })
```

### Caching Strategy
- Client-side caching with `max-age=31536000` (1 year)
- Immutable cache directive for better performance
- Unique URLs per configuration for proper cache invalidation

## Usage with React Components

### Basic Image Component
```typescript
function OptimizedImage({ url, width = 800, quality = 80 }) {
  const optimizedUrl = `/api/images/optimize?url=${encodeURIComponent(url)}&width=${width}&quality=${quality}`;
  
  return <img src={optimizedUrl} alt="" loading="lazy" />;
}
```

### Responsive Image Component
```typescript
function ResponsiveImage({ url, sizes }) {
  const srcSet = sizes
    .map(size => {
      const optimizedUrl = `/api/images/optimize?url=${encodeURIComponent(url)}&width=${size}`;
      return `${optimizedUrl} ${size}w`;
    })
    .join(', ');

  return (
    <img
      src={`/api/images/optimize?url=${encodeURIComponent(url)}&width=${sizes[0]}`}
      srcSet={srcSet}
      sizes="(max-width: 768px) 100vw, 50vw"
      alt=""
      loading="lazy"
    />
  );
}
```

## Best Practices

### Performance Optimization
1. Request appropriate sizes
   - Use responsive images for different viewports
   - Don't request larger sizes than needed
   - Consider device pixel ratios

2. Quality settings
   - Use 80-85% quality for photos
   - Use 90-95% quality for graphics/logos
   - Test quality settings with your content

3. Caching
   - Implement client-side caching
   - Use CDN caching where possible
   - Cache at the edge when available

### Error Handling
```typescript
async function fetchOptimizedImage(url, options = {}) {
  try {
    const params = new URLSearchParams({
      url,
      ...options
    });
    
    const response = await fetch(`/api/images/optimize?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    return response;
  } catch (error) {
    console.error('Image optimization failed:', error);
    // Fall back to original image
    return fetch(url);
  }
}
```

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per IP
- Configurable via environment variables

## Monitoring

### Metrics Tracked
- Request count by size/format
- Processing time
- Error rates
- Cache hit rates
- Bandwidth usage

### Health Checks
```
GET /api/images/optimize/health

Response:
{
  "status": "healthy",
  "processingTime": "45ms",
  "memoryUsage": "156MB",
  "uptime": "2d 4h"
}
```

## Security Considerations

### URL Validation
- Only allow URLs from authorized domains
- Validate storage paths
- Prevent directory traversal

### Resource Limits
- Maximum input file size: 10MB
- Maximum output dimensions: 2000x2000
- Rate limiting per IP/user
- Timeout: 30 seconds

## Future Enhancements

### Planned Features
1. Automatic format selection based on client support
2. AI-powered image optimization
3. Custom transformation presets
4. Batch processing endpoint
5. WebP and AVIF support with fallbacks

### Under Consideration
1. Face detection for smart cropping
2. Background removal
3. Real-time image effects
4. Integration with external optimization services
5. Advanced metadata handling