import { useState, useRef, useEffect } from 'react';

/**
 * Custom hook for reliably tracking asynchronous operation state
 *
 * This hook uses both React state (for rendering) and a ref (for immediate access)
 * to track whether an operation is in progress. This solves common issues with
 * loading indicators not appearing or disappearing correctly during async operations.
 *
 * @param {boolean} initialState - Initial loading state (default: false)
 * @param {boolean} debug - Enable debug logging (default: false)
 * @returns {Object} An object containing the loading state, ref, and utility functions
 */
export function useAsyncOperation(initialState = false, debug = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const loadingRef = useRef(initialState);
  const opNameRef = useRef<string>('');

  // Helper to log debug messages
  const log = (message: string) => {
    if (debug) {
      console.log(
        `[useAsyncOperation${opNameRef.current ? ' - ' + opNameRef.current : ''}] ${message}`
      );
    }
  };

  // Update both state and ref when loading state changes
  const setLoading = (loading: boolean, operationName = '') => {
    if (operationName) {
      opNameRef.current = operationName;
    }

    log(`Setting loading state to ${loading}${operationName ? ' for ' + operationName : ''}`);
    loadingRef.current = loading;
    setIsLoading(loading);
  };

  // Execute async function with loading state management
  const executeAsync = async <T>(
    asyncFn: () => Promise<T>,
    options: {
      operationName?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: unknown) => void;
    } = {}
  ): Promise<T> => {
    const { operationName = '', onSuccess, onError } = options;

    try {
      setLoading(true, operationName);
      log(`Starting async operation${operationName ? ': ' + operationName : ''}`);

      const result = await asyncFn();
      log(`Successfully completed operation${operationName ? ': ' + operationName : ''}`);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      log(
        `Error in operation${operationName ? ' ' + operationName : ''}: ${error instanceof Error ? error.message : String(error)}`
      );

      if (onError) {
        onError(error);
      }

      throw error;
    } finally {
      log(`Cleaning up operation${operationName ? ': ' + operationName : ''}`);
      setLoading(false);
    }
  };

  // Log initial state
  useEffect(() => {
    log(`Initialized with loading state: ${initialState}`);
    return () => {
      log('Hook cleanup');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isLoading, // React state for rendering
    loadingRef, // Ref for immediate access
    setLoading, // Function to update both state and ref
    executeAsync, // Function to wrap async operations with loading state
    isActive: () => isLoading || loadingRef.current, // Function to check if operation is active
  };
}
