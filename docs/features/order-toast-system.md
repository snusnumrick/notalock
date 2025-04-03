# Order Toast System Documentation

## Overview

The Order Toast system provides a consistent and reliable way to display notifications related to order status changes and other order-related operations. It includes specialized handling for undo operations.

## Key Components

### 1. Enhanced Toast Hook (`useEnhancedToast`)

The foundation of the toast system that provides:
- Category-based toast tracking
- Toast cleanup mechanisms
- Persistent tracking across renders

### 2. Order Toast Manager (`useOrderToastManager`)

A specialized manager for order-related toasts that provides:
- Consistent toast styling and behavior
- Methods for common order toasts (status change, undo, error)
- Dynamic category generation with timestamps
- Comprehensive cleanup mechanisms

### 3. Toast Cleanup Effect

A component that ensures toasts are cleaned up when components unmount:
- Uses refs to avoid changing effect dependencies
- Implements multiple dismissal strategies
- Provides comprehensive error handling

## Undo Operation Handling

The system has special handling for undo operations to ensure a smooth user experience:

1. **Undo Flag**: A global `__isUndoOperation` flag is set during undo operations to prevent showing redundant "Order Status Updated" toasts.

2. **Status Reverted Toast**: When an undo operation succeeds, a "Status Reverted" toast is shown instead of the standard status change toast.

3. **Cleanup on Completion**: All undo-related toasts are automatically cleaned up when an operation completes.

4. **Error Handling**: The system includes robust error handling to ensure the undo flag is reset even if errors occur.

## Final State Undo

The undo functionality has been enhanced to support undo operations from "final" states like "canceled":

1. **Validation Bypass**: The system bypasses normal validation rules during undo operations by using a `skipValidation` flag in the order update method.

2. **Special Notes**: Undo operations include a special note in the order history to indicate they were performed via undo.

3. **Clean User Experience**: The undo operation feels natural to users regardless of which states are being transitioned between.

## Code Example: Handling an Undo Operation

```typescript
// Set the undo flag
window.__isUndoOperation = true;

try {
  // Execute the undo operation with validation bypass
  await executeAsync(async () => {
    await orderService.updateOrderStatus(
      orderId,
      previousStatus,
      'Status reverted via undo operation',
      { skipValidation: true } // Bypass validation for undo
    );
  }, {
    onSuccess: () => {
      // Show "Status Reverted" toast
      toastManager.showUndoSuccessToast(previousStatus);
    }
  });
} finally {
  // Always reset the flag
  window.__isUndoOperation = false;
}
```

## Implementation Notes

1. The enhanced toast system uses React refs for reliable tracking, even during re-renders.

2. Toast categories are dynamically generated with timestamps to avoid conflicts.

3. Multiple dismissal strategies are implemented for reliability.

4. The validation bypass is handled at the application level rather than the database level, making it more maintainable and explicit.

5. Try/finally blocks ensure that the undo flag is always reset, even if an error occurs.
