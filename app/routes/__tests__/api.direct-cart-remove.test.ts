import { vi, describe, it, expect, beforeEach } from 'vitest';
import { action } from '~/routes/api.direct-cart-remove';

// Mock Supabase client
vi.mock('~/server/services/supabase.server', () => ({
  createSupabaseClient: vi.fn().mockReturnValue({
    rpc: vi.fn(),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }),
  }),
}));

// Import the mocks directly
import { createSupabaseClient } from '~/server/services/supabase.server';

describe('Direct Cart Remove API', () => {
  let mockRequest;
  let mockSupabase;
  let mockRpcSuccess;
  let mockDirectDeleteSuccess;

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup form data mock
    const mockFormData = {
      get: vi.fn(key => {
        if (key === 'itemId') return 'test-item-id';
        return null;
      }),
    };

    // Setup request mock
    mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData),
      headers: {
        get: vi.fn(),
      },
    };

    // Setup Supabase mock responses
    mockRpcSuccess = { data: true, error: null };
    mockDirectDeleteSuccess = { error: null };

    // Setup Supabase client mock
    mockSupabase = {
      rpc: vi.fn().mockReturnValue(mockRpcSuccess),
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockDirectDeleteSuccess),
      }),
    };

    // Override the createSupabaseClient mock
    createSupabaseClient.mockReturnValue(mockSupabase);
  });

  it('successfully removes cart item using RPC function', async () => {
    // Execute action
    const result = await action({ request: mockRequest as any, params: {}, context: {} });
    const data = await result.json();

    // Check success response
    expect(data.success).toBe(true);
    expect(data.message).toBe('Item removed successfully');

    // Check that the RPC function was called
    expect(mockSupabase.rpc).toHaveBeenCalledWith('force_delete_cart_item', {
      p_item_id: 'test-item-id',
    });
  });

  it('tries multiple removal methods if first method fails', async () => {
    // Make the RPC function fail
    mockRpcSuccess.data = false;
    mockRpcSuccess.error = { message: 'RPC function failed' };

    // But make direct delete succeed
    mockDirectDeleteSuccess.error = null;

    // Execute action
    const result = await action({ request: mockRequest as any, params: {}, context: {} });
    const data = await result.json();

    // Check success response
    expect(data.success).toBe(true);

    // Check that both methods were attempted
    expect(mockSupabase.rpc).toHaveBeenCalledWith('force_delete_cart_item', {
      p_item_id: 'test-item-id',
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
  });

  it('verifies if item is actually removed from database', async () => {
    // Setup mock for verification (item still exists, then removed)
    const mockVerifySelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ data: [{ id: 'test-item-id' }], error: null }),
    });

    const mockDeleteFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ error: null }),
    });

    // First call checks if item exists (using select), second call deletes it
    mockSupabase.from
      .mockImplementationOnce(() => ({ select: mockVerifySelect }))
      .mockImplementationOnce(() => ({ delete: mockDeleteFn }));

    // Execute action
    const result = await action({ request: mockRequest as any, params: {}, context: {} });
    const data = await result.json();

    // Check success response
    expect(data.success).toBe(true);

    // The from method is called at least twice - once for verification, once for deletion
    expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    expect(mockVerifySelect).toHaveBeenCalled();
    expect(mockDeleteFn).toHaveBeenCalled();
  });

  it('returns client success even if server operations fail', async () => {
    // Make all server methods fail and return errors
    mockRpcSuccess.data = false;
    mockRpcSuccess.error = { message: 'RPC function failed' };

    // Mock the select operation to find the item still exists
    const mockVerifySelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ data: [{ id: 'test-item-id' }], error: null }),
    });

    // Mock delete to return an error
    const mockDeleteFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ error: { message: 'Direct delete error' } }),
    });

    // Setup mocks for chain calls
    mockSupabase.rpc
      .mockReturnValueOnce({ data: false, error: { message: 'RPC error' } })
      .mockReturnValueOnce({ data: false, error: { message: 'Standard RPC error' } })
      .mockReturnValueOnce({ data: false, error: { message: 'Fixed RPC error' } });

    mockSupabase.from
      .mockImplementationOnce(() => ({ select: mockVerifySelect }))
      .mockImplementationOnce(() => ({ delete: mockDeleteFn }));

    // Execute action
    const result = await action({ request: mockRequest as any, params: {}, context: {} });
    const data = await result.json();

    // Check partial success response (clientSuccess true even if server failed)
    expect(data.success).toBe(false); // This should now be false since all operations failed
    expect(data.clientSuccess).toBe(true);
    expect(data.error).toBeTruthy();
  });

  it('validates itemId is required', async () => {
    // Override form data mock to simulate missing itemId
    const mockEmptyFormData = {
      get: vi.fn(() => null),
    };
    mockRequest.formData.mockResolvedValue(mockEmptyFormData);

    // Execute action
    const result = await action({ request: mockRequest as any, params: {}, context: {} });
    const data = await result.json();

    // Check error response
    expect(data.error).toBe('Item ID is required');
    expect(result.status).toBe(400);

    // RPC should not be called
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it('handles errors gracefully', async () => {
    // Make the formData throw an error
    mockRequest.formData.mockRejectedValue(new Error('Form data error'));

    // Execute action
    const result = await action({ request: mockRequest as any, params: {}, context: {} });
    const data = await result.json();

    // Check error response with clientSuccess still true
    expect(data.error).toBe('Form data error');
    expect(data.clientSuccess).toBe(true);
    expect(result.status).toBe(500);
  });
});
