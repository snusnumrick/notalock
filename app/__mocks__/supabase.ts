import { vi } from 'vitest';

/**
 * Creates a complete mock of the Supabase client with chainable query methods
 * Based on the testing guidelines in docs/development/testing.md
 *
 * Usage example:
 * const mockSupabase = createSupabaseMock({
 *   fromData: {
 *     products: mockProductData
 *   },
 *   singleData: {
 *     data: mockSingleProduct,
 *     error: null
 *   }
 * });
 */
interface SupabaseMocks {
  fromData: Record<string, unknown>;
  singleData: unknown;
  error: unknown;
}

export const createSupabaseMock = (customMocks: Partial<SupabaseMocks> = {}) => {
  // Default mock responses
  const defaultMocks: SupabaseMocks = {
    fromData: {},
    singleData: null,
    error: null,
  };

  // Merge defaults with custom mocks
  const mocks = { ...defaultMocks, ...customMocks };

  // Helper to create query builder functions with proper chaining
  const createQueryBuilder = (returnValue: Record<string, unknown> = {}) => {
    const builder: Record<string, unknown> = {};

    // Basic query methods that should be chainable
    const methods = [
      'select',
      'insert',
      'update',
      'delete',
      'upsert',
      'eq',
      'neq',
      'gt',
      'gte',
      'lt',
      'lte',
      'like',
      'ilike',
      'is',
      'in',
      'contains',
      'containedBy',
      'rangeGt',
      'rangeGte',
      'rangeLt',
      'rangeLte',
      'rangeAdjacent',
      'overlaps',
      'textSearch',
      'match',
      'not',
      'filter',
      'or',
      'order',
      'limit',
      'range',
      'maybeSingle',
    ];

    // Create chain methods that return this for proper chaining
    methods.forEach(method => {
      builder[method] = vi.fn().mockReturnThis();
    });

    // Terminal methods that return promises with the mock data
    builder.then = vi.fn().mockImplementation(callback => Promise.resolve(callback(returnValue)));
    builder.single = vi.fn().mockResolvedValue(returnValue);

    return builder;
  };

  // Main Supabase client mock with appropriate mock chains for database operations
  const supabaseMock = {
    from: vi.fn().mockImplementation(table => {
      const tableData = mocks.fromData[table] || {};

      return createQueryBuilder({
        data: tableData,
        error: mocks.error,
      });
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn(),
        getPublicUrl: vi
          .fn()
          .mockReturnValue({ data: { publicUrl: 'https://example.com/image.jpg' } }),
        list: vi.fn(),
        remove: vi.fn(),
      }),
    },
  };

  return supabaseMock;
};

// Exported singleton instance for convenience
export const mockSupabaseClient = createSupabaseMock();
