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

let supabase: ReturnType<typeof createClient<Database>>;

const getSupabase = () => {
  if (supabase) return supabase;

  // Get environment variables from window.ENV in the browser
  // or from process.env on the server
  const supabaseUrl =
    typeof window !== 'undefined' ? window.ENV.SUPABASE_URL : process.env.SUPABASE_URL;
  const supabaseAnonKey =
    typeof window !== 'undefined' ? window.ENV.SUPABASE_ANON_KEY : process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return supabase;
};

export const useSupabase = () => {
  return { supabase: getSupabase() };
};

export type SupabaseClient = ReturnType<typeof getSupabase>;
