// app/features/products/api/optimization/types.ts
export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: string;
}

export interface ImageOptimizer {
  optimizeImage(file: File, options?: OptimizationOptions): Promise<Blob>;
}
