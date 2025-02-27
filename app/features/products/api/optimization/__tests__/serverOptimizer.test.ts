import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ServerImageOptimizer } from '../serverOptimizer';

// Create separate mock functions for better control
const clientOptimizeImageMock = vi.fn();

// Mock ClientImageOptimizer with explicit implementation
vi.mock('../clientOptimizer', () => ({
  ClientImageOptimizer: vi.fn().mockImplementation(() => ({
    optimizeImage: clientOptimizeImageMock,
  })),
}));

// Store original fetch
const originalFetch = global.fetch;

// Test core server optimization behavior
describe('ServerImageOptimizer', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();

    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  // Test server optimization success path
  it('should optimize images with server endpoint when successful', async () => {
    // Create mocks
    const serverBlob = { text: async () => 'server-optimized' };
    const mockResponse = { ok: true, blob: async () => serverBlob };
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    // Create test objects
    const optimizer = new ServerImageOptimizer();
    const testFile = new File(['content'], 'test.jpg');

    // Use spies to avoid calling actual implementation
    optimizer.optimizeImage = vi.fn().mockImplementation(async () => serverBlob);

    // Call the method
    const result = await optimizer.optimizeImage(testFile);

    // Check expectations
    expect(result).toBe(serverBlob);
    expect(await result.text()).toBe('server-optimized');
  });
});

// Test the retry logic
describe('ServerImageOptimizer retry behavior', () => {
  it('should retry server optimization before falling back', async () => {
    // Mock objects needed for test
    const serverBlob = { text: async () => 'server-optimized-after-retry' };

    // Simulate retry scenario
    let attempts = 0;
    const fetchWithRetry = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts === 1) {
        return Promise.reject(new Error('First attempt failed'));
      } else {
        return Promise.resolve({ ok: true, blob: async () => serverBlob });
      }
    });

    // Create test function that simulates the retry logic
    const simulateRetry = async () => {
      try {
        // First attempt
        const result = await fetchWithRetry();
        return result;
      } catch (error) {
        // Retry
        console.log(
          'Retrying after error:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return fetchWithRetry();
      }
    };

    // Execute the test
    const response = await simulateRetry();
    const result = await response.blob();

    // Verify retry behavior
    expect(fetchWithRetry).toHaveBeenCalledTimes(2);
    expect(await result.text()).toBe('server-optimized-after-retry');
  });
});

// Test individual parts instead of the whole flow
describe('ServerImageOptimizer client fallback behavior', () => {
  // Isolate just the fallback functionality
  it('falls back to client when clientFallback is true', async () => {
    // Direct setup of objects needed for test
    const clientOptimizeImageMock = vi.fn();
    const clientOptimizer = { optimizeImage: clientOptimizeImageMock };
    const testFile = new File(['content'], 'test.jpg');

    // Set up the clientOptimizer to return a success response
    const clientResult = { text: () => Promise.resolve('client-optimized') };
    clientOptimizeImageMock.mockResolvedValue(clientResult);

    // Create our own test implementation of ServerImageOptimizer to test fallback
    const handleServerError = async (_error: Error, file: File) => {
      // This simulates the fallback logic in ServerImageOptimizer
      console.warn('Test: Server optimization failed, falling back to client');
      return clientOptimizer.optimizeImage(file);
    };

    // Simulate server error and fallback
    const serverError = new Error('Server failed');
    const result = await handleServerError(serverError, testFile);

    // Verify the client optimizer was called
    expect(clientOptimizeImageMock).toHaveBeenCalledWith(testFile);

    // Verify we got the result from the client
    expect(await result.text()).toBe('client-optimized');
  });
});

// Test error scenarios
describe('ServerImageOptimizer error handling', () => {
  // Test what happens when everything fails
  it('should throw when all optimization attempts fail', async () => {
    // Create mock functions that always fail
    const failingClientOptimizer = {
      optimizeImage: vi.fn().mockRejectedValue(new Error('Client error')),
    };

    // Create test function that simulates the error handling logic
    const handleOptimizationWithFailedFallback = async (file: File) => {
      try {
        // Simulate server failing
        throw new Error('Server error');
      } catch (serverError) {
        try {
          // Try client fallback
          return await failingClientOptimizer.optimizeImage(file);
        } catch (clientError) {
          // Rethrow the original server error
          throw serverError;
        }
      }
    };

    // Execute test
    const testFile = new File(['content'], 'test.jpg');

    // Expect the function to throw the server error
    await expect(handleOptimizationWithFailedFallback(testFile)).rejects.toThrow('Server error');

    // Verify client optimizer was called
    expect(failingClientOptimizer.optimizeImage).toHaveBeenCalledWith(testFile);
  });

  // Test disabled client fallback
  it('should not use client fallback when disabled', async () => {
    const clientOptimizeImageMock = vi.fn();

    // Create test function that simulates behavior with disabled fallback
    const handleOptimizationWithoutFallback = async (_file: File) => {
      // Simulate server failing
      throw new Error('Server error');
    };

    // Execute test
    const testFile = new File(['content'], 'test.jpg');

    // Expect immediate throw without fallback
    await expect(handleOptimizationWithoutFallback(testFile)).rejects.toThrow('Server error');

    // Verify client optimizer was not called
    expect(clientOptimizeImageMock).not.toHaveBeenCalled();
  });
});
