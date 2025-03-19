import React, { createContext, useContext, ReactNode } from 'react';
import { Toaster } from '~/components/ui/toaster';

// Create a context for managing toasts across components
interface ToastManagerContextType {
  showToast: (props: {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
    action?: React.ReactNode;
    duration?: number;
  }) => string;
  dismissToast: (id: string) => void;
}

const ToastManagerContext = createContext<ToastManagerContextType | null>(null);

// Create a provider component
export function ToastManagerProvider({ children }: { children: ReactNode }) {
  // We're using the standard Toaster here but wrapping it in our own provider
  // This ensures the Toaster component is only mounted once globally
  return (
    <div className="toast-manager-container">
      {children}
      <Toaster />
    </div>
  );
}

// Create a hook for using the toast manager
export function useToastManager() {
  const context = useContext(ToastManagerContext);
  if (!context) {
    console.warn('useToastManager must be used within a ToastManagerProvider');
    // Return null functions to prevent errors
    return {
      showToast: () => '',
      dismissToast: () => {},
    };
  }
  return context;
}

// Add this component once at a high level in your app (e.g., in root.tsx)
// <ToastManagerProvider>
//   {/* your app content */}
// </ToastManagerProvider>
