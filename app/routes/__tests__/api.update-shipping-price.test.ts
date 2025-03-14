/**
 * Unit test for api.update-shipping-price endpoint
 * Tests real-time shipping price updates without checkout flow advancement
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { action } from '../api.update-shipping-price';

// Mock required dependencies
vi.mock('@remix-run/node', () => ({
  json: vi.fn(data => data),
}));

vi.mock('../../server/services/supabase.server', () => ({
  createSupabaseClient: vi.fn(() => ({})),
}));

// Top-level mock data
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
];

// Mock checkout session
const MOCK_SESSION = {
  id: 'test-session',
  cartId: 'test-cart',
  subtotal: 100,
  shippingCost: 9.99,
  tax: 8.8,
  total: 118.79,
  currentStep: 'shipping',
};

// Mock CheckoutService
vi.mock('../../features/checkout/api/checkoutService', () => ({
  CheckoutService: vi.fn().mockImplementation(() => ({
    getShippingOptions: vi.fn().mockResolvedValue(MOCK_SHIPPING_OPTIONS),
    getCheckoutSession: vi.fn().mockResolvedValue(MOCK_SESSION),
  })),
}));

describe('UpdateShippingPriceAPI', () => {
  // Test setup variables
  let mockRequest: Request;
  let mockFormData: FormData;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock form data
    mockFormData = new FormData();
    mockFormData.append('sessionId', 'test-session');
    mockFormData.append('shippingMethod', 'shipping-express');

    // Create a mock request
    mockRequest = new Request('https://example.com/api/update-shipping-price', {
      method: 'POST',
      body: mockFormData,
    });

    // Mock formData method
    mockRequest.formData = vi.fn().mockResolvedValue(mockFormData);
  });

  describe('price calculations', () => {
    it('calculates correct prices when updating shipping method', async () => {
      // Call the action
      const result = await action({ request: mockRequest, params: {}, context: {} });

      // Check that the response contains the expected data
      expect(result.success).toBe(true);
      expect(result.session).toBeDefined();

      // Check price calculations
      expect(result.session.shippingCost).toBe(19.99); // Express shipping

      // Check that currentStep remains as 'shipping'
      expect(result.session.currentStep).toBe('shipping');
    });
  });

  describe('error handling', () => {
    it('handles missing parameters', async () => {
      // Create a request with missing parameters
      const emptyFormData = new FormData();
      const invalidRequest = new Request('https://example.com/api/update-shipping-price', {
        method: 'POST',
        body: emptyFormData,
      });

      // Mock formData method
      invalidRequest.formData = vi.fn().mockResolvedValue(emptyFormData);

      // Call the action
      const result = await action({ request: invalidRequest, params: {}, context: {} });

      // Check error response
      expect(result.error).toBeDefined();
      expect(result.success).toBeUndefined();
    });

    it('handles invalid shipping method ID', async () => {
      // Create a request with invalid shipping method
      const invalidFormData = new FormData();
      invalidFormData.append('sessionId', 'test-session');
      invalidFormData.append('shippingMethod', 'non-existent-method');

      const invalidRequest = new Request('https://example.com/api/update-shipping-price', {
        method: 'POST',
        body: invalidFormData,
      });

      // Mock formData method
      invalidRequest.formData = vi.fn().mockResolvedValue(invalidFormData);

      // Call the action
      const result = await action({ request: invalidRequest, params: {}, context: {} });

      // Check error response
      expect(result.error).toBeDefined();
      expect(result.success).toBeUndefined();
    });
  });
});
