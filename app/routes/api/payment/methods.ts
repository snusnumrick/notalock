import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { getPaymentService } from '~/features/payment/PaymentService';
import { getClientPaymentConfig } from '~/features/payment/config/paymentConfig.server';

/**
 * Get Available Payment Methods API
 *
 * Returns the available payment methods and providers
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get the client-side payment configuration
    const clientConfig = getClientPaymentConfig();

    // Get the payment service
    const paymentService = getPaymentService();

    // Get available providers
    const providers = paymentService.getAvailableProviders();

    // Define payment methods
    const paymentMethods = [
      {
        id: 'credit_card',
        name: 'Credit Card',
        providers: providers.map(p => p.id),
      },
      {
        id: 'paypal',
        name: 'PayPal',
        providers: ['paypal'].filter(p => providers.some(provider => provider.id === p)),
      },
      {
        id: 'apple_pay',
        name: 'Apple Pay',
        providers: ['square', 'stripe'].filter(p => providers.some(provider => provider.id === p)),
      },
      {
        id: 'google_pay',
        name: 'Google Pay',
        providers: ['square', 'stripe'].filter(p => providers.some(provider => provider.id === p)),
      },
    ].filter(method => method.providers.length > 0);

    // Return the payment methods and configuration
    return json({
      methods: paymentMethods,
      providers: clientConfig.availableProviders,
      defaultProvider: clientConfig.defaultProvider,
      config: {
        square: clientConfig.square,
        stripe: clientConfig.stripe,
      },
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);

    // Handle errors
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
