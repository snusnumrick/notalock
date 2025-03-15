import { getPaymentService } from './PaymentService';
import { loadPaymentConfig } from './config/paymentConfig.server';

/**
 * Initialize payment providers based on environment configuration
 * This should be called during application startup
 */
export async function initializePaymentProviders(): Promise<void> {
  const config = loadPaymentConfig();
  const paymentService = getPaymentService();

  console.log(`Initializing payment providers. Default: ${config.defaultProvider}`);

  // Initialize Square if configured
  if (config.square) {
    try {
      const initialized = await paymentService.setActiveProvider('square', {
        accessToken: config.square.accessToken,
        locationId: config.square.locationId,
        applicationId: config.square.applicationId,
        environment: config.square.environment,
      });

      console.log(`Square payment provider initialized: ${initialized ? 'Success' : 'Failed'}`);
    } catch (error) {
      console.error('Failed to initialize Square payment provider:', error);
    }
  }

  // Initialize Stripe if configured
  if (config.stripe) {
    try {
      const initialized = await paymentService.setActiveProvider('stripe', {
        secretKey: config.stripe.secretKey,
        publishableKey: config.stripe.publishableKey,
        webhookSecret: config.stripe.webhookSecret,
      });

      console.log(`Stripe payment provider initialized: ${initialized ? 'Success' : 'Failed'}`);
    } catch (error) {
      console.error('Failed to initialize Stripe payment provider:', error);
    }
  }

  // Set the default provider
  paymentService.setDefaultProvider(config.defaultProvider);
  console.log(`Payment providers initialized. Default set to: ${config.defaultProvider}`);
}
