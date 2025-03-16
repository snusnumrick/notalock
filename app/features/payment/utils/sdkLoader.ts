/**
 * Utility functions for loading payment provider SDKs
 */

/**
 * Load Square Web Payments SDK
 */
export function loadSquareSdk(): Promise<typeof window.Square> {
  // If SDK is already loaded, return it
  if (window.Square) {
    return Promise.resolve(window.Square);
  }

  return new Promise((resolve, reject) => {
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
    script.crossOrigin = 'anonymous';
    script.integrity = 'sha256-NvA9FvXRGCpGRFdepxQwwAC9w+NcsBxd5T5fwLZaS0E=';

    // Define onload handler
    script.onload = () => {
      if (window.Square) {
        resolve(window.Square);
      } else {
        reject(new Error('Square SDK loaded but global is not defined'));
      }
    };

    // Define error handler
    script.onerror = () => {
      reject(new Error('Failed to load Square SDK'));
    };

    // Add script to document
    document.body.appendChild(script);
  });
}

// Add type declaration for payment globals
declare global {
  interface Window {
    Square?: unknown;
    Stripe?: (publishableKey: string) => unknown;
  }
}

/**
 * Load Stripe.js SDK
 */
export function loadStripeSdk(publishableKey: string): Promise<unknown> {
  // If SDK is already loaded, return it
  if (window.Stripe) {
    return Promise.resolve((window.Stripe as (key: string) => unknown)(publishableKey));
  }

  return new Promise((resolve, reject) => {
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';

    // Define onload handler
    script.onload = () => {
      if (window.Stripe) {
        resolve((window.Stripe as (key: string) => unknown)(publishableKey));
      } else {
        reject(new Error('Stripe SDK loaded but global is not defined'));
      }
    };

    // Define error handler
    script.onerror = () => {
      reject(new Error('Failed to load Stripe SDK'));
    };

    // Add script to document
    document.body.appendChild(script);
  });
}
