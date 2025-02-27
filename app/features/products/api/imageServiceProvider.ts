// app/features/products/api/imageServiceProvider.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import { ProductImageService } from './productImageService';
import { ServerImageOptimizer } from './optimization/serverOptimizer';
import { ClientImageOptimizer } from './optimization/clientOptimizer';
import {
  shouldUseServerOptimization,
  getServerOptimizerOptions,
  type OptimizationPreset,
} from '~/config/image-optimization';

/**
 * Creates an image service with the optimal configuration based on environment
 *
 * This is the recommended way to get an image service instance as it:
 * - Uses proper optimization method (server or client) based on config
 * - Sets appropriate optimization options
 * - Handles server fallback correctly
 *
 * @param supabase Supabase client instance
 * @param options Optional configuration overrides
 * @returns Configured ProductImageService instance
 */
export function getImageService(
  supabase: SupabaseClient,
  options?: {
    forceServerOptimization?: boolean;
    forceClientOptimization?: boolean;
    optimizationConfig?: OptimizationPreset;
  }
): ProductImageService {
  // Determine optimization method
  const useServerOpt =
    options?.forceServerOptimization ||
    (!options?.forceClientOptimization && shouldUseServerOptimization());

  // Create the service with appropriate configuration
  if (useServerOpt) {
    const serverOptions = getServerOptimizerOptions();
    const optimizer = new ServerImageOptimizer(serverOptions);

    return new ProductImageService(supabase, optimizer);
  } else {
    // Use client optimization
    return new ProductImageService(supabase, new ClientImageOptimizer());
  }
}

/**
 * Creates an image service for admin operations
 *
 * Admins typically benefit from server-side optimization for higher quality
 * and better compression, but this can be overridden by configuration.
 *
 * @param supabase Supabase client instance
 * @returns Configured ProductImageService instance for admin use
 */
export function getAdminImageService(supabase: SupabaseClient): ProductImageService {
  return getImageService(supabase, { forceServerOptimization: true });
}

/**
 * Creates an image service for customer-facing operations
 *
 * Customer-facing operations typically prefer client-side optimization for
 * better performance and reduced server load, but this can be overridden.
 *
 * @param supabase Supabase client instance
 * @returns Configured ProductImageService instance for customer use
 */
export function getCustomerImageService(supabase: SupabaseClient): ProductImageService {
  return getImageService(supabase, { forceClientOptimization: true });
}
