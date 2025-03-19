import { useEffect, useState } from 'react';
import { type ActionFunctionArgs, json, type LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { requireAdmin } from '~/server/middleware/auth.server';
import { OrderDetail } from '~/features/orders/components/admin/OrderDetail';
import { getOrderById } from '~/features/orders/api/queries.server';
import { updateOrderStatus, updatePaymentStatus } from '~/features/orders/api/actions.server';
import type { Order, OrderStatus, PaymentStatus } from '~/features/orders/types';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Toaster } from '~/components/ui/toaster';
import { ToastDebugTool } from '~/features/orders/components/ToastDebugTool';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useAsyncOperation } from '~/hooks/useAsyncOperation';
import {
  ToastCleanupEffect,
  useOrderToastManager,
} from '~/features/orders/components/OrderToastManager';

export async function loader({ request, params }: LoaderFunctionArgs) {
  // Verify the user is an admin
  await requireAdmin(request);

  const orderId = params.id;
  if (!orderId) {
    throw new Response('Order ID is required', { status: 400 });
  }

  try {
    // Get the order with all details using the query function
    const order = await getOrderById(orderId);

    if (!order) {
      throw new Response('Order not found', { status: 404 });
    }

    return json({ order });
  } catch (error) {
    console.error('Error loading order:', error);
    throw new Response('Order not found', { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  // Verify the user is an admin
  await requireAdmin(request);

  // Only process POST/PUT requests
  if (request.method !== 'POST' && request.method !== 'PUT') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const orderId = params.id;
  if (!orderId) {
    return json({ error: 'Order ID is required' }, { status: 400 });
  }

  try {
    // Handle both JSON and FormData requests
    let intentValue;
    let statusValue;
    let paymentStatusValue;
    let notesValue;

    // Check if the request is JSON
    if (request.headers.get('Content-Type')?.includes('application/json')) {
      // Parse the JSON body
      const data = await request.json();
      intentValue = data.intent;
      statusValue = data.status;
      paymentStatusValue = data.paymentStatus;
      notesValue = data.notes;
    } else {
      // Parse the form data
      const formData = await request.formData();
      intentValue = formData.get('intent');
      statusValue = formData.get('status')?.toString();
      paymentStatusValue = formData.get('paymentStatus')?.toString();
      notesValue = formData.get('notes')?.toString();
    }

    if (intentValue === 'updateStatus') {
      if (!statusValue) {
        return json({ error: 'Status is required' }, { status: 400 });
      }

      // Validate the status
      const validStatuses: OrderStatus[] = [
        'pending',
        'processing',
        'paid',
        'completed',
        'cancelled',
        'refunded',
        'failed',
      ];

      if (!validStatuses.includes(statusValue as OrderStatus)) {
        return json({ error: 'Invalid status value' }, { status: 400 });
      }

      // Update order status
      const order = await updateOrderStatus(orderId, statusValue as OrderStatus, notesValue);

      return json({ order, success: true });
    } else if (intentValue === 'updatePaymentStatus') {
      if (!paymentStatusValue) {
        return json({ error: 'Payment status is required' }, { status: 400 });
      }

      // Validate the payment status
      const validPaymentStatuses: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];

      if (!validPaymentStatuses.includes(paymentStatusValue as PaymentStatus)) {
        return json({ error: 'Invalid payment status value' }, { status: 400 });
      }

      // Update payment status
      const order = await updatePaymentStatus(
        orderId,
        paymentStatusValue as PaymentStatus,
        undefined,
        notesValue
      );

      return json({ order, success: true });
    }

    return json({ error: 'Invalid action intent' }, { status: 400 });
  } catch (error) {
    console.error('Error updating order:', error);
    return json({ error: `Failed to update order: ${(error as Error).message}` }, { status: 500 });
  }
}

export default function OrderDetailRoute() {
  const { order } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Debug mode state
  const [debugMode, setDebugMode] = useState(false);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  // Track active order state
  const [currentOrder, setCurrentOrder] = useState<Order>(order as Order);

  // State to track if we're currently performing an undo operation
  const [isUndoOperation, setIsUndoOperation] = useState(false);

  // Use our async operation hook for tracking operations
  const { executeAsync, isActive: isOperationActive } = useAsyncOperation(false, debugMode); // Enable debug logging

  // Function to add debug message
  const addDebugMessage = (message: string) => {
    setDebugMessages(prev => [message, ...prev].slice(0, 10));
    console.log('Debug:', message);
  };

  // Use the order toast manager for consistent toast handling
  const toastManager = useOrderToastManager({
    categoryPrefix: `admin-order-${currentOrder.id.substring(0, 8)}`,
    debug: debugMode,
    onDebugMessage: addDebugMessage,
  });

  // Debug log
  if (debugMode) {
    console.log('Rendering OrderDetailRoute', {
      orderFromLoader: order,
      currentOrderState: currentOrder,
      actionData,
      navigationState: navigation.state,
      isOperationActive: isOperationActive(),
    });
  }

  // Update local state when order from loader changes
  useEffect(() => {
    setCurrentOrder(order as Order);
  }, [order]);

  // Handle status change
  const handleStatusChange = async (status: OrderStatus, orderId: string) => {
    console.log('Status change requested:', { status, orderId });
    addDebugMessage(`Status change requested: ${status}`);

    // Store previous status for undo
    const previousStatus = currentOrder.status;

    // Execute the API request with loading state management
    return await executeAsync(
      async () => {
        const response = await fetch(`/api/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            notes: 'Status updated via admin panel',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error updating status:', errorData);
          addDebugMessage(`Error updating status: ${JSON.stringify(errorData)}`);
          throw new Error('Failed to update order status');
        }

        return response.json();
      },
      {
        operationName: `Status change to ${status}`,
        onSuccess: result => {
          console.log('Status updated successfully:', result);
          addDebugMessage(`Status updated successfully to ${status}`);

          // Update local state without reloading the page immediately
          // This allows Toast notifications to be visible
          setCurrentOrder(result.order || result);

          // Show toast notification for status update with undo option
          // Only show toast if not in the middle of an undo operation
          if (!isUndoOperation) {
            toastManager.showStatusChangeToast(
              status,
              previousStatus,
              // Undo callback
              async () => {
                addDebugMessage(`Undo clicked, reverting to ${previousStatus}`);

                // Set undo flag to prevent redundant toasts
                setIsUndoOperation(true);

                try {
                  // Show a toast indicating the undo is in progress
                  toastManager.showUndoSuccessToast(previousStatus);

                  // Call the handler to revert the status
                  await handleStatusChange(previousStatus, orderId);
                } catch (error) {
                  console.error('Error during undo operation:', error);
                  addDebugMessage(
                    `Error during undo: ${error instanceof Error ? error.message : String(error)}`
                  );
                  toastManager.showErrorToast('Error', 'Failed to undo status change');
                } finally {
                  // Reset undo flag when complete (success or failure)
                  setIsUndoOperation(false);
                }
              }
            );
          }
        },
        onError: error => {
          console.error('Error in handleStatusChange:', error);
          addDebugMessage(
            `Error in handleStatusChange: ${error instanceof Error ? error.message : String(error)}`
          );

          // Show error toast
          toastManager.showErrorToast('Error', 'Failed to update order status');
        },
      }
    );
  };

  // Handle payment status change
  const handlePaymentStatusChange = async (status: PaymentStatus, orderId: string) => {
    console.log('Payment status change requested:', { status, orderId });
    addDebugMessage(`Payment status change requested: ${status}`);

    // Execute the API request with loading state management
    return await executeAsync(
      async () => {
        const response = await fetch(`/api/orders/${orderId}/update-payment-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentStatus: status,
            notes: 'Payment status updated via admin panel',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error updating payment status:', errorData);
          addDebugMessage(`Error updating payment status: ${JSON.stringify(errorData)}`);
          throw new Error('Failed to update payment status');
        }

        return response.json();
      },
      {
        operationName: `Payment status change to ${status}`,
        onSuccess: result => {
          console.log('Payment status updated successfully:', result);
          addDebugMessage(`Payment status updated successfully to ${status}`);

          // Update local state without reloading the page immediately
          setCurrentOrder(result.order || result);

          // Show toast notification for payment status update
          toastManager.showPaymentStatusToast(status);
        },
        onError: error => {
          console.error('Error in handlePaymentStatusChange:', error);
          addDebugMessage(
            `Error in handlePaymentStatusChange: ${error instanceof Error ? error.message : String(error)}`
          );

          // Show error toast
          toastManager.showErrorToast('Error', 'Failed to update payment status');
        },
      }
    );
  };

  // Update local order state when the server responds with a new order
  useEffect(() => {
    if (
      actionData &&
      'success' in actionData &&
      actionData.success &&
      actionData.order &&
      actionData.order.id === currentOrder.id
    ) {
      console.log('Updating order state from action data', actionData.order);
      addDebugMessage('Updating order state from action data');
      setCurrentOrder(actionData.order as Order);
    }
  }, [actionData, currentOrder.id]);

  // Toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(prev => !prev);
    addDebugMessage(`Debug mode ${!debugMode ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="container py-8">
      <Toaster />

      {/* Add toast cleanup on route unmount */}
      <ToastCleanupEffect
        categories={[
          // Admin order categories
          ...Object.values(toastManager.getCategories()),
          // Order status selector categories (for each Order selector used)
          `order-status-${currentOrder.id.substring(0, 8)}-status-change`,
          `order-status-${currentOrder.id.substring(0, 8)}-undo-action`,
          `order-status-${currentOrder.id.substring(0, 8)}-error`,
        ]}
        onCleanup={() => {
          // Force additional cleanup for any dynamic categories
          toastManager.cleanupAllToasts();
        }}
      />

      {/* Toggle Debug Mode Button */}
      <div className="mb-4 flex justify-end">
        <Button variant={debugMode ? 'default' : 'outline'} size="sm" onClick={toggleDebugMode}>
          {debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
        </Button>
      </div>

      {/* Debug Panel */}
      {debugMode && (
        <div className="mb-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Debug Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-2 rounded text-sm font-mono h-32 overflow-y-auto space-y-1">
                {debugMessages.length > 0 ? (
                  debugMessages.map((msg, i) => (
                    <div key={i} className="border-b border-gray-200 pb-1">
                      {msg}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic">No messages yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          <ToastDebugTool onStatusUpdate={addDebugMessage} />
        </div>
      )}

      {actionData && 'error' in actionData && actionData.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      {actionData && 'success' in actionData && actionData.success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Order updated successfully</AlertDescription>
        </Alert>
      )}

      <OrderDetail
        order={currentOrder}
        onStatusChange={handleStatusChange}
        onPaymentStatusChange={handlePaymentStatusChange}
        isLoading={isSubmitting || isOperationActive()}
        isAsync={isOperationActive()}
        debug={debugMode}
      />
    </div>
  );
}
