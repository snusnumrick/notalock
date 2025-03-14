import { json, redirect } from '@remix-run/node';
import type { ActionFunctionArgs } from '@remix-run/node';
import { createSupabaseClient } from '~/server/services/supabase.server';
import { CheckoutService } from './checkoutService';
import type { Address, ShippingOption, PaymentInfo } from '../types/checkout.types';
import { PaymentMethodType } from '~/features/payment';
import { setCookieBrowser } from '~/utils/cookieUtils';
import { ANONYMOUS_CART_COOKIE_NAME } from '~/features/cart/constants';

/**
 * Validates an address form submission
 */
function validateAddress(formData: FormData) {
  const errors: Partial<Record<keyof Address, string>> = {};

  // Required fields
  const requiredFields: (keyof Address)[] = [
    'firstName',
    'lastName',
    'phone',
    'address1',
    'city',
    'state',
    'postalCode',
    'country',
  ];

  for (const field of requiredFields) {
    if (!formData.get(field) || formData.get(field)?.toString().trim() === '') {
      errors[field] = 'This field is required';
    }
  }

  // Email validation
  const email = formData.get('email')?.toString();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation
  const phone = formData.get('phone')?.toString();
  if (phone && !/^\+?[0-9\s\-()]+$/.test(phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  // Postal code validation
  const postalCode = formData.get('postalCode')?.toString();
  if (postalCode && !/^[0-9a-zA-Z\s-]+$/.test(postalCode)) {
    errors.postalCode = 'Please enter a valid postal code';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Handles information step form submission
 */
export async function checkoutInfoAction({ request }: ActionFunctionArgs) {
  console.log('CHECKOUT INFO ACTION IMPLEMENTATION CALLED');
  const response = new Response();
  const formData = await request.formData();
  const supabase = createSupabaseClient(request, response);

  // Log the form data to help with debugging
  console.log(
    'Form data received:',
    [...formData.entries()].map(([key, value]) =>
      key === 'sessionId' || key === 'cartId' ? `${key}: ${value}` : `${key}: [value hidden]`
    )
  );

  // Validate form data
  const validationErrors = validateAddress(formData);
  if (validationErrors) {
    console.log('Validation errors:', validationErrors);
    return json({ errors: validationErrors }, { status: 400, headers: response.headers });
  }

  try {
    // Get session ID and cart ID
    const sessionId = formData.get('sessionId')?.toString();
    const cartId = formData.get('cartId')?.toString();

    if (!cartId) {
      return json({ error: 'Missing cart ID' }, { status: 400, headers: response.headers });
    }

    const checkoutService = new CheckoutService(supabase);

    // Get checkout session or create new one
    let checkoutSession;
    if (sessionId) {
      try {
        // Try to get existing session
        checkoutSession = await checkoutService.getCheckoutSession(sessionId);
      } catch (sessionError) {
        console.error('Failed to retrieve checkout session, creating a new one:', sessionError);
        // If getting the session fails, create a new one
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        checkoutSession = await checkoutService.getOrCreateCheckoutSession(cartId, userId);
      }
    } else {
      // Get user session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      checkoutSession = await checkoutService.getOrCreateCheckoutSession(cartId, userId);
    }

    // Construct address object
    const address: Address = {
      firstName: formData.get('firstName')?.toString() || '',
      lastName: formData.get('lastName')?.toString() || '',
      email: formData.get('email')?.toString(),
      phone: formData.get('phone')?.toString() || '',
      address1: formData.get('address1')?.toString() || '',
      address2: formData.get('address2')?.toString(),
      city: formData.get('city')?.toString() || '',
      state: formData.get('state')?.toString() || '',
      postalCode: formData.get('postalCode')?.toString() || '',
      country: formData.get('country')?.toString() || '',
    };

    // If user is not logged in, get guest email
    const guestEmail = formData.get('email')?.toString();

    // Update checkout session with shipping address
    const updatedSession = await checkoutService.updateShippingAddress(
      checkoutSession.id,
      address,
      guestEmail
    );

    // Redirect to shipping method step
    return redirect(`/checkout/shipping?session=${updatedSession.id}`, {
      headers: response.headers,
    });
  } catch (error) {
    console.error('Error in checkoutInfoAction:', error);
    return json(
      { error: 'An error occurred while processing your information' },
      { status: 500, headers: response.headers }
    );
  }
}

/**
 * Handles shipping method step form submission
 */
export async function checkoutShippingAction({ request }: ActionFunctionArgs) {
  const response = new Response();
  const formData = await request.formData();
  const supabase = createSupabaseClient(request, response);

  try {
    // Get session ID and shipping method
    const sessionId = formData.get('sessionId')?.toString();
    const shippingMethodId = formData.get('shippingMethod')?.toString();

    console.log(
      `Processing shipping method action with session ID: ${sessionId} and method: ${shippingMethodId}`
    );

    if (!sessionId || !shippingMethodId) {
      console.log('Missing required fields in shipping action');
      return json({ error: 'Missing required fields' }, { status: 400, headers: response.headers });
    }

    const checkoutService = new CheckoutService(supabase);

    // Get shipping options to find the selected one
    const shippingOptions: ShippingOption[] = await checkoutService.getShippingOptions();
    console.log(
      'Found shipping options:',
      shippingOptions.map(o => o.id)
    );
    const selectedOption = shippingOptions.find(option => option.id === shippingMethodId);

    if (!selectedOption) {
      console.log(`Selected shipping method ${shippingMethodId} not found in available options`);
      return json({ error: 'Invalid shipping method' }, { status: 400, headers: response.headers });
    }

    console.log(`Selected shipping option: ${selectedOption.id} (${selectedOption.name})`);

    // Update checkout session with shipping method
    console.log(`Calling updateShippingMethod for session ${sessionId}`);
    const updatedSession = await checkoutService.updateShippingMethod(
      sessionId,
      selectedOption.method,
      selectedOption
    );

    console.log(`Got updatedSession:`, {
      id: updatedSession.id,
      currentStep: updatedSession.currentStep,
      cartId: updatedSession.cartId,
    });

    // Redirect to payment step
    console.log(`Redirecting to /checkout/payment?session=${updatedSession.id}`);
    return redirect(`/checkout/payment?session=${updatedSession.id}`, {
      headers: response.headers,
    });
  } catch (error) {
    console.error('Error in checkoutShippingAction:', error);

    // Check if this is already a Response object
    if (error instanceof Response) {
      throw error;
    }

    // Even if an error occurs, try to redirect to the payment page gracefully
    const sessionId = formData.get('sessionId')?.toString();
    if (sessionId) {
      try {
        console.log(`Attempting fallback redirect to payment page with session ID: ${sessionId}`);
        return redirect(`/checkout/payment?session=${sessionId}`, {
          headers: response.headers,
        });
      } catch (redirectError) {
        console.error('Failed to redirect after error:', redirectError);
      }
    }

    // If specific error is recognized, return a JSON response
    if (error instanceof Error) {
      return json(
        {
          error: 'An error occurred while processing shipping method',
          details: error.message,
        },
        { status: 400, headers: response.headers }
      );
    }

    // For unknown errors, throw a Response with 500 status
    throw new Response('An unexpected error occurred while processing shipping method', {
      status: 500,
      statusText: 'Server Error',
      headers: response.headers,
    });
  }
}

/**
 * Validates payment information
 */
function validatePaymentInfo(formData: FormData) {
  const errors: Record<string, string> = {};
  const paymentType = formData.get('paymentType')?.toString();

  if (!paymentType) {
    errors.paymentType = 'Payment method is required';
    return errors;
  }

  // If not using same address for billing, validate billing address
  const sameAsShipping = formData.get('sameAsShipping') === 'on';
  if (!sameAsShipping) {
    // Create a new FormData with just the billing address fields
    const billingFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('billing_')) {
        billingFormData.append(key.replace('billing_', ''), value);
      }
    }

    const addressErrors = validateAddress(billingFormData);
    if (addressErrors) {
      for (const [key, value] of Object.entries(addressErrors)) {
        errors[`billing_${key}`] = value;
      }
    }
  }

  // For credit card payments
  if (paymentType === 'credit_card') {
    const cardholderName = formData.get('cardholderName')?.toString();
    if (!cardholderName || cardholderName.trim() === '') {
      errors.cardholderName = 'Cardholder name is required';
    }

    // Note: We don't validate actual card details here because they'll be handled by Square SDK
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Handles payment step form submission
 */
export async function checkoutPaymentAction({ request }: ActionFunctionArgs) {
  const response = new Response();
  const formData = await request.formData();
  const supabase = createSupabaseClient(request, response);

  // Validate form data
  const validationErrors = validatePaymentInfo(formData);
  if (validationErrors) {
    return json({ errors: validationErrors }, { status: 400, headers: response.headers });
  }

  try {
    // Get session ID and payment details
    const sessionId = formData.get('sessionId')?.toString();
    const paymentType = formData.get('paymentType')?.toString() as PaymentMethodType;
    const paymentProvider = formData.get('paymentProvider')?.toString() || 'mock';
    const sameAsShipping = formData.get('sameAsShipping') === 'on';

    if (!sessionId || !paymentType) {
      return json({ error: 'Missing required fields' }, { status: 400, headers: response.headers });
    }

    const checkoutService = new CheckoutService(supabase);

    // Prepare payment info
    const paymentInfo: PaymentInfo = {
      type: paymentType,
      cardholderName: formData.get('cardholderName')?.toString(),
      billingAddressSameAsShipping: sameAsShipping,
      // Include payment method ID if integrating with Square
      paymentMethodId: formData.get('paymentMethodId')?.toString(),
      provider: paymentProvider,
    };

    // If not using same address, construct billing address
    if (!sameAsShipping) {
      const billingAddress: Address = {
        firstName: formData.get('billing_firstName')?.toString() || '',
        lastName: formData.get('billing_lastName')?.toString() || '',
        phone: formData.get('billing_phone')?.toString() || '',
        address1: formData.get('billing_address1')?.toString() || '',
        address2: formData.get('billing_address2')?.toString(),
        city: formData.get('billing_city')?.toString() || '',
        state: formData.get('billing_state')?.toString() || '',
        postalCode: formData.get('billing_postalCode')?.toString() || '',
        country: formData.get('billing_country')?.toString() || '',
      };
      paymentInfo.billingAddress = billingAddress;
    }

    // Update checkout session with payment info
    const updatedSession = await checkoutService.updatePaymentInfo(sessionId, paymentInfo);

    // Redirect to review step
    return redirect(`/checkout/review?session=${updatedSession.id}`, {
      headers: response.headers,
    });
  } catch (error) {
    console.error('Error in checkoutPaymentAction:', error);
    return json(
      { error: 'An error occurred while processing payment information' },
      { status: 500, headers: response.headers }
    );
  }
}

/**
 * Handles review step form submission (place order)
 */
export async function checkoutPlaceOrderAction({ request }: ActionFunctionArgs) {
  const response = new Response();
  const formData = await request.formData();
  const supabase = createSupabaseClient(request, response);

  try {
    // Get session ID
    const sessionId = formData.get('sessionId')?.toString();

    if (!sessionId) {
      return json({ error: 'Missing session ID' }, { status: 400, headers: response.headers });
    }

    const checkoutService = new CheckoutService(supabase);

    // Process payment and create order
    // For now, we'll skip actual payment processing since we don't have Square integration yet
    const order = await checkoutService.createOrder(sessionId);

    // Add multiple approaches to clear the cart on the client side
    // 1. Set a specific cookie that will be detected by client code
    setCookieBrowser(ANONYMOUS_CART_COOKIE_NAME, 'true', { path: '/', max_age: 300 });

    // 2. Add a special header that the client can detect
    response.headers.append('X-Clear-Cart', 'true');

    // 3. Create a CartService instance to clear the cart directly
    // This ensures the DB operation completed successfully
    try {
      const { CartService } = await import('../../../features/cart/api/cartService');
      const cartService = new CartService(supabase);
      await cartService.clearCart();
      console.log('Successfully cleared cart after order placement');
    } catch (cartClearError) {
      console.error('Error clearing cart after order placement:', cartClearError);
      // Continue even if this fails since the order was created
    }

    // Redirect to confirmation page
    return redirect(`/checkout/confirmation?order=${order.id}`, {
      headers: response.headers,
    });
  } catch (error) {
    console.error('Error in checkoutPlaceOrderAction:', error);
    return json(
      { error: 'An error occurred while placing your order' },
      { status: 500, headers: response.headers }
    );
  }
}
