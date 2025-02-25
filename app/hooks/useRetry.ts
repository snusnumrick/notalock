import { useState, useCallback, useEffect, useRef } from 'react';
import { AuthApiError } from '@supabase/supabase-js';

interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

interface RetryState {
  attempt: number;
  error: Error | null;
  isRetrying: boolean;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
};

export function useRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): {
  execute: () => Promise<T>;
  reset: () => void;
  state: RetryState;
  cancelRetries: () => void;
  sleep?: (ms: number) => Promise<void>; // Expose sleep for testing
} {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<RetryState>({
    attempt: 0,
    error: null,
    isRetrying: false,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);
  const cancelledRef = useRef(false);
  const retryAttemptRef = useRef<Promise<T> | null>(null);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Clean up any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Mark as cancelled
      cancelledRef.current = true;
    };
  }, []);

  const calculateDelay = useCallback(
    (attempt: number) => {
      // Note: attempt is 1-based, so we need to use attempt-1 for calculation
      const delay = fullConfig.initialDelay * Math.pow(fullConfig.backoffFactor, attempt - 1);
      return Math.min(delay, fullConfig.maxDelay);
    },
    [fullConfig.initialDelay, fullConfig.backoffFactor, fullConfig.maxDelay]
  );

  const sleep = useCallback((ms: number) => {
    return new Promise<void>(resolve => {
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = undefined;
        resolve();
      }, ms);
    });
  }, []);

  const retryOperation = useCallback(
    async (attempt: number = 0): Promise<T> => {
      if (!mountedRef.current) {
        throw new Error('Component unmounted');
      }

      if (cancelledRef.current) {
        throw new Error('Operation cancelled');
      }

      try {
        const result = await operation();
        if (mountedRef.current) {
          setState({ attempt: 0, error: null, isRetrying: false });
        }
        return result;
      } catch (error) {
        // Check if we should stop retrying
        if (!mountedRef.current || cancelledRef.current) {
          throw new Error('Operation cancelled');
        }

        // Don't retry auth errors
        if (error instanceof AuthApiError) {
          setState({
            attempt: fullConfig.maxAttempts,
            error: error as Error,
            isRetrying: false,
          });
          throw error;
        }

        // Check if we've reached max attempts
        if (attempt >= fullConfig.maxAttempts - 1) {
          setState({
            attempt: fullConfig.maxAttempts,
            error: error as Error,
            isRetrying: false,
          });
          throw error;
        }

        // Update state for next attempt
        const nextAttempt = attempt + 1;
        if (mountedRef.current) {
          setState({
            attempt: nextAttempt,
            error: error as Error,
            isRetrying: true,
          });
        }

        // Wait before retrying
        if (!cancelledRef.current && mountedRef.current) {
          await sleep(calculateDelay(nextAttempt));
        }

        // Check again before retrying
        if (!cancelledRef.current && mountedRef.current) {
          return retryOperation(nextAttempt);
        }

        throw new Error('Operation cancelled');
      }
    },
    [operation, fullConfig.maxAttempts, calculateDelay, sleep]
  );

  const execute = useCallback(async (): Promise<T> => {
    // Use existing attempt if there is one
    if (retryAttemptRef.current) {
      return retryAttemptRef.current;
    }

    // Reset state for new attempt
    cancelledRef.current = false;
    if (mountedRef.current) {
      setState({ attempt: 0, error: null, isRetrying: false });
    }

    // Start new attempt
    try {
      retryAttemptRef.current = retryOperation();
      const result = await retryAttemptRef.current;
      retryAttemptRef.current = null;
      return result;
    } catch (error) {
      retryAttemptRef.current = null;
      throw error;
    }
  }, [retryOperation]);

  const cancelRetries = useCallback(() => {
    cancelledRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    retryAttemptRef.current = null;
    if (mountedRef.current) {
      setState(prev => ({ ...prev, isRetrying: false }));
    }
  }, []);

  const reset = useCallback(() => {
    cancelRetries();
    if (mountedRef.current) {
      setState({ attempt: 0, error: null, isRetrying: false });
    }
  }, [cancelRetries]);

  return {
    execute,
    reset,
    state,
    cancelRetries,
  };
}
