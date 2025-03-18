import {
  PaymentError,
  PaymentConfigurationError,
  PaymentValidationError,
  PaymentProcessingError,
  PaymentDeclinedError,
  PaymentAuthorizationError,
  createPaymentErrorFromProvider,
  PROVIDER_ERROR_MESSAGES,
} from '../PaymentError';

describe('PaymentError', () => {
  test('should create a basic payment error', () => {
    const error = new PaymentError({
      message: 'Test error message',
      code: 'TEST_ERROR',
      statusCode: 400,
      userMessage: 'User-friendly message',
    });

    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.userMessage).toBe('User-friendly message');
    expect(error instanceof PaymentError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  test('should create a payment error with default values', () => {
    const error = new PaymentError({
      message: 'Test error message',
    });

    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('PAYMENT_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.userMessage).toBe('An error occurred while processing your payment.');
  });

  test('should convert payment error to JSON', () => {
    const error = new PaymentError({
      message: 'Test error message',
      code: 'TEST_ERROR',
      providerCode: 'PROVIDER_CODE',
    });

    const json = error.toJSON();
    expect(json).toEqual({
      error: {
        code: 'TEST_ERROR',
        message: 'Test error message',
        userMessage: 'An error occurred while processing your payment.',
        providerCode: 'PROVIDER_CODE',
      },
    });
  });

  test('should create a Response from payment error', () => {
    const error = new PaymentError({
      message: 'Test error message',
      statusCode: 403,
    });

    const response = error.toResponse();
    expect(response instanceof Response).toBe(true);
    expect(response.status).toBe(403);
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});

describe('PaymentConfigurationError', () => {
  test('should create a configuration error', () => {
    const error = new PaymentConfigurationError('Missing API key', 'API_KEY_MISSING');

    expect(error.message).toBe('Missing API key');
    expect(error.code).toBe('PAYMENT_CONFIGURATION_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.providerCode).toBe('API_KEY_MISSING');
    expect(error.userMessage).toBe(
      'The payment system is not properly configured. Please try again later or contact support.'
    );
    expect(error instanceof PaymentConfigurationError).toBe(true);
    expect(error instanceof PaymentError).toBe(true);
  });
});

describe('PaymentValidationError', () => {
  test('should create a validation error with validation errors', () => {
    const validationErrors = {
      cardNumber: 'Card number is invalid',
      expiryDate: 'Expiry date is invalid',
    };

    const error = new PaymentValidationError('Validation failed', validationErrors, 'INVALID_CARD');

    expect(error.message).toBe('Validation failed');
    expect(error.code).toBe('PAYMENT_VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.providerCode).toBe('INVALID_CARD');
    expect(error.userMessage).toBe(
      'There was a problem with your payment information. Please check your details and try again.'
    );
    expect(error.validationErrors).toEqual(validationErrors);
    expect(error instanceof PaymentValidationError).toBe(true);
    expect(error instanceof PaymentError).toBe(true);
  });

  test('should include validation errors in JSON output', () => {
    const validationErrors = {
      cardNumber: 'Card number is invalid',
    };

    const error = new PaymentValidationError('Validation failed', validationErrors);
    const json = error.toJSON();

    expect(json.validationErrors).toEqual(validationErrors);
  });
});

describe('PaymentProcessingError', () => {
  test('should create a processing error', () => {
    const error = new PaymentProcessingError('Processing failed', 'PROCESSING_ERROR');

    expect(error.message).toBe('Processing failed');
    expect(error.code).toBe('PAYMENT_PROCESSING_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.providerCode).toBe('PROCESSING_ERROR');
    expect(error.userMessage).toBe(
      'There was an error processing your payment. Please try again or use a different payment method.'
    );
    expect(error instanceof PaymentProcessingError).toBe(true);
    expect(error instanceof PaymentError).toBe(true);
  });

  test('should create a processing error with custom user message', () => {
    const error = new PaymentProcessingError(
      'Processing failed',
      'PROCESSING_ERROR',
      'Custom user message'
    );

    expect(error.userMessage).toBe('Custom user message');
  });
});

describe('PaymentDeclinedError', () => {
  test('should create a declined error', () => {
    const error = new PaymentDeclinedError('Payment declined', 'CARD_DECLINED');

    expect(error.message).toBe('Payment declined');
    expect(error.code).toBe('PAYMENT_DECLINED');
    expect(error.statusCode).toBe(400);
    expect(error.providerCode).toBe('CARD_DECLINED');
    expect(error.userMessage).toBe(
      'Your payment was declined. Please try a different payment method or contact your bank.'
    );
    expect(error instanceof PaymentDeclinedError).toBe(true);
    expect(error instanceof PaymentError).toBe(true);
  });

  test('should create a declined error with custom user message', () => {
    const error = new PaymentDeclinedError(
      'Payment declined',
      'CARD_DECLINED',
      'Custom user message'
    );

    expect(error.userMessage).toBe('Custom user message');
  });
});

describe('PaymentAuthorizationError', () => {
  test('should create an authorization error', () => {
    const error = new PaymentAuthorizationError(
      'Authorization required',
      'https://example.com/auth',
      'VERIFY_CVV'
    );

    expect(error.message).toBe('Authorization required');
    expect(error.code).toBe('PAYMENT_AUTHORIZATION_REQUIRED');
    expect(error.statusCode).toBe(402);
    expect(error.providerCode).toBe('VERIFY_CVV');
    expect(error.redirectUrl).toBe('https://example.com/auth');
    expect(error.userMessage).toBe(
      'Your payment requires additional authorization. Please follow the instructions to complete the payment.'
    );
    expect(error instanceof PaymentAuthorizationError).toBe(true);
    expect(error instanceof PaymentError).toBe(true);
  });

  test('should include redirectUrl in JSON output if present', () => {
    const error = new PaymentAuthorizationError(
      'Authorization required',
      'https://example.com/auth'
    );

    const json = error.toJSON();
    expect(json.redirectUrl).toBe('https://example.com/auth');
  });

  test('should not include redirectUrl in JSON output if not present', () => {
    const error = new PaymentAuthorizationError('Authorization required');

    const json = error.toJSON();
    expect(json.redirectUrl).toBeUndefined();
  });
});

describe('createPaymentErrorFromProvider', () => {
  test('should create a PaymentDeclinedError for declined cards', () => {
    const error = createPaymentErrorFromProvider('stripe', 'card_declined', 'Card declined');
    expect(error instanceof PaymentDeclinedError).toBe(true);
  });

  test('should create a PaymentAuthorizationError for authorization required', () => {
    const error = createPaymentErrorFromProvider(
      'stripe',
      'authentication_required',
      'Auth required'
    );
    expect(error instanceof PaymentAuthorizationError).toBe(true);
  });

  test('should create a PaymentValidationError for invalid card details', () => {
    const error = createPaymentErrorFromProvider('stripe', 'invalid_card_number', 'Invalid card');
    expect(error instanceof PaymentValidationError).toBe(true);
    expect((error as PaymentValidationError).validationErrors).toHaveProperty('cardNumber');
  });

  test('should create a PaymentValidationError for invalid expiry date', () => {
    const error = createPaymentErrorFromProvider(
      'stripe',
      'invalid_expiry_month',
      'Invalid expiry'
    );
    expect(error instanceof PaymentValidationError).toBe(true);
    expect((error as PaymentValidationError).validationErrors).toHaveProperty('expiryDate');
  });

  test('should create a PaymentValidationError for invalid security code', () => {
    const error = createPaymentErrorFromProvider('stripe', 'incorrect_cvc', 'Invalid CVC');
    expect(error instanceof PaymentValidationError).toBe(true);
    expect((error as PaymentValidationError).validationErrors).toHaveProperty('cvv');
  });

  test('should create a PaymentProcessingError for other error codes', () => {
    const error = createPaymentErrorFromProvider('stripe', 'unknown_error', 'Unknown error');
    expect(error instanceof PaymentProcessingError).toBe(true);
  });

  test('should use user-friendly message if available', () => {
    const errorCode = 'card_declined';
    const error = createPaymentErrorFromProvider('stripe', errorCode, 'Card declined');
    expect(error.userMessage).toBe(PROVIDER_ERROR_MESSAGES[errorCode]);
  });
});

describe('PROVIDER_ERROR_MESSAGES', () => {
  test('should contain user-friendly messages for common error codes', () => {
    expect(PROVIDER_ERROR_MESSAGES['CARD_DECLINED']).toBeDefined();
    expect(PROVIDER_ERROR_MESSAGES['card_declined']).toBeDefined();
    expect(PROVIDER_ERROR_MESSAGES['INVALID_CARD']).toBeDefined();
    expect(PROVIDER_ERROR_MESSAGES['incorrect_cvc']).toBeDefined();
  });
});
