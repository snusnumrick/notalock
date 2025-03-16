import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createOrderFromCheckout } from '../checkoutIntegration';
import { OrderStatus, PaymentStatus, type Order } from '../../../types';
import type { CheckoutSession } from '~/features/checkout/types/checkout.types';
import type { CartItem } from '~/features/cart/types/cart.types';

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  }),
}));

vi.mock('~/features/cart/api/cartService', () => ({
  CartService: vi.fn().mockImplementation(() => ({
    getCartItems: vi.fn(),
  })),
}));

vi.mock('../../orderService', () => ({
  getOrderService: vi.fn().mockResolvedValue({
    createOrder: vi.fn(),
  }),
}));

// Import mocked modules
import { CartService } from '~/features/cart/api/cartService';
import { getOrderService } from '../../orderService';

describe('Checkout Integration', () => {
  // Mock objects
  const mockCartItems: CartItem[] = [
    {
      id: 'cart-item-1',
      cart_id: 'cart-123',
      product_id: 'product-1',
      quantity: 2,
      price: 25,
      created_at: '2025-03-15T11:00:00Z',
      updated_at: '2025-03-15T11:00:00Z',
      product: {
        name: 'Product 1',
        sku: 'SKU1',
        image_url: 'image1.jpg',
      },
    },
    {
      id: 'cart-item-2',
      cart_id: 'cart-123',
      product_id: 'product-2',
      quantity: 1,
      price: 50,
      created_at: '2025-03-15T11:00:00Z',
      updated_at: '2025-03-15T11:00:00Z',
      product: {
        name: 'Product 2',
        sku: 'SKU2',
        image_url: 'image2.jpg',
      },
    },
  ];

  const mockCheckoutSession: CheckoutSession = {
    id: 'checkout-123',
    cartId: 'cart-123',
    userId: 'user-123',
    status: 'pending',
    shippingAddress: {
      name: 'Test User',
      line1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postal_code: '12345',
      country: 'US',
      email: 'test@example.com',
    },
    billingAddress: {
      name: 'Test User',
      line1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postal_code: '12345',
      country: 'US',
      email: 'test@example.com',
    },
    shippingMethod: 'standard',
    shippingOption: {
      id: 'standard',
      name: 'Standard Shipping',
      description: '3-5 business days',
      price: 10,
    },
    shippingCost: 10,
    tax: 5,
    subtotal: 100,
    total: 115,
    paymentInfo: {
      provider: 'stripe',
      type: 'card',
    },
    created_at: '2025-03-15T11:30:00Z',
    updated_at: '2025-03-15T11:30:00Z',
  };

  const mockOrder: Order = {
    id: 'order-123',
    orderNumber: 'NO-20250315-ABCD',
    userId: 'user-123',
    email: 'test@example.com',
    status: 'pending' as OrderStatus,
    paymentStatus: 'pending' as PaymentStatus,
    shippingCost: 10,
    taxAmount: 5,
    subtotalAmount: 100,
    totalAmount: 115,
    items: [
      {
        id: 'item-1',
        orderId: 'order-123',
        productId: 'product-1',
        name: 'Product 1',
        sku: 'SKU1',
        quantity: 2,
        unitPrice: 25,
        totalPrice: 50,
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
      {
        id: 'item-2',
        orderId: 'order-123',
        productId: 'product-2',
        name: 'Product 2',
        sku: 'SKU2',
        quantity: 1,
        unitPrice: 50,
        totalPrice: 50,
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
    ],
    createdAt: '2025-03-15T12:00:00Z',
    updatedAt: '2025-03-15T12:00:00Z',
  };

  // Mock service implementations
  const mockOrderService = {
    createOrder: vi.fn().mockResolvedValue(mockOrder),
  };

  const mockCartService = {
    getCartItems: vi.fn().mockResolvedValue(mockCartItems),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementations
    (CartService as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockCartService);
    (getOrderService as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockOrderService);
  });

  describe('createOrderFromCheckout', () => {
    it('should create an order from checkout session', async () => {
      // Arrange
      const paymentIntentId = 'pi-123';
      const paymentMethodId = 'pm-123';
      const paymentProvider = 'stripe';

      // Act
      const result = await createOrderFromCheckout(
        mockCheckoutSession,
        paymentIntentId,
        paymentMethodId,
        paymentProvider
      );

      // Assert
      expect(mockCartService.getCartItems).toHaveBeenCalledWith(mockCheckoutSession.cartId);
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockCheckoutSession.userId,
          email: mockCheckoutSession.shippingAddress?.email,
          cartId: mockCheckoutSession.cartId,
          items: mockCartItems,
          shippingAddress: mockCheckoutSession.shippingAddress,
          billingAddress: mockCheckoutSession.billingAddress,
          shippingMethod: mockCheckoutSession.shippingMethod,
          shippingCost: mockCheckoutSession.shippingCost,
          taxAmount: mockCheckoutSession.tax,
          subtotalAmount: mockCheckoutSession.subtotal,
          totalAmount: mockCheckoutSession.total,
          paymentIntentId,
          paymentMethodId,
          paymentProvider,
          checkoutSessionId: mockCheckoutSession.id,
        })
      );

      expect(result).toEqual(mockOrder);
    });

    it('should fall back to guest email if shipping address email is not available', async () => {
      // Arrange
      const checkoutSessionWithGuestEmail = {
        ...mockCheckoutSession,
        shippingAddress: {
          ...mockCheckoutSession.shippingAddress,
          email: undefined,
        },
        guestEmail: 'guest@example.com',
      };

      // Act
      await createOrderFromCheckout(checkoutSessionWithGuestEmail);

      // Assert
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'guest@example.com',
        })
      );
    });

    it('should use shipping address as billing address if not provided', async () => {
      // Arrange
      const checkoutSessionWithoutBilling = {
        ...mockCheckoutSession,
        billingAddress: undefined,
      };

      // Act
      await createOrderFromCheckout(checkoutSessionWithoutBilling);

      // Assert
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          billingAddress: checkoutSessionWithoutBilling.shippingAddress,
        })
      );
    });

    it('should throw an error if cart has no items', async () => {
      // Arrange
      mockCartService.getCartItems.mockResolvedValue([]);

      // Act & Assert
      await expect(createOrderFromCheckout(mockCheckoutSession)).rejects.toThrow(
        'No items found in the cart'
      );

      expect(mockOrderService.createOrder).not.toHaveBeenCalled();
    });
  });
});
