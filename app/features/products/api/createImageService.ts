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
  const { useServerOptimization = false } = options;

  const optimizer = useServerOptimization ? new ServerImageOptimizer() : new ClientImageOptimizer();

  return new ProductImageService(supabase, optimizer);
}
