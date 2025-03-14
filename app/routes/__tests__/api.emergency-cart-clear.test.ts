import { vi, describe, it, expect, beforeEach } from 'vitest';
import { action } from '../api.emergency-cart-clear';

// Mock modules
vi.mock('~/server/services/supabase.server');
vi.mock('~/features/cart/utils/serverCookie');

// Import the mocks
import { createSupabaseClient } from '../../server/services/supabase.server';
import { getAnonymousCartId } from '../../features/cart/utils/serverCookie';

describe('Emergency Cart Clear API', () => {
  let mockRequest;
  let mockSupabase;

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup mock request with empty formData
    mockRequest = {
      formData: vi.fn().mockResolvedValue(new Map()),
      headers: { get: vi.fn() },
    };

    // Setup getAnonymousCartId mock
    vi.mocked(getAnonymousCartId).mockResolvedValue('test-anonymous-id');

    // Setup mock for chain methods
    mockSupabase = {
      from: vi.fn(),
    };

    // Setup createSupabaseClient mock
    vi.mocked(createSupabaseClient).mockReturnValue(mockSupabase);
  });

  it('successfully clears all cart items', async () => {
    // Setup the mock chain for cart selection
    const mockSelectFn = vi.fn();
    const mockEq1 = vi.fn();
    const mockEq2 = vi.fn();

    mockEq2.mockReturnValue({
      data: [{ id: 'test-cart-id' }],
      error: null,
    });

    mockEq1.mockReturnValue({ eq: mockEq2 });
    mockSelectFn.mockReturnValue({ eq: mockEq1 });

    // Setup the mock chain for cart item deletion
    const mockDeleteFn = vi.fn();
    const mockDeleteEq = vi.fn();

    mockDeleteEq.mockReturnValue({
      error: null,
    });

    mockDeleteFn.mockReturnValue({ eq: mockDeleteEq });

    // Setup the mock chain for cart status update
    const mockUpdateFn = vi.fn();
    const mockInFn = vi.fn();

    mockInFn.mockReturnValue({
      error: null,
    });

    mockUpdateFn.mockReturnValue({ in: mockInFn });

    // Setup the from method to return appropriate chains
    mockSupabase.from.mockImplementation(table => {
      if (table === 'carts') {
        return {
          select: mockSelectFn,
          update: mockUpdateFn,
        };
      } else if (table === 'cart_items') {
        return { delete: mockDeleteFn };
      }
      return {};
    });

    // Execute the action
    const result = await action({ request: mockRequest, params: {}, context: {} });
    const data = await result.json();

    // Verify the response
    if ('error' in data) {
      throw new Error(`Expected success response but got error: ${data.error}`);
    }
    expect(data.success).toBe(true);
    expect(data.message).toBe('Cart cleared successfully');

    // Verify the function calls
    expect(getAnonymousCartId).toHaveBeenCalledWith(mockRequest);
    expect(mockSupabase.from).toHaveBeenCalledWith('carts');
    expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
    expect(mockSelectFn).toHaveBeenCalledWith('id');
    expect(mockEq1).toHaveBeenCalledWith('anonymous_id', 'test-anonymous-id');
    expect(mockEq2).toHaveBeenCalledWith('status', 'active');
    expect(mockDeleteFn).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith('cart_id', 'test-cart-id');
  });

  it('clears a specific item when itemId is provided', async () => {
    // Setup mock request with specific itemId
    const mockFormData = new Map();
    mockFormData.set('itemId', 'specific-item-id');
    mockRequest.formData = vi.fn().mockResolvedValue(mockFormData);

    // Setup the mock chain for cart selection
    const mockSelectFn = vi.fn();
    const mockEq1 = vi.fn();
    const mockEq2 = vi.fn();

    mockEq2.mockReturnValue({
      data: [{ id: 'test-cart-id' }],
      error: null,
    });

    mockEq1.mockReturnValue({ eq: mockEq2 });
    mockSelectFn.mockReturnValue({ eq: mockEq1 });

    // Setup cart items select for specific item check
    const mockItemsSelectFn = vi.fn();
    const mockItemsEq1 = vi.fn();
    const mockItemsEq2 = vi.fn();

    mockItemsEq2.mockReturnValue({
      data: [{ id: 'specific-item-id' }],
      error: null,
    });

    mockItemsEq1.mockReturnValue({ eq: mockItemsEq2 });
    mockItemsSelectFn.mockReturnValue({ eq: mockItemsEq1 });

    // Setup the mock chain for item deletion
    const mockDeleteFn = vi.fn();
    const mockDeleteEq = vi.fn();

    mockDeleteEq.mockReturnValue({
      error: null,
    });

    mockDeleteFn.mockReturnValue({ eq: mockDeleteEq });

    // Setup the from method to return appropriate chains
    mockSupabase.from.mockImplementation(table => {
      if (table === 'carts') {
        return { select: mockSelectFn };
      } else if (table === 'cart_items') {
        return {
          select: mockItemsSelectFn,
          delete: mockDeleteFn,
        };
      }
      return {};
    });

    // Execute the action
    const result = await action({ request: mockRequest, params: {}, context: {} });
    const data = await result.json();

    // Verify the response
    if ('error' in data) {
      throw new Error(`Expected success response but got error: ${data.error}`);
    }
    expect(data.success).toBe(true);
    expect(data.message).toContain('specific-item-id');

    // Verify the function calls
    expect(getAnonymousCartId).toHaveBeenCalledWith(mockRequest);
    expect(mockSupabase.from).toHaveBeenCalledWith('carts');
    expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
    expect(mockItemsSelectFn).toHaveBeenCalled();
    expect(mockDeleteFn).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'specific-item-id');
  });

  it('handles case when no active cart is found', async () => {
    // Setup the mock chain for cart selection (empty result)
    const mockSelectFn = vi.fn();
    const mockEq1 = vi.fn();
    const mockEq2 = vi.fn();

    mockEq2.mockReturnValue({
      data: [], // No carts found
      error: null,
    });

    mockEq1.mockReturnValue({ eq: mockEq2 });
    mockSelectFn.mockReturnValue({ eq: mockEq1 });

    // Setup the from method
    mockSupabase.from.mockImplementation(table => {
      if (table === 'carts') {
        return { select: mockSelectFn };
      }
      return {};
    });

    // Execute the action
    const result = await action({ request: mockRequest, params: {}, context: {} });
    const data = await result.json();

    // Verify the response
    if ('error' in data) {
      throw new Error(`Expected success response but got error: ${data.error}`);
    }
    expect(data.success).toBe(true);
    expect(data.message).toBe('No active carts found');

    // Verify cart items deletion was not attempted
    expect(mockSupabase.from).toHaveBeenCalledWith('carts');
    expect(mockSupabase.from).not.toHaveBeenCalledWith('cart_items');
  });

  it('handles errors when getting cart ID', async () => {
    // Setup the mock chain for cart selection (with error)
    const mockSelectFn = vi.fn();
    const mockEq1 = vi.fn();
    const mockEq2 = vi.fn();

    mockEq2.mockReturnValue({
      data: null,
      error: { message: 'Database error' },
    });

    mockEq1.mockReturnValue({ eq: mockEq2 });
    mockSelectFn.mockReturnValue({ eq: mockEq1 });

    // Setup the from method
    mockSupabase.from.mockImplementation(table => {
      if (table === 'carts') {
        return { select: mockSelectFn };
      }
      return {};
    });

    // Execute the action
    const result = await action({ request: mockRequest, params: {}, context: {} });
    const data = await result.json();

    // Verify the response
    if (!('success' in data)) {
      expect(data.error).toBe('Database error');
    }
    expect(result.status).toBe(500);

    // Verify that only the cart table was queried
    expect(mockSupabase.from).toHaveBeenCalledWith('carts');
    expect(mockSupabase.from).not.toHaveBeenCalledWith('cart_items');
  });

  it('handles errors when deleting cart items', async () => {
    // Setup the mock chain for cart selection (success)
    const mockSelectFn = vi.fn();
    const mockEq1 = vi.fn();
    const mockEq2 = vi.fn();

    mockEq2.mockReturnValue({
      data: [{ id: 'test-cart-id' }],
      error: null,
    });

    mockEq1.mockReturnValue({ eq: mockEq2 });
    mockSelectFn.mockReturnValue({ eq: mockEq1 });

    // Setup the mock chain for cart item deletion (with error)
    const mockDeleteFn = vi.fn();
    const mockDeleteEq = vi.fn();

    mockDeleteEq.mockReturnValue({
      data: null,
      error: { message: 'Delete operation failed' },
    });

    mockDeleteFn.mockReturnValue({ eq: mockDeleteEq });

    // Setup the mock chain for cart status update
    const mockUpdateFn = vi.fn();
    const mockInFn = vi.fn();

    mockInFn.mockReturnValue({
      data: null,
      error: null,
    });

    mockUpdateFn.mockReturnValue({ in: mockInFn });

    // Setup the from method to return appropriate chains
    mockSupabase.from.mockImplementation(table => {
      if (table === 'carts') {
        return {
          select: mockSelectFn,
          update: mockUpdateFn,
        };
      } else if (table === 'cart_items') {
        return { delete: mockDeleteFn };
      }
      return {};
    });

    // Execute the action
    const result = await action({ request: mockRequest, params: {}, context: {} });
    const data = await result.json();

    // Verify the response matches what the API returns
    if (!('error' in data)) {
      throw new Error('Expected error response but got success response');
    }
    expect(data.error).toBe('Delete operation failed');
    expect(result.status).toBe(500);

    // Verify both tables were accessed
    expect(mockSupabase.from).toHaveBeenCalledWith('carts');
    expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
  });

  it('handles unexpected errors gracefully', async () => {
    // Make getAnonymousCartId throw an error
    vi.mocked(getAnonymousCartId).mockRejectedValue(new Error('Cookie error'));

    // Execute the action
    const result = await action({ request: mockRequest, params: {}, context: {} });
    const data = await result.json();

    // Verify the response
    if (!('error' in data)) {
      throw new Error('Expected error response but got success response');
    }
    expect(data.error).toBe('Cookie error');
    expect(result.status).toBe(500);
  });
});
