import { renderHook, act } from '@testing-library/react';
import { useRetry } from '../useRetry';
import { vi } from 'vitest';
import { AuthApiError } from '@supabase/supabase-js';

// Increase the test timeout for tests that involve timers
vi.setConfig({ testTimeout: 10000 });

describe('useRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('should execute successfully on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useRetry(operation));

    // Execute operation
    const promiseResult = await result.current.execute();

    expect(promiseResult).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(result.current.state.attempt).toBe(0);
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.isRetrying).toBe(false);
  });

  it('should not retry on auth errors', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const authError = new AuthApiError('Token expired', {
      status: 400,
      statusText: 'Bad Request',
      data: { message: 'JWT expired' },
    });
    const operation = vi.fn().mockRejectedValue(authError);

    const { result } = renderHook(() =>
      useRetry(operation, {
        maxAttempts: 3,
        initialDelay: 1000,
      })
    );

    // Start the operation
    let error;
    try {
      await result.current.execute();
    } catch (e) {
      error = e;
    }

    await vi.runAllTimersAsync();

    // Should only attempt once and stop on auth error
    expect(operation).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(AuthApiError);
    expect(error).toEqual(authError);
    expect(result.current.state.attempt).toBe(3); // Max attempts after auth error
    expect(result.current.state.isRetrying).toBe(false);
  });

  it('should retry on failure with exponential backoff', async () => {
    const error = new Error('Failed operation');
    const operation = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('success');

    const delays: number[] = [];
    vi.spyOn(window, 'setTimeout').mockImplementation((cb, delay) => {
      delays.push(delay as number);
      cb();
      return undefined as any;
    });

    const { result } = renderHook(() =>
      useRetry(operation, {
        maxAttempts: 3,
        initialDelay: 1000,
        backoffFactor: 2,
      })
    );

    // Start execution
    await act(async () => {
      await result.current.execute();
    });

    // Should have tried 3 times before succeeding
    expect(operation).toHaveBeenCalledTimes(3);
    expect(result.current.state.attempt).toBe(0); // Reset after success
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.isRetrying).toBe(false);

    // Verify exponential backoff
    expect(delays).toEqual([1000, 2000]); // 1s, 2s
  });

  it('should stop retrying after maxAttempts', async () => {
    const error = new Error('Failed operation');
    const operation = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() =>
      useRetry(operation, {
        maxAttempts: 2,
        initialDelay: 1000,
      })
    );

    // Start execution
    const promise = result.current.execute().catch(() => {});

    // Wait for first attempt and failure
    await act(async () => {
      await Promise.resolve();
    });

    expect(operation).toHaveBeenCalledTimes(1);
    expect(result.current.state.attempt).toBe(1);

    // Last retry
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    // Wait for promise to complete
    await act(async () => {
      await promise;
    });

    expect(operation).toHaveBeenCalledTimes(2);
    expect(result.current.state.attempt).toBe(2);
    expect(result.current.state.error).toBe(error);
    expect(result.current.state.isRetrying).toBe(false);
  });

  it('should cancel retries when requested', async () => {
    const error = new Error('Failed operation');
    const operation = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() =>
      useRetry(operation, {
        maxAttempts: 3,
        initialDelay: 1000,
      })
    );

    // Start execution and first failure
    result.current.execute().catch(() => {});
    await Promise.resolve();

    // Cancel retries
    result.current.cancelRetries();

    expect(operation).toHaveBeenCalledTimes(1);
    expect(result.current.state.isRetrying).toBe(false);
  });

  it('should reset state when requested', async () => {
    const error = new Error('Failed operation');
    const operation = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() =>
      useRetry(operation, {
        maxAttempts: 3,
        initialDelay: 1000,
      })
    );

    // Start execution
    result.current.execute().catch(() => {});

    // Wait for first attempt and failure
    await act(async () => {
      await Promise.resolve();
    });

    // Verify error state
    expect(result.current.state.attempt).toBe(1);
    expect(result.current.state.error).toBe(error);

    // Reset state
    await act(async () => {
      result.current.reset();
    });

    // Verify reset state
    expect(result.current.state.attempt).toBe(0);
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.isRetrying).toBe(false);
  });

  it('should respect maxDelay configuration', async () => {
    const error = new Error('Failed operation');
    const operation = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('success');

    const delays: number[] = [];

    // Mock setTimeout to capture delays
    vi.spyOn(window, 'setTimeout').mockImplementation((cb, delay) => {
      delays.push(delay as number);
      cb();
      return undefined as any;
    });

    const { result } = renderHook(() =>
      useRetry(operation, {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 1500,
        backoffFactor: 2,
      })
    );

    // Start execution
    await act(async () => {
      await result.current.execute();
    });

    expect(delays).toEqual([1000, 1500]); // Second delay should be capped at maxDelay
  });
});
