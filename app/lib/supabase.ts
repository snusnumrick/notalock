import { createClient } from '@supabase/supabase-js';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import type { Database } from '~/features/supabase/types/Database.types';

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

// Query utility types and functions
export interface SupabaseOrderConfig {
  ascending?: boolean;
  nullsFirst?: boolean;
  nullsLast?: boolean;
  foreignTable?: string | undefined;
}

/**
 * Creates a stable order by adding a secondary sort on 'id'
 *
 * For cursor-based pagination, use:
 * - The appropriate primary order
 * - Always add .order('id', { ascending: true }) for cursor stability regardless of primary sort
 */
export function createStableOrder<
  Row extends Record<string, unknown>,
  RelationName extends string = never,
  Relationships extends Record<string, unknown> = Record<string, unknown>,
>(
  primaryColumn: string,
  primaryOptions: SupabaseOrderConfig | undefined,
  query: PostgrestFilterBuilder<Database['public'], Row, Row[], RelationName, Relationships>
): PostgrestFilterBuilder<Database['public'], Row, Row[], RelationName, Relationships> {
  // To support cursor-based pagination, we don't modify the query directly
  // Return what was passed in for caller to use if they want the order
  return query.order(primaryColumn, primaryOptions);
  // Caller can add .order('id') explicitly as needed
}

// Helper function for configuring order in queries
export function orderWithConfig<
  Row extends Record<string, unknown>,
  Result extends Record<string, unknown> = Row,
  RelationName extends string = never,
  Relationships extends Record<string, unknown> = Record<string, unknown>,
>(
  query: PostgrestFilterBuilder<Database['public'], Row, Result, RelationName, Relationships>,
  column: string,
  options?: SupabaseOrderConfig
): PostgrestFilterBuilder<Database['public'], Row, Result, RelationName, Relationships> {
  return query.order(column, options);
}
