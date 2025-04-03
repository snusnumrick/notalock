import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface DirectToastProps {
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  onUndo?: () => void;
}

export const DirectToast: React.FC<DirectToastProps> = ({
  title,
  message,
  duration = 30000,
  onClose,
  onUndo,
}) => {
  const [visible, setVisible] = useState(true);
  console.log('DirectToast rendered:', { title, message });

  const handleClose = useCallback(() => {
    console.log('DirectToast closing:', title);
    setVisible(false);
    if (onClose) {
      onClose();
    }
  }, [title, onClose]);

  // Auto close after duration
  useEffect(() => {
    console.log('DirectToast mounted with title:', title);
    const timer = setTimeout(() => {
      console.log('DirectToast auto-closing after timeout');
      handleClose();
    }, duration);

    return () => {
      console.log('DirectToast unmounting:', title);
      clearTimeout(timer);
    };
  }, [duration, title, handleClose]);

  const handleUndo = () => {
    console.log('DirectToast undo clicked:', title);
    if (onUndo) {
      onUndo();
    }
  };

  if (!visible) {
    console.log('DirectToast is not visible, returning null');
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-md bg-white rounded-md shadow-lg border border-gray-200 p-4 transform transition-all duration-300"
      style={{ zIndex: 9999 }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {onUndo && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={handleUndo} className="w-full text-sm">
            Undo
          </Button>
        </div>
      )}
    </div>
  );
};

export const useDirectToast = () => {
  const [toasts, setToasts] = useState<React.ReactNode[]>([]);
  const [toastIds, setToastIds] = useState<Record<string, string>>({}); // Track toast IDs

  // Log warning about runtime.lastError if it occurs
  useEffect(() => {
    const handleRuntimeError = (event: ErrorEvent) => {
      if (event.message.includes('runtime.lastError')) {
        console.warn(
          'DirectToast: Detected runtime.lastError. This is likely due to extension conflict or browser extension messaging.'
        );
      }
    };

    window.addEventListener('error', handleRuntimeError);
    return () => window.removeEventListener('error', handleRuntimeError);
  }, []);

  const dismissToast = (id: string) => {
    console.log('DirectToast: Dismissing toast with ID', id);
    setToasts(prevToasts => prevToasts.filter(t => t !== id));

    // Remove from toastIds tracking
    setToastIds(prev => {
      const newIds = { ...prev };
      // Remove any entries that have this ID as value
      Object.keys(newIds).forEach(key => {
        if (newIds[key] === id) delete newIds[key];
      });
      return newIds;
    });
  };

  const showToast = (props: DirectToastProps) => {
    const id = Date.now().toString();
    const identifier = props.title + '-' + props.message.substring(0, 20);

    const onCloseWrapper = () => {
      if (props.onClose) props.onClose();
      dismissToast(id);
    };

    const toast = <DirectToast key={id} {...props} onClose={onCloseWrapper} />;

    console.log('DirectToast: Showing new toast', id, props.title);
    setToasts(prev => [...prev, toast]);

    // Track the toast ID
    setToastIds(prev => ({
      ...prev,
      [identifier]: id,
    }));

    return {
      id,
      dismiss: () => dismissToast(id),
    };
  };

  const ToastContainer = () => {
    console.log('DirectToast: Rendering container with', toasts.length, 'toasts');
    return (
      <div className="fixed top-4 right-4 z-[9999] p-4 space-y-4" style={{ pointerEvents: 'all' }}>
        {toasts}
      </div>
    );
  };

  return {
    showToast,
    ToastContainer,
    dismissToast,
    toastIds,
  };
};
