// app/features/products/api/optimization/clientOptimizer.ts
import type { ImageOptimizer, OptimizationOptions } from './types';

export class ClientImageOptimizer implements ImageOptimizer {
  async optimizeImage(file: File, options: OptimizationOptions = {}): Promise<Blob> {
    const { maxWidth = 2000, maxHeight = 2000, quality = 85 } = options;

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            blob => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to convert image to blob'));
              }
            },
            file.type,
            quality / 100
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));

      const reader = new FileReader();
      reader.onload = e => (img.src = e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}
