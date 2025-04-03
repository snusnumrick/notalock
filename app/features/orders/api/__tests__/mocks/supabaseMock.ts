import { vi } from 'vitest';
import { type SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a properly chained Supabase mock client for testing
 * Supports all common query chains with proper return structures
 */
export function createMockSupabaseClient(): SupabaseClient {
  // Default mock data
  const mockOrder = {
    id: 'order-123',
    order_number: 'NO-20250315-ABCD',
    status: 'pending',
    payment_status: 'pending',
    created_at: '2025-03-15T12:00:00Z',
    updated_at: '2025-03-15T12:00:00Z',
  };

  const mockOrderItems: any[] = [];

  // Create a generic query builder that ensures proper method chaining
  const createQueryBuilder = () => {
    return {
      // Query methods
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),

      // Filter methods
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      and: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),

      // Pagination and ordering
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),

      // Final executors
      single: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
      then: vi.fn().mockResolvedValue({ data: mockOrderItems, error: null }),
    };
  };

  // Create base mock client
  const mockSupabaseClient = {
    from: vi.fn().mockReturnValue(createQueryBuilder()),
    rpc: vi.fn().mockResolvedValue({ data: {}, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
    },
  } as unknown as SupabaseClient;

  return mockSupabaseClient;
}
