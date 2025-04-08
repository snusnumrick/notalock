import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

/**
 * Debug API route for diagnosing environment issues
 * Only returns non-sensitive information
 */
export async function loader(_args: LoaderFunctionArgs) {
  // Gather debug information
  const debugInfo = {
    // Only include the presence of environment variables, not their values
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      DEFAULT_PAYMENT_PROVIDER: process.env.DEFAULT_PAYMENT_PROVIDER,
      SQUARE_CONFIG_PRESENT: !!(
        process.env.SQUARE_ACCESS_TOKEN &&
        process.env.SQUARE_APP_ID &&
        process.env.SQUARE_LOCATION_ID
      ),
      STRIPE_CONFIG_PRESENT: !!(
        process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY
      ),
    },
    // Include non-sensitive runtime information
    runtime: {
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
      platform: process.platform,
      arch: process.arch,
      version: process.version,
    },
  };

  return json(debugInfo);
}
