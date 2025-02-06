import type { SupabaseClient } from '@supabase/supabase-js';
import { ProductImageService } from './productImageService';
import { ClientImageOptimizer, ServerImageOptimizer } from './optimization';

interface CreateImageServiceOptions {
  useServerOptimization?: boolean;
  optimizationConfig?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: string;
  };
}

export function createImageService(
  supabase: SupabaseClient,
  options: CreateImageServiceOptions = {}
) {
  const { useServerOptimization = false, optimizationConfig } = options;

  const optimizer = useServerOptimization
    ? new ServerImageOptimizer(optimizationConfig)
    : new ClientImageOptimizer(optimizationConfig);

  return new ProductImageService(supabase, optimizer);
}
