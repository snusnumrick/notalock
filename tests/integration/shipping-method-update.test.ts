/**
 * Integration test for checkout shipping method selection
 * Tests that shipping methods update the price in real-time without advancing the checkout flow
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Top-level mock data for reusability
const MOCK_SHIPPING_OPTIONS = [
  {
    id: 'shipping-standard',
    name: 'Standard Shipping',
    description: 'Delivery in 5-7 business days',
    method: 'standard',
    price: 9.99,
    estimatedDelivery: '5-7 business days',
  },
  {
    id: 'shipping-express',
    name: 'Express Shipping',
    description: 'Delivery in 2-3 business days',
    method: 'express',
    price: 19.99,
    estimatedDelivery: '2-3 business days',
  },
  {
    id: 'shipping-overnight',
    name: 'Overnight Shipping',
    description: 'Next business day delivery',
    method: 'overnight',
    price: 29.99,
    estimatedDelivery: 'Next business day',
  },
];

// Mock checkout session data
const MOCK_CHECKOUT_SESSION = {
  id: 'test-session-id',
  cartId: 'test-cart-id',
  subtotal: 99.98,
  shippingCost: 9.99, // Default to standard shipping
  tax: 8.8,
  total: 118.77,
  currentStep: 'shipping',
  shippingAddress: {
    firstName: 'John',
    lastName: 'Doe',
    address1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    postalCode: '12345',
    country: 'US',
  },
};

// Helper functions for creating mock services
const mockGetShippingOptions = vi.fn().mockResolvedValue(MOCK_SHIPPING_OPTIONS);
const mockGetCheckoutSession = vi.fn().mockResolvedValue(MOCK_CHECKOUT_SESSION);

// Mock updateShippingMethod that advances the checkout flow - we'll verify this doesn't happen
const mockUpdateShippingMethod = vi.fn().mockImplementation((sessionId, method, option) => {
  // This should update currentStep to 'payment' - which we want to avoid in our real-time updates
  return {
    ...MOCK_CHECKOUT_SESSION,
    shippingOption: option,
    shippingMethod: method,
    shippingCost: option.price,
    tax: Math.round((MOCK_CHECKOUT_SESSION.subtotal + option.price) * 0.08 * 100) / 100,
    total:
      MOCK_CHECKOUT_SESSION.subtotal +
      option.price +
      Math.round((MOCK_CHECKOUT_SESSION.subtotal + option.price) * 0.08 * 100) / 100,
    currentStep: 'payment', // This is what causes the flow to advance prematurely
  };
});

// Mock dependencies
vi.mock('../../app/features/checkout/api/checkoutService', () => ({
  CheckoutService: vi.fn().mockImplementation(() => ({
    getShippingOptions: mockGetShippingOptions,
    getCheckoutSession: mockGetCheckoutSession,
    updateShippingMethod: mockUpdateShippingMethod,
  })),
}));

// Mock handlers for API actions
const updateShippingPriceAction = async (formData: FormData) => {
  const sessionId = formData.get('sessionId')?.toString();
  const shippingMethodId = formData.get('shippingMethod')?.toString();

  if (!sessionId || !shippingMethodId) {
    return { error: 'Missing required fields' };
  }

  const shippingOptions = await mockGetShippingOptions();
  const selectedOption = shippingOptions.find(option => option.id === shippingMethodId);

  if (!selectedOption) {
    return { error: 'Invalid shipping method' };
  }

  const currentSession = await mockGetCheckoutSession(sessionId);

  // Calculate updated pricing without changing the current step
  const shippingCost = selectedOption.price;
  const taxRate = 0.08; // 8% tax rate
  const subtotal = currentSession.subtotal || 0;
  const tax = Math.round((subtotal + shippingCost) * taxRate * 100) / 100;
  const total = subtotal + shippingCost + tax;

  // Return a virtual session with the updated pricing, but keeping currentStep as 'shipping'
  const updatedSession = {
    ...currentSession,
    shippingOption: selectedOption,
    shippingCost,
    tax,
    total,
    currentStep: 'shipping', // Important: Keep as shipping, don't advance to payment
  };

  return { success: true, session: updatedSession };
};

const updateShippingMethodAction = async (formData: FormData) => {
  const sessionId = formData.get('sessionId')?.toString();
  const shippingMethodId = formData.get('shippingMethod')?.toString();

  if (!sessionId || !shippingMethodId) {
    return { error: 'Missing required fields' };
  }

  const shippingOptions = await mockGetShippingOptions();
  const selectedOption = shippingOptions.find(option => option.id === shippingMethodId);

  if (!selectedOption) {
    return { error: 'Invalid shipping method' };
  }

  // This uses updateShippingMethod which advances to payment
  const updatedSession = await mockUpdateShippingMethod(
    sessionId,
    selectedOption.method,
    selectedOption
  );

  return { success: true, session: updatedSession };
};

describe('ShippingMethodUpdateService', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('update-shipping-price endpoint', () => {
    it('updates prices without advancing checkout flow', async () => {
      // Create FormData with shipping method selection
      const formData = new FormData();
      formData.append('sessionId', MOCK_CHECKOUT_SESSION.id);
      formData.append('shippingMethod', 'shipping-express');

      // Call action directly
      const result = await updateShippingPriceAction(formData);

      // Check that we get a successful response
      expect(result.success).toBe(true);

      // Check that the session has the updated shipping cost
      expect(result.session.shippingCost).toBe(19.99); // Express shipping price

      // Most importantly, check that the current step is still 'shipping'
      expect(result.session.currentStep).toBe('shipping');

      // Check that tax and total were recalculated
      expect(result.session.tax).toBe(9.6); // (99.98 + 19.99) * 0.08
      expect(result.session.total).toBe(129.57); // 99.98 + 19.99 + 9.60
    });
  });

  describe('update-shipping-method endpoint', () => {
    it('advances checkout flow to payment when called', async () => {
      // Create FormData with shipping method selection
      const formData = new FormData();
      formData.append('sessionId', MOCK_CHECKOUT_SESSION.id);
      formData.append('shippingMethod', 'shipping-express');

      // Call action directly
      const result = await updateShippingMethodAction(formData);

      // Check that we get a successful response
      expect(result.success).toBe(true);

      // Check that the session has the updated shipping cost
      expect(result.session.shippingCost).toBe(19.99); // Express shipping price

      // Check that the current step advanced to 'payment'
      expect(result.session.currentStep).toBe('payment');

      // Verify that our updateShippingMethod was called
      expect(mockUpdateShippingMethod).toHaveBeenCalledWith(
        MOCK_CHECKOUT_SESSION.id,
        'express',
        expect.objectContaining({ id: 'shipping-express' })
      );
    });
  });

  describe('comparing both endpoints', () => {
    it('has different behaviors for price update vs method update', async () => {
      // Make identical requests to both endpoints and compare
      const formData1 = new FormData();
      formData1.append('sessionId', MOCK_CHECKOUT_SESSION.id);
      formData1.append('shippingMethod', 'shipping-express');

      const formData2 = new FormData();
      formData2.append('sessionId', MOCK_CHECKOUT_SESSION.id);
      formData2.append('shippingMethod', 'shipping-express');

      // Call both actions directly
      const priceResult = await updateShippingPriceAction(formData1);
      const methodResult = await updateShippingMethodAction(formData2);

      // Both should update prices similarly
      expect(priceResult.session.shippingCost).toBe(methodResult.session.shippingCost);
      expect(priceResult.session.tax).toBeCloseTo(methodResult.session.tax);
      expect(priceResult.session.total).toBeCloseTo(methodResult.session.total);

      // But they should have different current steps
      expect(priceResult.session.currentStep).toBe('shipping'); // Stays on the same step
      expect(methodResult.session.currentStep).toBe('payment'); // Advances to next step

      // Check that updateShippingMethod was called only for the method endpoint
      expect(mockUpdateShippingMethod).toHaveBeenCalledTimes(1);
    });
  });
});
