import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/Database.types';

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Creates or returns a singleton Supabase client for client-side use
 * This prevents multiple client instances from being created
 */
export function getSupabaseClient(): ReturnType<typeof createClient<Database>> {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient should only be called on the client side');
  }

  // Use existing client if available
  if (supabaseClient) {
    return supabaseClient;
  }

  // Get environment variables from window.ENV
  // Define a type for the window ENV object
  interface WindowEnv {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    [key: string]: unknown;
  }

  // Access window.ENV with proper typing
  const env = ((window as unknown as { ENV?: WindowEnv }).ENV || {}) as WindowEnv;
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Create new client
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      detectSessionInUrl: true,
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  return supabaseClient;
}
