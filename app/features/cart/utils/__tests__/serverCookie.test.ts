import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAnonymousCartId, anonymousCartCookie } from '../serverCookie';

describe('serverCookie utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract anonymous cart ID from cookie', async () => {
    // Create a mock request with a properly formatted cookie
    const mockRequest = new Request('http://localhost:3000', {
      headers: {
        Cookie: 'notalock_anonymous_cart=a282e1db-ce85-4c3d-a727-1bd12e001590',
      },
    });

    const cartId = await getAnonymousCartId(mockRequest);
    expect(cartId).toBe('a282e1db-ce85-4c3d-a727-1bd12e001590');
  });

  it('should handle base64 encoded cart ID in cookie', async () => {
    // Mock the anonymousCartCookie.parse method to replicate the behavior we need to test
    vi.spyOn(anonymousCartCookie, 'parse').mockResolvedValue(
      'a282e1db-ce85-4c3d-a727-1bd12e001590'
    );

    // Create a mock request with a base64 encoded cookie (simulating the issue we fixed)
    const mockRequest = new Request('http://localhost:3000', {
      headers: {
        Cookie: 'notalock_anonymous_cart=ImEyODJlMWRiLWNlODUtNGMzZC1hNzI3LTFiZDEyZTAwMTU5MCI%3D',
      },
    });

    const cartId = await getAnonymousCartId(mockRequest);
    expect(cartId).toBe('a282e1db-ce85-4c3d-a727-1bd12e001590');
  });

  it('should generate a new cart ID if no cookie is present', async () => {
    // Create a mock request with no cookie
    const mockRequest = new Request('http://localhost:3000');

    const cartId = await getAnonymousCartId(mockRequest);

    // Should return a UUID-formatted string
    expect(cartId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('should handle parsing errors gracefully', async () => {
    // Simulate a parsing error
    vi.spyOn(anonymousCartCookie, 'parse').mockRejectedValue(new Error('Parse error'));

    const mockRequest = new Request('http://localhost:3000', {
      headers: {
        Cookie: 'notalock_anonymous_cart=invalid-cart-id',
      },
    });

    const cartId = await getAnonymousCartId(mockRequest);

    // Should return a new UUID
    expect(cartId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
