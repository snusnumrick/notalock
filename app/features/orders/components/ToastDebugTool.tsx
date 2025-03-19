import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useEnhancedToast } from '~/hooks/useEnhancedToast';

interface ToastDebugToolProps {
  onStatusUpdate?: (message: string) => void;
}

export function ToastDebugTool({ onStatusUpdate }: ToastDebugToolProps) {
  const [count, setCount] = useState(0);
  const { toast, trackToast, dismissToastsByCategory } = useEnhancedToast();

  const logMessage = (message: string) => {
    console.log(message);
    if (onStatusUpdate) {
      onStatusUpdate(message);
    }
  };

  const triggerStandardToast = () => {
    const newCount = count + 1;
    setCount(newCount);
    const message = `Standard Toast #${newCount}`;

    const toastObj = toast({
      title: 'Standard Toast',
      description: message,
      variant: 'default',
      duration: 99999,
    });

    // Track the toast for potential cleanup
    trackToast('debug-standard', toastObj);

    logMessage(`Triggered standard toast: ${message}`);
  };

  const triggerVariantToast = () => {
    const newCount = count + 1;
    setCount(newCount);
    const message = `Destructive Toast #${newCount}`;

    const toastObj = toast({
      title: 'Destructive Toast',
      description: message,
      variant: 'destructive',
      duration: 99999,
    });

    // Track the toast
    trackToast('debug-destructive', toastObj);

    logMessage(`Triggered destructive toast: ${message}`);
  };

  const triggerToastWithAction = () => {
    const newCount = count + 1;
    setCount(newCount);

    const toastObj = toast({
      title: 'Toast with Action',
      description: `Action Toast #${newCount}`,
      variant: 'default',
      duration: 99999,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            logMessage(`Action button clicked on toast #${newCount}`);
            triggerVariantToast();
          }}
        >
          Action
        </Button>
      ),
    });

    // Track the toast
    trackToast('debug-action', toastObj);

    logMessage(`Triggered toast with action: #${newCount}`);
  };

  const dismissAllToasts = () => {
    logMessage('Dismissing all debug toasts');

    // Dismiss all tracked debug toasts
    dismissToastsByCategory('debug-standard');
    dismissToastsByCategory('debug-destructive');
    dismissToastsByCategory('debug-action');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Toast Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Button onClick={triggerStandardToast} variant="outline">
            Default Toast
          </Button>

          <Button onClick={triggerVariantToast} variant="outline">
            Destructive Toast
          </Button>

          <Button onClick={triggerToastWithAction} variant="outline">
            Toast with Action
          </Button>

          <Button onClick={dismissAllToasts} variant="default">
            Dismiss All Toasts
          </Button>
        </div>

        <div className="text-sm text-gray-600">Toast count: {count}</div>
      </CardContent>
    </Card>
  );
}
