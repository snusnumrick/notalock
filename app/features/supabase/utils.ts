import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types/Database.types';

/**
 * Get a Supabase client instance appropriate for the current environment
 * - Uses getSupabaseClient() for browser environments
 * - Creates a basic client for server environments
 *
 * This is a useful utility for services that need to work in both
 * client and server contexts without requiring a Request object.
 */
export async function getEnvironmentSupabaseClient(): Promise<SupabaseClient<Database>> {
  // Check if we're in browser or server environment
  if (typeof window !== 'undefined') {
    // Client-side: Use getSupabaseClient
    const { getSupabaseClient } = await import('./client');
    return getSupabaseClient();
  } else {
    // Server-side: Create a basic client
    const { createClient } = await import('@supabase/supabase-js');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    return createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
}

/**
 * Get a Supabase admin client with service_role for privileged operations
 * This should only be used on the server side for admin operations that need to bypass RLS
 */
export async function getAdminSupabaseClient(): Promise<SupabaseClient<Database>> {
  // Only allow server-side usage
  if (typeof window !== 'undefined') {
    throw new Error('Admin Supabase client cannot be used in browser');
  }

  const { createClient } = await import('@supabase/supabase-js');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables for admin client');
  }

  return createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
