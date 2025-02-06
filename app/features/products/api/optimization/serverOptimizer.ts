// app/features/products/api/optimization/serverOptimizer.ts
import type { ImageOptimizer, OptimizationOptions } from './types';
import { ClientImageOptimizer } from './clientOptimizer';

export class ServerImageOptimizer implements ImageOptimizer {
  private clientOptimizer: ClientImageOptimizer;

  constructor() {
    this.clientOptimizer = new ClientImageOptimizer();
  }

  async optimizeImage(file: File, options: OptimizationOptions = {}): Promise<Blob> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add optimization options to the request
      if (options.maxWidth) formData.append('maxWidth', options.maxWidth.toString());
      if (options.maxHeight) formData.append('maxHeight', options.maxHeight.toString());
      if (options.quality) formData.append('quality', options.quality.toString());
      if (options.format) formData.append('format', options.format);

      const response = await fetch('/api/images/optimize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server optimization failed: ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.warn('Server-side optimization failed, falling back to client-side:', error);
      return this.clientOptimizer.optimizeImage(file, options);
    }
  }
}
