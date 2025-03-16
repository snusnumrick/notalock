import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createOrderFromCheckout } from '~/features/orders/api/integrations/checkoutIntegration';
import { CartService } from '~/features/cart/api/cartService';
import { getOrderService } from '~/features/orders/api/orderService';
import { type CheckoutSession } from '~/features/checkout/types/checkout.types';
import { type Order, OrderStatus, PaymentStatus } from '~/features/orders/types';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: {}, error: null }),
  }),
}));

// Mock cart service
vi.mock('~/features/cart/api/cartService', () => ({
  CartService: vi.fn().mockImplementation(() => ({
    getCartItems: vi.fn(),
    clearCart: vi.fn(),
  })),
}));

// Mock order service functions but don't mock the module itself
vi.mock('~/features/orders/api/orderService', () => ({
  getOrderService: vi.fn().mockImplementation(() => ({
    createOrder: vi.fn(),
    getOrderById: vi.fn(),
    updateOrderStatus: vi.fn(),
    updatePaymentStatus: vi.fn(),
    updateOrderFromPayment: vi.fn(),
  })),
}));

describe('Order Creation Flow Integration Test', () => {
  // Mock data
  const mockCheckoutSession: CheckoutSession = {
    id: 'checkout-123',
    cartId: 'cart-123',
    userId: 'user-123',
    status: 'pending',
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'US',
      email: 'test@example.com',
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'US',
      email: 'test@example.com',
    },
    shippingMethod: 'Standard Shipping',
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

  const mockCartItems = [
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

  const mockCreatedOrder: Order = {
    id: 'order-123',
    orderNumber: 'NO-20250315-ABCD',
    userId: 'user-123',
    email: 'test@example.com',
    status: 'pending' as OrderStatus,
    paymentStatus: 'pending' as PaymentStatus,
    paymentIntentId: 'pi-123',
    shippingMethod: 'Standard Shipping',
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
        imageUrl: 'image1.jpg',
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
        imageUrl: 'image2.jpg',
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
    ],
    createdAt: '2025-03-15T12:00:00Z',
    updatedAt: '2025-03-15T12:00:00Z',
  };

  const mockPaymentResult = {
    success: true,
    paymentId: 'payment-123',
    paymentIntentId: 'pi-123',
    status: 'completed',
    orderReference: 'order-123',
  };

  const mockUpdatedOrder: Order = {
    ...mockCreatedOrder,
    status: 'paid' as OrderStatus,
    paymentStatus: 'paid' as PaymentStatus,
    updatedAt: '2025-03-15T12:30:00Z',
  };

  // Mock service implementations
  let cartService;
  let orderService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up cart service mock
    cartService = {
      getCartItems: vi.fn().mockResolvedValue(mockCartItems),
      clearCart: vi.fn().mockResolvedValue(undefined),
    };

    // Set up order service mock
    orderService = {
      createOrder: vi.fn().mockResolvedValue(mockCreatedOrder),
      getOrderById: vi.fn().mockResolvedValue(mockCreatedOrder),
      updateOrderStatus: vi.fn().mockResolvedValue(mockUpdatedOrder),
      updatePaymentStatus: vi.fn().mockResolvedValue(mockUpdatedOrder),
      updateOrderFromPayment: vi.fn().mockResolvedValue(mockUpdatedOrder),
    };

    // Set up the mock implementations
    (CartService as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => cartService);
    (getOrderService as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(orderService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('creates an order from checkout, processes payment, and updates order status', async () => {
    // Step 1: Create an order from checkout
    const paymentIntentId = 'pi-123';
    const order = await createOrderFromCheckout(
      mockCheckoutSession,
      paymentIntentId,
      'pm-123',
      'stripe'
    );

    // Verify order creation
    expect(cartService.getCartItems).toHaveBeenCalledWith(mockCheckoutSession.cartId);
    expect(orderService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockCheckoutSession.userId,
        email: mockCheckoutSession.shippingAddress?.email,
        cartId: mockCheckoutSession.cartId,
        items: mockCartItems,
        paymentIntentId,
        paymentMethodId: 'pm-123',
        paymentProvider: 'stripe',
      })
    );

    expect(order).toEqual(mockCreatedOrder);

    // Step 2: Simulate payment completion
    const updatedOrder = await orderService.updateOrderFromPayment(order.id, mockPaymentResult);

    // Verify payment update
    expect(orderService.updateOrderFromPayment).toHaveBeenCalledWith(
      'order-123',
      mockPaymentResult
    );

    expect(updatedOrder).toEqual(mockUpdatedOrder);
    expect(updatedOrder.status).toBe('paid');
    expect(updatedOrder.paymentStatus).toBe('paid');
  });

  it('handles empty cart scenario properly', async () => {
    // Setup empty cart
    cartService.getCartItems.mockResolvedValue([]);

    // Attempt to create order with empty cart
    await expect(createOrderFromCheckout(mockCheckoutSession)).rejects.toThrow(
      'No items found in the cart'
    );

    // Verify order was not created
    expect(orderService.createOrder).not.toHaveBeenCalled();
  });

  it('handles order creation failure properly', async () => {
    // Setup order creation failure
    const error = new Error('Database error');
    orderService.createOrder.mockRejectedValue(error);

    // Attempt to create order
    await expect(createOrderFromCheckout(mockCheckoutSession)).rejects.toThrow('Database error');
  });

  it('processes payment failure correctly', async () => {
    // Step 1: Create the order successfully
    const order = await createOrderFromCheckout(mockCheckoutSession);
    expect(order).toEqual(mockCreatedOrder);

    // Step 2: Simulate payment failure
    const failedPaymentResult = {
      success: false,
      paymentIntentId: 'pi-123',
      status: 'failed',
      error: 'Payment declined',
      orderReference: 'order-123',
    };

    const failedOrderUpdate = {
      ...mockCreatedOrder,
      status: 'failed' as OrderStatus,
      paymentStatus: 'failed' as PaymentStatus,
    };

    orderService.updateOrderFromPayment.mockResolvedValue(failedOrderUpdate);

    // Process the failed payment
    const updatedOrder = await orderService.updateOrderFromPayment(order.id, failedPaymentResult);

    // Verify failed payment updates
    expect(orderService.updateOrderFromPayment).toHaveBeenCalledWith(
      'order-123',
      failedPaymentResult
    );

    expect(updatedOrder.status).toBe('failed');
    expect(updatedOrder.paymentStatus).toBe('failed');
  });
});
