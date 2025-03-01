import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a chainable mock method that returns itself for all method calls
 * This allows arbitrarily long method chains in tests
 */
function createChainableMock(finalValue?: unknown): Record<string, unknown> {
  const handler = {
    get: (
      _target: Record<string, unknown>,
      prop: string | symbol
    ): ((resolve: (value: unknown) => unknown) => unknown) | (() => Record<string, unknown>) => {
      if (prop === 'then') {
        // When the chain is awaited, resolve with the final value
        return (resolve: (value: unknown) => unknown) => resolve(finalValue);
      }
      // Return a function that returns a new Proxy with the same handler
      return () => new Proxy({}, handler);
    },
  };

  return new Proxy({}, handler);
}

/**
 * Creates a configurable Supabase client mock with chainable query methods
 * @param customResponses Map of custom responses for specific method chains
 */
export function createSupabaseMock(customResponses: Record<string, unknown> = {}) {
  // Default response for the mock
  const defaultResponse = {
    data: null,
    error: null,
  };

  // Create a handler function for method calls that can return custom responses
  const supabaseHandler = {
    get: (_target: Record<string, unknown>, prop: string) => {
      // Special case for from() as the entry point to query chains
      if (prop === 'from') {
        return (table: string) => {
          // Create a chainable mock for this table's queries
          return createChainableMock({
            data: customResponses[table] || null,
            error: null,
          });
        };
      }

      // For auth methods
      if (prop === 'auth') {
        return {
          getSession: vi.fn().mockResolvedValue({
            data: customResponses.session || { session: { user: { id: 'test-user-id' } } },
            error: null,
          }),
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
          signUp: vi.fn().mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null,
          }),
          signOut: vi.fn().mockResolvedValue({
            error: null,
          }),
          onAuthStateChange: vi.fn().mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
          }),
        };
      }

      // For storage methods
      if (prop === 'storage') {
        return {
          from: vi.fn().mockReturnValue({
            upload: vi.fn().mockResolvedValue({
              data: { path: 'test-path' },
              error: null,
            }),
            getPublicUrl: vi.fn().mockReturnValue({
              data: { publicUrl: 'https://example.com/test-image.jpg' },
            }),
            download: vi.fn().mockResolvedValue({
              data: new Blob(),
              error: null,
            }),
            list: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
            remove: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
      }

      // For any other property, return a function that resolves to the default response
      return vi.fn().mockResolvedValue(defaultResponse);
    },
  };

  // Create the mock using a Proxy
  return new Proxy({}, supabaseHandler) as unknown as SupabaseClient;
}
