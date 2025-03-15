/**
 * Server-side configuration for payment providers
 * Loads environment variables for payment services
 */

/**
 * Square configuration
 */
export interface SquareConfig {
  accessToken: string;
  applicationId: string;
  locationId: string;
  environment: 'sandbox' | 'production';
  webhookSignatureKey?: string;
}

/**
 * Stripe configuration
 */
export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret?: string;
  environment: 'test' | 'live';
}

/**
 * Centralized payment configuration
 */
export interface PaymentConfig {
  square: SquareConfig | null;
  stripe: StripeConfig | null;
  defaultProvider: 'square' | 'stripe' | 'mock';
}

/**
 * Load payment configuration from environment variables
 */
export function loadPaymentConfig(): PaymentConfig {
  // Load Square configuration if environment variables are available
  const squareConfig: SquareConfig | null = process.env.SQUARE_ACCESS_TOKEN
    ? {
        accessToken: process.env.SQUARE_ACCESS_TOKEN,
        applicationId: process.env.SQUARE_APP_ID || '',
        locationId: process.env.SQUARE_LOCATION_ID || '',
        environment: process.env.SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
        webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
      }
    : null;

  // Load Stripe configuration if environment variables are available
  const stripeConfig: StripeConfig | null = process.env.STRIPE_SECRET_KEY
    ? {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        environment: process.env.STRIPE_ENVIRONMENT === 'live' ? 'live' : 'test',
      }
    : null;

  // Determine default provider based on configuration and environment setting
  let defaultProvider: 'square' | 'stripe' | 'mock' = 'mock';

  if (process.env.DEFAULT_PAYMENT_PROVIDER) {
    if (process.env.DEFAULT_PAYMENT_PROVIDER === 'square' && squareConfig) {
      defaultProvider = 'square';
    } else if (process.env.DEFAULT_PAYMENT_PROVIDER === 'stripe' && stripeConfig) {
      defaultProvider = 'stripe';
    }
  } else {
    // Auto-select first available provider
    if (squareConfig) defaultProvider = 'square';
    else if (stripeConfig) defaultProvider = 'stripe';
  }

  return {
    square: squareConfig,
    stripe: stripeConfig,
    defaultProvider,
  };
}

/**
 * Get client-side configuration for payment providers
 * This function returns only the public config that can be safely exposed
 */
export function getClientPaymentConfig() {
  const config = loadPaymentConfig();

  return {
    availableProviders: [
      ...(config.square ? [{ id: 'square', name: 'Square' }] : []),
      ...(config.stripe ? [{ id: 'stripe', name: 'Stripe' }] : []),
      { id: 'mock', name: 'Test Mode' },
    ],
    defaultProvider: config.defaultProvider,
    // Only include public keys, never include secret keys
    square: config.square
      ? {
          applicationId: config.square.applicationId,
          locationId: config.square.locationId,
          environment: config.square.environment,
        }
      : null,
    stripe: config.stripe
      ? {
          publishableKey: config.stripe.publishableKey,
          environment: config.stripe.environment,
        }
      : null,
  };
}
