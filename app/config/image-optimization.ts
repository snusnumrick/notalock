//  app/config/image-optimization.ts

/**
 * Default image optimization configuration
 */
export interface ImageOptimizationConfig {
  // General options
  method: 'server' | 'client' | 'auto';

  // Optimization quality presets
  presets: {
    thumbnail: OptimizationPreset;
    preview: OptimizationPreset;
    full: OptimizationPreset;
  };

  // Format options
  formats: {
    preferWebp: boolean;
    enableAvif: boolean;
  };

  // Server optimization options
  server: {
    endpoint: string;
    maxRetries: number;
    retryDelay: number;
    clientFallback: boolean;
  };
}

export interface OptimizationPreset {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

/**
 * Default configuration for image optimization
 *
 * This can be overridden through environment variables:
 * - IMAGE_OPTIMIZATION_METHOD: 'server', 'client', or 'auto'
 * - IMAGE_OPTIMIZATION_SERVER_ENDPOINT: API endpoint for server optimization
 * - IMAGE_OPTIMIZATION_SERVER_FALLBACK: Enable client fallback (true/false)
 */
export const imageOptimizationConfig: ImageOptimizationConfig = {
  // Default to auto which tries server first, then client
  method: (process.env.IMAGE_OPTIMIZATION_METHOD as 'server' | 'client' | 'auto') || 'auto',

  // Quality presets for different image sizes
  presets: {
    thumbnail: {
      maxWidth: 300,
      maxHeight: 300,
      quality: 80,
    },
    preview: {
      maxWidth: 800,
      maxHeight: 800,
      quality: 85,
    },
    full: {
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 85,
    },
  },

  // Format preferences
  formats: {
    preferWebp: true,
    enableAvif: false, // Future support
  },

  // Server optimization settings
  server: {
    endpoint: process.env.IMAGE_OPTIMIZATION_SERVER_ENDPOINT || '/api/images/optimize',
    maxRetries: 1,
    retryDelay: 200,
    clientFallback: process.env.IMAGE_OPTIMIZATION_SERVER_FALLBACK !== 'false',
  },
};

/**
 * Determines whether to use server-side optimization based on config and environment
 */
export function shouldUseServerOptimization(): boolean {
  const { method } = imageOptimizationConfig;

  // Auto uses server in production, client in development
  if (method === 'auto') {
    return process.env.NODE_ENV === 'production';
  }

  return method === 'server';
}

/**
 * Creates optimization options based on a preset
 */
export function getOptimizationOptions(
  preset: keyof ImageOptimizationConfig['presets']
): OptimizationPreset {
  const { presets } = imageOptimizationConfig;
  const config = presets[preset];

  return {
    maxWidth: config.maxWidth,
    maxHeight: config.maxHeight,
    quality: config.quality,
  };
}

/**
 * Creates server optimizer options from config
 */
export function getServerOptimizerOptions() {
  const { server } = imageOptimizationConfig;

  return {
    endpoint: server.endpoint,
    maxRetries: server.maxRetries,
    clientFallback: server.clientFallback,
  };
}
