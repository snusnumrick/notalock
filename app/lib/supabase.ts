import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database';

declare global {
  interface Window {
    ENV: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    };
  }
}

export const getSupabase = () => {
  // Get environment variables from window.ENV in the browser
  // or from process.env on the server
  const supabaseUrl =
    typeof window !== 'undefined' ? window.ENV.SUPABASE_URL : process.env.SUPABASE_URL;
  const supabaseAnonKey =
    typeof window !== 'undefined' ? window.ENV.SUPABASE_ANON_KEY : process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Create a new client instance each time
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // This ensures proper session handling
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

export const useSupabase = () => {
  return { supabase: getSupabase() };
};

export type SupabaseClient = ReturnType<typeof getSupabase>;
