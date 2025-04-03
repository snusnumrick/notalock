import { useEffect, useRef } from 'react';
import { useEnhancedToast } from '~/hooks/useEnhancedToast';
import { Button } from '~/components/ui/button';
import type { OrderStatus } from '../types';

// Constants
const TOAST_DURATION_DEFAULT = 60000; // 60 seconds
const TOAST_DURATION_SUCCESS = 5000; // 5 seconds
const TOAST_DURATION_ERROR = 8000; // 8 seconds
const TOAST_DURATION_INFO = 3000; // 3 seconds

// Generate unique category IDs to avoid conflicts
const generateCategoryId = (base: string, orderId: string) => {
  return `${base}-${orderId.substring(0, 8)}-${Date.now()}`;
};

interface OrderToastManagerProps {
  categoryPrefix?: string;
  debug?: boolean;
  onDebugMessage?: (message: string) => void;
}

/**
 * Toast manager for Order-related components
 * Centralizes toast creation and management for order operations
 */
export function useOrderToastManager({
  categoryPrefix = 'order',
  debug = false,
  onDebugMessage,
}: OrderToastManagerProps = {}) {
  const { toast, dismissToastsByCategory, trackToast } = useEnhancedToast();

  // Use specific categories for different types of operations
  const toastCategories = useRef({
    statusChange: `${categoryPrefix}-status-change`,
    undoAction: `${categoryPrefix}-undo-action`,
    paymentStatus: `${categoryPrefix}-payment-status`,
    error: `${categoryPrefix}-error`,
  });

  // Track active dismiss functions
  const activeToastDismissers = useRef<{ [key: string]: (() => void)[] }>({});

  // Helper to register a dismiss function and clean up old ones
  const registerDismisser = (category: string, dismissFn: () => void) => {
    if (!activeToastDismissers.current[category]) {
      activeToastDismissers.current[category] = [];
    }

    // Add the new dismisser
    activeToastDismissers.current[category].push(dismissFn);

    // Return a function to clean up this specific dismisser
    return () => {
      if (activeToastDismissers.current[category]) {
        const index = activeToastDismissers.current[category].indexOf(dismissFn);
        if (index >= 0) {
          activeToastDismissers.current[category].splice(index, 1);
        }
      }
    };
  };

  // Helper for logging debug messages
  const logDebug = (message: string) => {
    if (debug) {
      console.log(`[OrderToastManager] ${message}`);
      if (onDebugMessage) {
        onDebugMessage(message);
      }
    }
  };

  // Cleanup function to dismiss all toasts for a category
  const cleanupCategory = (category: string) => {
    logDebug(`Cleaning up category: ${category}`);

    // First use the toast API's category dismissal
    dismissToastsByCategory(category);

    // Then use our tracked dismiss functions for extra reliability
    if (activeToastDismissers.current[category]) {
      // Create a copy to avoid issues during iteration
      const dismissers = [...activeToastDismissers.current[category]];

      dismissers.forEach(dismissFn => {
        try {
          dismissFn();
        } catch (err) {
          console.warn(`Failed to execute toast dismisser for ${category}:`, err);
        }
      });

      // Clear all dismissers for this category
      activeToastDismissers.current[category] = [];
    }
  };

  /**
   * Show a toast notification for status change
   */
  const showStatusChangeToast = (
    status: OrderStatus,
    previousStatus: OrderStatus,
    onUndo?: () => Promise<void>
  ) => {
    // Check if this is part of an undo operation
    // If so, we don't want to show a status change toast, as we'll show
    // the "Status Reverted" toast instead
    if (window.__isUndoOperation) {
      logDebug(`Skipping status change toast during undo operation`);
      return { id: 'skipped-during-undo', dismiss: () => {}, update: () => {} };
    }
    logDebug(`Showing status change toast: ${previousStatus} → ${status}`);

    // First dismiss any existing status change toasts
    cleanupCategory(toastCategories.current.statusChange);

    const toastObj = toast({
      title: 'Order Status Updated',
      description: `Status changed to ${status}`,
      variant: 'default',
      duration: TOAST_DURATION_DEFAULT,
      action: onUndo ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logDebug(`Undo clicked for status change: ${status} → ${previousStatus}`);

            // Dismiss the current toast
            cleanupCategory(toastCategories.current.statusChange);

            // Show an "undoing" toast
            const undoingCategory = generateCategoryId(`${categoryPrefix}-undo`, status);
            const undoingToast = toast({
              title: 'Undoing...',
              description: `Reverting to ${previousStatus}`,
              duration: TOAST_DURATION_INFO,
            });

            // Track the "undoing" toast with its unique category
            const undoDismiss = trackToast(undoingCategory, undoingToast);
            const undoCleanup = registerDismisser(undoingCategory, undoDismiss);

            // Execute the undo function and cleanup when done
            if (onUndo) {
              onUndo().finally(() => {
                // Clean up the undoing toast
                undoDismiss();
                undoCleanup();
              });
            }
          }}
        >
          Undo
        </Button>
      ) : undefined,
    });

    // Track the toast by category for later cleanup
    const dismissFn = trackToast(toastCategories.current.statusChange, toastObj);
    registerDismisser(toastCategories.current.statusChange, dismissFn);

    return toastObj;
  };

  /**
   * Show a toast notification for undo success
   */
  const showUndoSuccessToast = (status: OrderStatus) => {
    logDebug(`Showing undo success toast for status: ${status}`);

    // First dismiss any existing undo action toasts
    cleanupCategory(toastCategories.current.undoAction);

    const toastObj = toast({
      title: 'Status Reverted',
      description: `Order status reverted to ${status}`,
      variant: 'default',
      duration: TOAST_DURATION_SUCCESS,
    });

    // Track the toast
    const dismissFn = trackToast(toastCategories.current.undoAction, toastObj);
    registerDismisser(toastCategories.current.undoAction, dismissFn);

    return toastObj;
  };

  /**
   * Show a toast notification for payment status change
   */
  const showPaymentStatusToast = (status: string) => {
    logDebug(`Showing payment status toast: ${status}`);

    // First dismiss any existing payment status toasts
    cleanupCategory(toastCategories.current.paymentStatus);

    const toastObj = toast({
      title: 'Payment Status Updated',
      description: `Payment status changed to ${status}`,
      variant: 'default',
      duration: TOAST_DURATION_SUCCESS,
    });

    // Track the toast
    const dismissFn = trackToast(toastCategories.current.paymentStatus, toastObj);
    registerDismisser(toastCategories.current.paymentStatus, dismissFn);

    return toastObj;
  };

  /**
   * Show an error toast notification
   */
  const showErrorToast = (title: string, description: string) => {
    logDebug(`Showing error toast: ${title} - ${description}`);

    const toastObj = toast({
      title,
      description,
      variant: 'destructive',
      duration: TOAST_DURATION_ERROR,
    });

    // Track the toast
    const dismissFn = trackToast(toastCategories.current.error, toastObj);
    registerDismisser(toastCategories.current.error, dismissFn);

    return toastObj;
  };

  /**
   * Clean up all toasts managed by this component
   */
  const cleanupAllToasts = () => {
    logDebug('Cleaning up all toasts');

    Object.values(toastCategories.current).forEach(category => {
      cleanupCategory(category);
    });

    // Also clean up any dynamic categories
    Object.keys(activeToastDismissers.current).forEach(category => {
      cleanupCategory(category);
    });
  };

  return {
    showStatusChangeToast,
    showUndoSuccessToast,
    showPaymentStatusToast,
    showErrorToast,
    cleanupAllToasts,
    cleanupCategory,
    // Return the current categories for cleanup
    getCategories: () => Object.values(toastCategories.current),
  };
}

/**
 * Component to help clean up toasts when a component unmounts
 */
export function ToastCleanupEffect({
  categories,
  onCleanup,
}: {
  categories: string[];
  onCleanup?: () => void;
}) {
  // Get direct access to the enhanced toast functionality
  const enhancedToast = useEnhancedToast();
  const { dismissToastsByCategory } = enhancedToast;

  // Store categories in ref to avoid changing effect dependencies
  const categoriesRef = useRef(categories);

  // Update ref if categories change
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  // Cleanup effect
  useEffect(() => {
    // Return cleanup function that runs when component unmounts
    return () => {
      console.log('ToastCleanupEffect unmounting, cleaning up categories:', categoriesRef.current);

      // Dismiss all toasts in each category
      categoriesRef.current.forEach(category => {
        try {
          dismissToastsByCategory(category);
        } catch (err) {
          console.warn(`Failed to dismiss toasts in category ${category}:`, err);
        }
      });

      // Run optional custom cleanup
      if (onCleanup) {
        onCleanup();
      }
    };
  }, [dismissToastsByCategory, onCleanup]);

  return null;
}
