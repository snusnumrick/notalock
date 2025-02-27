// app/features/products/api/optimization/serverOptimizer.ts
import type { ImageOptimizer, OptimizationOptions } from './types';
import { ClientImageOptimizer } from './clientOptimizer';

/**
 * Server-side image optimizer that uses the API endpoint for optimization.
 * Automatically falls back to client-side optimization if server fails.
 */
export class ServerImageOptimizer implements ImageOptimizer {
  private clientOptimizer?: ClientImageOptimizer;
  private endpoint: string;
  private maxRetries: number;

  /**
   * Create a new ServerImageOptimizer instance
   *
   * @param options Configuration options
   * @param options.endpoint API endpoint URL (default: '/api/images/optimize')
   * @param options.maxRetries Number of retries before fallback (default: 1)
   * @param options.clientFallback Whether to enable client fallback (default: true)
   */
  constructor(options?: { endpoint?: string; maxRetries?: number; clientFallback?: boolean }) {
    const {
      endpoint = '/api/images/optimize',
      maxRetries = 1,
      clientFallback = true,
    } = options || {};

    this.endpoint = endpoint;
    this.maxRetries = maxRetries;

    if (clientFallback) {
      this.clientOptimizer = new ClientImageOptimizer();
    }
  }

  /**
   * Optimize an image using the server API
   *
   * @param file Image file to optimize
   * @param options Optimization options
   * @returns Promise resolving to an optimized image blob
   */
  async optimizeImage(file: File, options: OptimizationOptions = {}): Promise<Blob> {
    let lastError: Error | null = null;
    let retries = 0;

    // Try server optimization with retries
    while (retries <= this.maxRetries) {
      try {
        // Measure original size for telemetry
        const originalSize = file.size;

        // Prepare form data
        const formData = new FormData();
        formData.append('file', file);

        // Determine best format based on options and browser support
        const format = this.getBestFormat(options);

        // Add optimization options to the request
        if (options.maxWidth) formData.append('maxWidth', options.maxWidth.toString());
        if (options.maxHeight) formData.append('maxHeight', options.maxHeight.toString());
        if (options.quality) formData.append('quality', options.quality.toString());
        formData.append('format', format);

        // Process with exponential backoff
        const backoffMs = retries > 0 ? Math.pow(2, retries) * 100 : 0;
        if (backoffMs > 0) {
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }

        // Send request to server
        const response = await fetch(this.endpoint, {
          method: 'POST',
          body: formData,
        });

        // Handle server errors
        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Server optimization failed (${response.status}): ${text || response.statusText}`
          );
        }

        // Get optimized image
        const blob = await response.blob();

        // Track optimization metrics
        this.trackOptimization(originalSize, blob.size, format, true);

        return blob;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retries++;
      }
    }

    // If client fallback is available, use it
    if (this.clientOptimizer) {
      console.warn(
        'Server-side optimization failed after retries, falling back to client-side:',
        lastError
      );
      try {
        const originalSize = file.size;
        const optimizedBlob = await this.clientOptimizer.optimizeImage(file, options);

        // Track fallback optimization metrics
        this.trackOptimization(
          originalSize,
          optimizedBlob.size,
          options.format || 'unknown',
          false
        );

        return optimizedBlob;
      } catch (clientError) {
        console.error('Client-side fallback also failed:', clientError);
        // If client optimization also fails, throw the original server error
        throw lastError;
      }
    }

    // If no fallback or fallback failed, throw the last error
    throw lastError;
  }

  /**
   * Determine optimal image format based on options and browser support
   *
   * @param options Optimization options
   * @returns The best format to use
   */
  private getBestFormat(options: OptimizationOptions): string {
    // If format is explicitly specified, use it
    if (options.format) {
      return options.format;
    }

    // Default to WebP as it has excellent compression and good browser support
    return 'webp';
  }

  /**
   * Track optimization metrics
   *
   * @param originalSize Original image size in bytes
   * @param optimizedSize Optimized image size in bytes
   * @param format Image format
   * @param isServer Whether server optimization was used
   */
  private trackOptimization(
    originalSize: number,
    optimizedSize: number,
    format: string,
    isServer: boolean
  ): void {
    const method = isServer ? 'server' : 'client';
    const ratio = originalSize > 0 ? originalSize / optimizedSize : 1;
    const savings = originalSize - optimizedSize;
    const savingsPercent = originalSize > 0 ? (savings / originalSize) * 100 : 0;

    console.log(
      `Image optimization [${method}] [${format}]: ` +
        `${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB ` +
        `(${ratio.toFixed(1)}x ratio, saved ${savingsPercent.toFixed(1)}%)`
    );

    // In production, we could send these metrics to analytics
    // if (process.env.NODE_ENV === 'production') { ... }
  }
}
