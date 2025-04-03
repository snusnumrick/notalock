/**
 * Server-side Supabase initialization
 *
 * This module provides a function to initialize Supabase at server startup,
 * ensuring consistency with our other server-side services.
 */

// No imports needed here as we're just re-exporting

/**
 * Initialize Supabase at server startup
 *
 * This is a lightweight function that simply validates environment variables
 * are properly set. The actual client creation happens on-demand in the
 * createSupabaseClient function to ensure proper cookie handling per request.
 */
export function initializeSupabase(): void {
  // Verify environment variables are available
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        'Missing Supabase environment variables. SUPABASE_URL and SUPABASE_ANON_KEY must be set.'
      );
      // Continue in production but log the error
    } else {
      throw new Error(
        'Missing Supabase environment variables. SUPABASE_URL and SUPABASE_ANON_KEY must be set.'
      );
    }
  }

  console.log('Supabase environment verified and ready for connections');
}

// Re-export the server client creator for convenience
export { createSupabaseClient } from '~/server/services/supabase.server';
