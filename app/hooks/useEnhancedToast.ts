import { useRef } from 'react';
import { useToast } from '~/hooks/use-toast';
import type { ToastActionElement } from '~/components/ui/toast';

interface ToastProps {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  action?: ToastActionElement;
}

interface ToastObject {
  id: string;
  dismiss: () => void;
  update: (props: Partial<ToastProps>) => void;
}

interface EnhancedToastReturnType {
  toast: (props: ToastProps) => ToastObject;
  dismissToast: (id: string) => void;
  dismissAllToasts: () => void;
  dismissToastsByCategory: (category: string) => void;
  trackToast: (category: string, toast: ToastObject) => () => void; // Returns a dismiss function
  getTrackedToasts: () => Record<string, Record<string, ToastObject>>;
}

/**
 * Enhanced toast hook that adds tracking and category management
 * for easier toast cleanup and organization
 */
export function useEnhancedToast(): EnhancedToastReturnType {
  const { toast: originalToast, dismiss } = useToast();

  // Use a ref to track toasts by category for reliable cleanup even during re-renders
  const toastCategoriesRef = useRef<Record<string, Record<string, ToastObject>>>({});

  /**
   * Show a toast notification with enhanced tracking
   */
  const toast = (props: ToastProps): ToastObject => {
    console.log('Enhanced toast shown:', props.title);
    const toastObj = originalToast(props) as ToastObject;
    return toastObj;
  };

  /**
   * Track a toast by category for later management
   */
  const trackToast = (category: string, toastObj: ToastObject) => {
    if (!toastCategoriesRef.current[category]) {
      toastCategoriesRef.current[category] = {};
    }

    // Generate a unique ID for this toast within the category
    const toastTrackingId = `${category}-${toastObj.id}`;
    console.log(`Tracking toast ${toastObj.id} in category ${category}`);

    // Store the toast object with its tracking ID
    toastCategoriesRef.current[category][toastTrackingId] = toastObj;

    // Return a function to specifically dismiss this toast
    return () => {
      if (toastCategoriesRef.current[category]?.[toastTrackingId]) {
        try {
          toastObj.dismiss();
          delete toastCategoriesRef.current[category][toastTrackingId];
        } catch (err) {
          console.warn(`Failed to dismiss tracked toast ${toastTrackingId}:`, err);
        }
      }
    };
  };

  /**
   * Dismiss a specific toast by ID
   */
  const dismissToast = (id: string) => {
    console.log(`Dismissing toast with ID: ${id}`);

    // Use the original dismiss function
    dismiss(id);

    // Remove from tracking
    Object.keys(toastCategoriesRef.current).forEach(category => {
      if (toastCategoriesRef.current[category][id]) {
        delete toastCategoriesRef.current[category][id];
      }
    });
  };

  /**
   * Dismiss all toasts in a specific category
   */
  const dismissToastsByCategory = (category: string) => {
    console.log(`Dismissing all toasts in category: ${category}`);

    if (!toastCategoriesRef.current[category]) {
      return;
    }

    // Create a copy of the toasts to avoid mutation during iteration
    const toasts = Object.values(toastCategoriesRef.current[category]);

    // Dismiss each toast
    toasts.forEach(toastObj => {
      if (toastObj && typeof toastObj.dismiss === 'function') {
        try {
          toastObj.dismiss();
        } catch (err) {
          console.warn(`Failed to dismiss toast in category ${category}:`, err);
        }
      } else if (toastObj && toastObj.id) {
        try {
          dismiss(toastObj.id);
        } catch (err) {
          console.warn(`Failed to dismiss toast by ID in category ${category}:`, err);
        }
      }
    });

    // Clear the category
    toastCategoriesRef.current[category] = {};
  };

  /**
   * Dismiss all tracked toasts
   */
  const dismissAllToasts = () => {
    console.log('Dismissing all tracked toasts');

    Object.keys(toastCategoriesRef.current).forEach(category => {
      dismissToastsByCategory(category);
    });
  };

  /**
   * Get all tracked toasts (for debugging)
   */
  const getTrackedToasts = () => {
    return toastCategoriesRef.current;
  };

  return {
    toast,
    dismissToast,
    dismissAllToasts,
    dismissToastsByCategory,
    trackToast,
    getTrackedToasts,
  };
}
