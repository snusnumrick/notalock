import { describe, it, expect, vi, beforeEach } from 'vitest';
// Define an import alias to make mocking easier
import * as cartHelperModule from '../cartHelper';
import {
  getAnonymousCartIdFromCookie,
  ensureConsistentCartId,
  setAnonymousCartCookie,
} from '../cartHelper';
import { ANONYMOUS_CART_COOKIE_NAME } from '../../constants';

// We are not mocking the imported functions anymore to test actual implementations
// vi.mock('../cartHelper', async (importOriginal) => {
//   const mod = await importOriginal();
//   return {
//     ...mod,
//     getAnonymousCartIdFromCookie: vi.fn().mockImplementation(mod.getAnonymousCartIdFromCookie),
//     setAnonymousCartCookie: vi.fn().mockImplementation(mod.setAnonymousCartCookie),
//     ensureConsistentCartId: vi.fn().mockImplementation(mod.ensureConsistentCartId),
//   };
// });

describe('cartHelper utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset crypto.randomUUID mock to ensure tests don't affect each other
    vi.spyOn(crypto, 'randomUUID').mockReset();
  });

  describe('getAnonymousCartIdFromCookie', () => {
    it('should handle normal UUID format', () => {
      // We no longer need to reset the mock since we're using the actual implementation
      // vi.mocked(getAnonymousCartIdFromCookie).mockRestore();

      const cookieHeader = `${ANONYMOUS_CART_COOKIE_NAME}=a282e1db-ce85-4c3d-a727-1bd12e001590; other=value`;
      const result = getAnonymousCartIdFromCookie(cookieHeader);
      expect(result).toBe('a282e1db-ce85-4c3d-a727-1bd12e001590');
    });

    it('should handle URL-encoded values', () => {
      // No need to reset mock
      const cookieHeader = `${ANONYMOUS_CART_COOKIE_NAME}=a282e1db-ce85-4c3d-a727-1bd12e001590%3D; other=value`;
      const result = getAnonymousCartIdFromCookie(cookieHeader);
      expect(result).toBe('a282e1db-ce85-4c3d-a727-1bd12e001590=');
    });

    it('should handle base64-encoded JSON strings (the problematic case)', () => {
      // No need to reset mock
      // This is the specific format that caused the bug
      const cookieHeader = `${ANONYMOUS_CART_COOKIE_NAME}=ImEyODJlMWRiLWNlODUtNGMzZC1hNzI3LTFiZDEyZTAwMTU5MCI%3D; other=value`;
      const result = getAnonymousCartIdFromCookie(cookieHeader);
      expect(result).toBe('a282e1db-ce85-4c3d-a727-1bd12e001590');
    });

    it('should handle direct JSON strings', () => {
      // No need to reset mock
      const cookieHeader = `${ANONYMOUS_CART_COOKIE_NAME}="a282e1db-ce85-4c3d-a727-1bd12e001590"; other=value`;
      const result = getAnonymousCartIdFromCookie(cookieHeader);
      expect(result).toBe('a282e1db-ce85-4c3d-a727-1bd12e001590');
    });

    it('should handle null or empty cookie header', () => {
      // No need to reset mock
      expect(getAnonymousCartIdFromCookie(null)).toBe('');
      expect(getAnonymousCartIdFromCookie('')).toBe('');
    });

    it('should handle parsing errors gracefully', () => {
      // No need to reset mock

      // Mock a case where JSON.parse throws
      const originalJSONParse = JSON.parse;
      JSON.parse = vi.fn().mockImplementation(() => {
        throw new Error('Invalid JSON');
      });

      const cookieHeader = `${ANONYMOUS_CART_COOKIE_NAME}="invalid-json"; other=value`;
      const result = getAnonymousCartIdFromCookie(cookieHeader);

      // Should return the raw value when parsing fails
      expect(result).toBe('"invalid-json"');

      // Restore original implementation
      JSON.parse = originalJSONParse;
    });
  });

  describe('setAnonymousCartCookie', () => {
    it('should add a cookie header to the response', () => {
      // No need to reset mock
      const response = new Response();
      const cartId = 'a282e1db-ce85-4c3d-a727-1bd12e001590';

      setAnonymousCartCookie(response, cartId);

      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain(ANONYMOUS_CART_COOKIE_NAME);
      expect(setCookieHeader).toContain(cartId);
    });

    it('should validate UUID format', () => {
      // No need to reset mock
      const response = new Response();
      const invalidCartId = 'not-a-valid-uuid';

      // Mock console.warn to test that a warning is logged
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      setAnonymousCartCookie(response, invalidCartId);

      // Should warn about invalid UUID format
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Attempting to set non-UUID value as cart cookie')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle object values', () => {
      // No need to reset mock
      const response = new Response();
      const cartIdObject = { id: 'a282e1db-ce85-4c3d-a727-1bd12e001590' };

      // Mock console.warn to test that a warning is logged
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // @ts-expect-error - deliberately passing incorrect type for testing
      setAnonymousCartCookie(response, cartIdObject);

      // Should warn about object value
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Attempted to set object as cookie value')
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('ensureConsistentCartId', () => {
    it('should use the cart ID from cookie if valid', async () => {
      // No need to reset mocks

      const request = new Request('http://localhost:3000', {
        headers: {
          Cookie: `${ANONYMOUS_CART_COOKIE_NAME}=a282e1db-ce85-4c3d-a727-1bd12e001590`,
        },
      });
      const response = new Response();
      const mockSupabase = {};

      // Spy on console.log to verify logging
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await ensureConsistentCartId(request, response, mockSupabase as any);

      expect(result).toBe('a282e1db-ce85-4c3d-a727-1bd12e001590');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Valid cart ID detected'));

      consoleLogSpy.mockRestore();
    });

    it('should generate a new ID if cookie contains invalid format', async () => {
      // Skip unused request variable since we create requestWithInvalidUUID
      const response = new Response();
      const mockSupabase = {};

      // Mock crypto.randomUUID
      const mockUUID = 'new-random-uuid-12345';
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);

      // Spy on console.log to verify logging
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Instead of spying on getAnonymousCartIdFromCookie, let's create a Request
      // with an invalid UUID format in the cookie
      const requestWithInvalidUUID = new Request('http://localhost:3000', {
        headers: {
          Cookie: `${ANONYMOUS_CART_COOKIE_NAME}=not-a-valid-uuid-format`,
        },
      });

      const result = await ensureConsistentCartId(
        requestWithInvalidUUID,
        response,
        mockSupabase as any
      );

      expect(result).toBe(mockUUID);
      // Check if any of the log calls contain the expected message
      expect(
        consoleLogSpy.mock.calls.some(
          call =>
            call[0] &&
            typeof call[0] === 'string' &&
            call[0].includes('Invalid cart ID format detected')
        )
      ).toBe(true);

      // Clean up
      consoleLogSpy.mockRestore();
    });

    it('should generate a new ID if cookie contains non-string value', async () => {
      // We'll use a different approach than spying on getAnonymousCartIdFromCookie
      // We'll provide a proper test setup with a mock response and mock UUID

      const request = new Request('http://localhost:3000');
      const response = new Response();
      const mockSupabase = {};

      // Mock crypto.randomUUID
      const mockUUID = 'new-random-uuid-for-non-string';
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);

      // Spy on console.log to verify logging
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Spy on getAnonymousCartIdFromCookie to return a non-string value
      // but still let it process the request normally
      const getCartIdSpy = vi
        .spyOn(cartHelperModule, 'getAnonymousCartIdFromCookie')
        .mockImplementation(() => {
          return {} as any;
        });

      const result = await ensureConsistentCartId(request, response, mockSupabase as any);

      expect(result).toBe(mockUUID);

      // Check if any console.log call contains the expected message
      expect(
        consoleLogSpy.mock.calls.some(
          call =>
            call[0] &&
            typeof call[0] === 'string' &&
            call[0].includes('Invalid cart ID type detected')
        )
      ).toBe(true);

      // Clean up
      consoleLogSpy.mockRestore();
      getCartIdSpy.mockRestore();
    });
  });
});
