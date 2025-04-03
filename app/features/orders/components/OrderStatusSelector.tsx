import React, { useState, useEffect, useRef } from 'react';
// We intentionally don't use useNavigate or any form submissions here
// as they would cause a page refresh and dismiss our Toast notifications
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { AlertCircle, Clock } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useAsyncOperation } from '~/hooks/useAsyncOperation';
import { useOrderToastManager, ToastCleanupEffect } from './OrderToastManager';

// Types needed for the component
interface OrderStatusSelectorProps {
  orderId: string;
  currentStatus: OrderStatus;
  allowedStatuses: OrderStatus[];
  onStatusChange: (
    orderId: string,
    newStatus: OrderStatus
  ) => Promise<{
    order: Order;
    undo: () => Promise<unknown>;
  }>;
  onCheckUndoStatus: (orderId: string) => Promise<{
    canUndo: boolean;
    previousStatus?: OrderStatus;
    currentStatus?: OrderStatus;
    timeRemaining?: number;
    expiresAt?: string;
  }>;
  externalIsLoading?: boolean;
  debug?: boolean;
}

export const OrderStatusSelector: React.FC<OrderStatusSelectorProps> = ({
  orderId,
  currentStatus,
  allowedStatuses,
  onStatusChange,
  onCheckUndoStatus,
  externalIsLoading = false,
  debug = false,
}) => {
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus);

  // Use our custom hook for managing async operation state
  const {
    isLoading: isUpdating,
    loadingRef: updatingRef,
    executeAsync,
    isActive: isUpdatingActive,
  } = useAsyncOperation(false, debug); // Enable debug logging if debug prop is true

  // Generate a unique category prefix for this order
  const toastCategoryPrefix = `order-status-${orderId.substring(0, 8)}`;

  // Use the order toast manager for consistent toast handling
  const toastManager = useOrderToastManager({
    categoryPrefix: toastCategoryPrefix,
    debug,
    onDebugMessage: debug ? console.log : undefined,
  });

  const [undoInfo, setUndoInfo] = useState<{
    canUndo: boolean;
    previousStatus?: OrderStatus;
    timeRemaining?: number;
    undo?: () => Promise<unknown>;
  }>({ canUndo: false });
  const [undoTimeRemaining, setUndoTimeRemaining] = useState<number | null>(null);

  // Prevent state updates after component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Update when currentStatus prop changes
  useEffect(() => {
    if (debug) {
      console.log(
        `OrderStatusSelector: currentStatus prop changed from ${selectedStatus} to ${currentStatus}`
      );
    }
    setSelectedStatus(currentStatus);
  }, [currentStatus, selectedStatus, debug]);

  // Handle status change
  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === currentStatus) return;

    try {
      // Update the selected status immediately for UI feedback
      setSelectedStatus(newStatus);

      // Execute the status change with loading state management
      const { undo } = await executeAsync(() => onStatusChange(orderId, newStatus), {
        operationName: `Status change ${currentStatus} → ${newStatus}`,
        onSuccess: result => {
          if (debug) {
            console.log('Status change successful, received order:', result.order);
          }

          // Show a toast notification for the status change with undo option
          if (isMounted.current) {
            toastManager.showStatusChangeToast(
              newStatus,
              currentStatus,
              // This will be called if the user clicks undo
              async () => {
                try {
                  await handleUndo();
                } catch (error) {
                  console.error('Error in undo callback:', error);
                }
              }
            );
          }
        },
      });

      // Only update state if component is still mounted
      if (isMounted.current) {
        // Store undo function and set undo information
        setUndoInfo({
          canUndo: true,
          previousStatus: currentStatus,
          timeRemaining: 300, // Starting with 5 minutes (300 seconds)
          undo,
        });
      }
    } catch (error) {
      console.error('Failed to update status:', error);

      // Only update state if component is still mounted
      if (isMounted.current) {
        // Reset status selection if there was an error
        setSelectedStatus(currentStatus);

        // Show error toast
        toastManager.showErrorToast('Error', 'Failed to update order status');
      }
    }
  };

  // Handle undo action
  const handleUndo = async () => {
    // Set a flag to indicate this is an undo operation
    // This will be used to prevent showing redundant status change toasts
    window.__isUndoOperation = true;

    if (debug) {
      console.log('OrderStatusSelector: handleUndo called', {
        undoInfo,
        isUpdating,
        updatingRef,
        isUpdatingActive: isUpdatingActive(),
      });
    }

    if (!undoInfo.canUndo || !undoInfo.undo) {
      console.log('OrderStatusSelector: Cannot undo - missing undo function or canUndo is false');
      // Reset the flag before returning
      window.__isUndoOperation = false;
      return;
    }

    // If already processing, don't try to undo
    if (isUpdatingActive() || externalIsLoading) {
      console.log('OrderStatusSelector: Cannot undo - operation already in progress');
      // Reset the flag before returning
      window.__isUndoOperation = false;
      return;
    }

    try {
      // Execute the undo function with loading state management
      await executeAsync(undoInfo.undo!, {
        operationName: `Undo status change to ${undoInfo.previousStatus}`,
        onSuccess: () => {
          if (debug) {
            console.log('Undo successful');
          }

          // Show success toast
          if (undoInfo.previousStatus && isMounted.current) {
            toastManager.showUndoSuccessToast(undoInfo.previousStatus);
          }
        },
      });

      // Only update state if component is still mounted
      if (isMounted.current) {
        // Reset undo info since we've used it
        setUndoInfo({ canUndo: false });

        // Also update the selected status to match the reverted status
        if (undoInfo.previousStatus) {
          setSelectedStatus(undoInfo.previousStatus);
        }
      }
    } catch (error) {
      console.error('Failed to undo status change:', error);

      // Only update state if component is still mounted
      if (isMounted.current) {
        // If undo fails, reset back to the current status
        setSelectedStatus(selectedStatus);

        // Show error toast
        toastManager.showErrorToast('Error', 'Failed to undo status change');
      }
    } finally {
      // Always reset the undo operation flag, even if there's an error
      window.__isUndoOperation = false;
    }
  };

  // Check if undo is available on initial load
  useEffect(() => {
    const checkUndoStatus = async () => {
      try {
        const status = await onCheckUndoStatus(orderId);
        if (status.canUndo && isMounted.current) {
          setUndoTimeRemaining(status.timeRemaining || null);

          // Only show if there's significant time remaining (> 10 seconds)
          if ((status.timeRemaining || 0) > 10) {
            setUndoInfo({
              canUndo: true,
              previousStatus: status.previousStatus,
              timeRemaining: status.timeRemaining,
            });
          }
        }
      } catch (error) {
        console.error('Failed to check undo status:', error);
      }
    };

    checkUndoStatus();
  }, [orderId, onCheckUndoStatus]);

  // Countdown timer for undo window
  useEffect(() => {
    if (!undoInfo.canUndo || undoTimeRemaining === null) return;

    const timer = setInterval(() => {
      if (isMounted.current) {
        setUndoTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            setUndoInfo({ canUndo: false });
            return null;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [undoInfo.canUndo, undoTimeRemaining]);

  // Format time remaining as mm:ss
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Debug render state
  if (debug) {
    console.log('OrderStatusSelector render state:', {
      selectedStatus,
      currentStatus,
      isUpdating,
      isUpdatingRef: updatingRef.current,
      externalIsLoading,
      isUpdatingActive: isUpdatingActive(),
    });
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Select
              value={selectedStatus}
              onValueChange={(value: OrderStatus) => handleStatusChange(value)}
              disabled={isUpdatingActive() || externalIsLoading}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {allowedStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Use isUpdatingActive to check if an operation is in progress, or check externalIsLoading */}
            {(isUpdatingActive() || externalIsLoading) && (
              <Badge variant="outline" className="text-yellow-600 bg-yellow-50">
                <Clock className="w-3 h-3 mr-1" />
                Updating...
              </Badge>
            )}
          </div>

          {undoInfo.canUndo && undoTimeRemaining !== null && (
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="text-blue-600 bg-blue-50 mr-2">
                <AlertCircle className="w-3 h-3 mr-1" />
                Changed from {undoInfo.previousStatus}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="text-xs"
                disabled={isUpdatingActive() || externalIsLoading}
              >
                Undo ({formatTimeRemaining(undoTimeRemaining)})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add toast cleanup effect */}
      <ToastCleanupEffect
        categories={[...Object.values(toastManager.getCategories())]}
        onCleanup={() => {
          // Force additional cleanup for any dynamic categories
          toastManager.cleanupAllToasts();
        }}
      />
    </>
  );
};
