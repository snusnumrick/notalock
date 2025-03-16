/**
 * Base class for payment errors
 * Provides consistent error handling across payment providers
 */
export class PaymentError extends Error {
  code: string;
  statusCode: number;
  providerCode?: string;
  userMessage: string;

  constructor({
    message,
    code = 'PAYMENT_ERROR',
    statusCode = 400,
    providerCode,
    userMessage,
  }: {
    message: string;
    code?: string;
    statusCode?: number;
    providerCode?: string;
    userMessage?: string;
  }) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.statusCode = statusCode;
    this.providerCode = providerCode;
    this.userMessage = userMessage || 'An error occurred while processing your payment.';

    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, PaymentError.prototype);
  }

  /**
   * Returns a JSON representation of the error
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        userMessage: this.userMessage,
        ...(this.providerCode ? { providerCode: this.providerCode } : {}),
      },
    };
  }

  /**
   * Returns a response object for API endpoints
   */
  toResponse() {
    return new Response(JSON.stringify(this.toJSON()), {
      status: this.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * Payment provider configuration error
 */
export class PaymentConfigurationError extends PaymentError {
  constructor(message: string, providerCode?: string) {
    super({
      message,
      code: 'PAYMENT_CONFIGURATION_ERROR',
      statusCode: 500,
      providerCode,
      userMessage:
        'The payment system is not properly configured. Please try again later or contact support.',
    });
    this.name = 'PaymentConfigurationError';

    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, PaymentConfigurationError.prototype);
  }
}

/**
 * Payment validation error
 */
export class PaymentValidationError extends PaymentError {
  validationErrors: Record<string, string>;

  constructor(message: string, validationErrors: Record<string, string>, providerCode?: string) {
    super({
      message,
      code: 'PAYMENT_VALIDATION_ERROR',
      statusCode: 400,
      providerCode,
      userMessage:
        'There was a problem with your payment information. Please check your details and try again.',
    });
    this.name = 'PaymentValidationError';
    this.validationErrors = validationErrors;

    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, PaymentValidationError.prototype);
  }

  /**
   * Returns a JSON representation of the error
   */
  override toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors,
    };
  }
}

/**
 * Payment processing error
 */
export class PaymentProcessingError extends PaymentError {
  constructor(message: string, providerCode?: string, userMessage?: string) {
    super({
      message,
      code: 'PAYMENT_PROCESSING_ERROR',
      statusCode: 400,
      providerCode,
      userMessage:
        userMessage ||
        'There was an error processing your payment. Please try again or use a different payment method.',
    });
    this.name = 'PaymentProcessingError';

    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, PaymentProcessingError.prototype);
  }
}

/**
 * Payment declined error
 */
export class PaymentDeclinedError extends PaymentError {
  constructor(message: string, providerCode?: string, userMessage?: string) {
    super({
      message,
      code: 'PAYMENT_DECLINED',
      statusCode: 400,
      providerCode,
      userMessage:
        userMessage ||
        'Your payment was declined. Please try a different payment method or contact your bank.',
    });
    this.name = 'PaymentDeclinedError';

    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, PaymentDeclinedError.prototype);
  }
}

/**
 * Payment authorization required error
 */
export class PaymentAuthorizationError extends PaymentError {
  redirectUrl?: string;

  constructor(message: string, redirectUrl?: string, providerCode?: string) {
    super({
      message,
      code: 'PAYMENT_AUTHORIZATION_REQUIRED',
      statusCode: 402,
      providerCode,
      userMessage:
        'Your payment requires additional authorization. Please follow the instructions to complete the payment.',
    });
    this.name = 'PaymentAuthorizationError';
    this.redirectUrl = redirectUrl;

    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, PaymentAuthorizationError.prototype);
  }

  /**
   * Returns a JSON representation of the error
   */
  override toJSON() {
    return {
      ...super.toJSON(),
      ...(this.redirectUrl ? { redirectUrl: this.redirectUrl } : {}),
    };
  }
}

/**
 * Map provider error codes to user-friendly messages
 */
export const PROVIDER_ERROR_MESSAGES: Record<string, string> = {
  // Square error codes
  CARD_DECLINED: 'Your card was declined. Please try a different payment method.',
  CVV_FAILURE: "Your card's security code is incorrect. Please check and try again.",
  EXPIRED_CARD: 'Your card has expired. Please use a different card.',
  INSUFFICIENT_FUNDS: 'Your card has insufficient funds. Please use a different payment method.',
  INVALID_CARD: 'Your card information is invalid. Please check and try again.',
  INVALID_EXPIRATION: "Your card's expiration date is invalid. Please check and try again.",

  // Stripe error codes
  card_declined: 'Your card was declined. Please try a different payment method.',
  incorrect_cvc: "Your card's security code is incorrect. Please check and try again.",
  expired_card: 'Your card has expired. Please use a different card.',
  insufficient_funds: 'Your card has insufficient funds. Please use a different payment method.',
  invalid_card_number: 'Your card number is invalid. Please check and try again.',
  invalid_expiry_month: "Your card's expiration month is invalid. Please check and try again.",
  invalid_expiry_year: "Your card's expiration year is invalid. Please check and try again.",
  processing_error: 'An error occurred while processing your card. Please try again later.',
};

/**
 * Create appropriate error from provider error
 */
export function createPaymentErrorFromProvider(
  _provider: string,
  errorCode: string,
  message: string
): PaymentError {
  // Get user-friendly message if available
  const userMessage = PROVIDER_ERROR_MESSAGES[errorCode] || undefined;

  // Check for different error types based on error code
  if (
    errorCode === 'CARD_DECLINED' ||
    errorCode === 'card_declined' ||
    errorCode === 'INSUFFICIENT_FUNDS' ||
    errorCode === 'insufficient_funds'
  ) {
    return new PaymentDeclinedError(message, errorCode, userMessage);
  }

  if (
    errorCode === 'VERIFY_CVV' ||
    errorCode === 'VERIFY_AVS' ||
    errorCode === 'authentication_required' ||
    errorCode === 'requires_action'
  ) {
    return new PaymentAuthorizationError(message, undefined, errorCode);
  }

  if (
    errorCode === 'INVALID_CARD' ||
    errorCode === 'INVALID_EXPIRATION' ||
    errorCode === 'invalid_card_number' ||
    errorCode === 'invalid_expiry_month' ||
    errorCode === 'invalid_expiry_year' ||
    errorCode === 'incorrect_cvc'
  ) {
    const validationErrors: Record<string, string> = {};

    // Map error codes to form field names
    if (errorCode === 'INVALID_CARD' || errorCode === 'invalid_card_number') {
      validationErrors.cardNumber = 'Invalid card number';
    } else if (
      errorCode === 'INVALID_EXPIRATION' ||
      errorCode === 'invalid_expiry_month' ||
      errorCode === 'invalid_expiry_year'
    ) {
      validationErrors.expiryDate = 'Invalid expiration date';
    } else if (errorCode === 'incorrect_cvc') {
      validationErrors.cvv = 'Invalid security code';
    }

    return new PaymentValidationError(message, validationErrors, errorCode);
  }

  // Default to generic processing error
  return new PaymentProcessingError(message, errorCode, userMessage);
}
