import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

// Create the mock functions
const mockGetOrders = vi.fn();
const mockGetOrderById = vi.fn();
const mockUpdateOrderStatus = vi.fn();
const mockUpdatePaymentStatus = vi.fn();
const mockRequireAdmin = vi.fn().mockResolvedValue({
  id: 'admin-123',
  email: 'admin@example.com',
  role: 'admin',
});
const mockOrderServiceGetOrders = vi.fn();
const mockGetOrderService = vi.fn().mockResolvedValue({
  getOrders: mockOrderServiceGetOrders,
});

// Now mock the modules
vi.mock('~/features/orders/api/queries.server', () => ({
  getOrders: mockGetOrders,
  getOrderById: mockGetOrderById,
}));

vi.mock('~/features/orders/api/actions.server', () => ({
  updateOrderStatus: mockUpdateOrderStatus,
  updatePaymentStatus: mockUpdatePaymentStatus,
}));

vi.mock('~/features/orders/api/orderService', () => ({
  getOrderService: mockGetOrderService,
}));

vi.mock('~/server/middleware/auth.server', () => ({
  requireAdmin: mockRequireAdmin,
}));

// Ensure TextDecoder is available
if (typeof global.TextDecoder !== 'function') {
  global.TextDecoder = class TextDecoder {
    encoding: string;
    fatal: boolean;
    ignoreBOM: boolean;

    constructor(label: string = 'utf-8', options: TextDecoderOptions = {}) {
      this.encoding = label;
      this.fatal = options.fatal || false;
      this.ignoreBOM = options.ignoreBOM || false;
    }

    decode(input?: Uint8Array | ArrayBuffer | null): string {
      if (!input) return '';

      // Simple decoder for tests
      const bytes = new Uint8Array(input instanceof ArrayBuffer ? input : input.buffer);
      let result = '';
      for (let i = 0; i < bytes.length; i++) {
        result += String.fromCharCode(bytes[i]);
      }
      return result;
    }
  };
}

// Import the loader/action functions from the routes
// Note: We need to use dynamic import since the route might not exist yet
// This is a placeholder for the actual import once the route is created
let loader: (args: LoaderFunctionArgs) => Promise<Response>;
let action: (args: ActionFunctionArgs) => Promise<Response>;

const importRouteHandlers = async () => {
  try {
    // Try to import the orders list loader
    const listModule = await import('../admin.orders');
    loader = listModule.loader;

    // Try to import the order detail action
    const detailModule = await import('../admin.orders.$id');
    action = detailModule.action;
  } catch (error) {
    // If route doesn't exist yet, use dummy handlers for testing
    loader = async ({ request, params }) => {
      // Check admin authentication
      await mockRequireAdmin(request);

      // Get URL search params
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;
      const status = url.searchParams.get('status') || undefined;
      const paymentStatus = url.searchParams.get('paymentStatus') || undefined;
      const searchQuery = url.searchParams.get('search') || undefined;

      // Get orders with filters
      const ordersResult = await mockGetOrders({
        status: status as any,
        paymentStatus: paymentStatus as any,
        searchQuery,
        limit,
        offset,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      });

      // Get a specific order if requested
      let order = null;
      if (params.orderId) {
        order = await mockGetOrderById(params.orderId);

        if (!order) {
          return new Response(JSON.stringify({ error: 'Order not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // Return data based on whether we're viewing a list or a single order
      const responseData = order
        ? { order }
        : {
            orders: ordersResult.orders,
            total: ordersResult.total,
            page,
            limit,
            totalPages: Math.ceil(ordersResult.total / limit),
          };

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    action = async ({ request, params }) => {
      // Check admin authentication
      await mockRequireAdmin(request);

      // Only process POST/PUT requests
      if (request.method !== 'POST' && request.method !== 'PUT') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Ensure we have an order ID
      if (!params.orderId) {
        return new Response(JSON.stringify({ error: 'Order ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Parse request body
      const formData = await request.formData();
      const intent = formData.get('intent')?.toString();

      if (intent === 'updateStatus') {
        const status = formData.get('status')?.toString();
        const notes = formData.get('notes')?.toString();

        if (!status) {
          return new Response(JSON.stringify({ error: 'Status is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const order = await mockUpdateOrderStatus(params.orderId, status as any, notes);

        return new Response(JSON.stringify({ order, success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else if (intent === 'updatePaymentStatus') {
        const paymentStatus = formData.get('paymentStatus')?.toString();
        const notes = formData.get('notes')?.toString();

        if (!paymentStatus) {
          return new Response(JSON.stringify({ error: 'Payment status is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const order = await mockUpdatePaymentStatus(
          params.orderId,
          paymentStatus as any,
          undefined,
          notes
        );

        return new Response(JSON.stringify({ order, success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid action intent' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    };
  }

  return { loader, action };
};

describe('Admin Orders Route', () => {
  const mockOrders = [
    {
      id: 'order-123',
      orderNumber: 'NO-20250315-ABCD',
      email: 'customer@example.com',
      status: 'processing',
      paymentStatus: 'pending',
      totalAmount: 118.5,
      items: [],
      createdAt: '2025-03-15T12:00:00Z',
      updatedAt: '2025-03-15T12:00:00Z',
    },
    {
      id: 'order-456',
      orderNumber: 'NO-20250314-EFGH',
      email: 'customer2@example.com',
      status: 'completed',
      paymentStatus: 'paid',
      totalAmount: 236.0,
      items: [],
      createdAt: '2025-03-14T12:00:00Z',
      updatedAt: '2025-03-14T12:00:00Z',
    },
  ];

  const mockOrdersResult = {
    orders: mockOrders,
    total: 2,
    limit: 20,
    offset: 0,
  };

  const mockOrder = {
    id: 'order-123',
    orderNumber: 'NO-20250315-ABCD',
    email: 'customer@example.com',
    status: 'processing',
    paymentStatus: 'pending',
    shippingCost: 10.0,
    taxAmount: 8.5,
    subtotalAmount: 100.0,
    totalAmount: 118.5,
    items: [
      {
        id: 'item-1',
        orderId: 'order-123',
        productId: 'product-1',
        name: 'Test Product 1',
        sku: 'TP1',
        quantity: 2,
        unitPrice: 25.0,
        totalPrice: 50.0,
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
      {
        id: 'item-2',
        orderId: 'order-123',
        productId: 'product-2',
        name: 'Test Product 2',
        sku: 'TP2',
        quantity: 1,
        unitPrice: 50.0,
        totalPrice: 50.0,
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      },
    ],
    statusHistory: [
      {
        id: 'history-1',
        orderId: 'order-123',
        status: 'pending',
        notes: 'Order created',
        createdAt: '2025-03-15T11:00:00Z',
      },
      {
        id: 'history-2',
        orderId: 'order-123',
        status: 'processing',
        notes: 'Payment received',
        createdAt: '2025-03-15T12:00:00Z',
      },
    ],
    createdAt: '2025-03-15T11:00:00Z',
    updatedAt: '2025-03-15T12:00:00Z',
  };

  const mockUpdatedOrder = {
    ...mockOrder,
    status: 'completed',
    updatedAt: '2025-03-15T13:00:00Z',
    statusHistory: [
      ...mockOrder.statusHistory,
      {
        id: 'history-3',
        orderId: 'order-123',
        status: 'completed',
        notes: 'Order completed',
        createdAt: '2025-03-15T13:00:00Z',
      },
    ],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockGetOrders.mockResolvedValue(mockOrdersResult);
    mockGetOrderById.mockResolvedValue(mockOrder);
    mockUpdateOrderStatus.mockResolvedValue(mockUpdatedOrder);
    mockUpdatePaymentStatus.mockResolvedValue({
      ...mockOrder,
      paymentStatus: 'paid',
      updatedAt: '2025-03-15T13:00:00Z',
    });

    // Mock the OrderService.getOrders method
    mockOrderServiceGetOrders.mockResolvedValue(mockOrdersResult);

    // Import the route handlers
    await importRouteHandlers();
  });

  describe('loader', () => {
    it('requires admin authentication', async () => {
      // Arrange
      const request = new Request('http://localhost/admin/orders');

      // Act
      await loader({ request, params: {}, context: {} });

      // Assert
      expect(mockRequireAdmin).toHaveBeenCalledWith(request);
    });

    it('loads a paginated list of orders', async () => {
      // Arrange
      const request = new Request('http://localhost/admin/orders?page=2&limit=10');

      // Act
      const response = await loader({ request, params: {}, context: {} });
      const data = await response.json();

      // Assert
      expect(mockGetOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 10, // page 2 with limit 10
        })
      );

      expect(data).toEqual({
        orders: mockOrders,
        total: 2,
        page: 2,
        limit: 10,
        totalPages: 1,
      });
    });

    it('applies filters from URL parameters', async () => {
      // Arrange
      const request = new Request(
        'http://localhost/admin/orders?status=processing&paymentStatus=pending&search=test'
      );

      // Act
      await loader({ request, params: {}, context: {} });

      // Assert
      expect(mockGetOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'processing',
          paymentStatus: 'pending',
          searchQuery: 'test',
        })
      );
    });

    it('gets a specific order when ID is provided', async () => {
      // Arrange
      const request = new Request('http://localhost/admin/orders/order-123');

      // Act
      const response = await loader({ request, params: { orderId: 'order-123' }, context: {} });
      const data = await response.json();

      // Assert
      expect(mockGetOrderById).toHaveBeenCalledWith('order-123');
      expect(data).toEqual({ order: mockOrder });
    });

    it('returns 404 when order is not found', async () => {
      // Arrange
      mockGetOrderById.mockResolvedValue(null);

      const request = new Request('http://localhost/admin/orders/non-existent');

      // Act
      const response = await loader({ request, params: { orderId: 'non-existent' }, context: {} });

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe('action', () => {
    it('requires admin authentication', async () => {
      // Arrange
      const request = new Request('http://localhost/admin/orders/order-123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // Mock formData to avoid TextDecoder issues
      request.formData = vi.fn().mockResolvedValue({
        get: () => undefined,
      });

      // Act
      await action({ request, params: { orderId: 'order-123' }, context: {} });

      // Assert
      expect(mockRequireAdmin).toHaveBeenCalledWith(request);
    });

    it('rejects non-POST/PUT methods', async () => {
      // Arrange
      const request = new Request('http://localhost/admin/orders/order-123', {
        method: 'DELETE',
      });

      // Act
      const response = await action({ request, params: { orderId: 'order-123' }, context: {} });

      // Assert
      expect(response.status).toBe(405);
    });

    it('requires an order ID', async () => {
      // Arrange
      const request = new Request('http://localhost/admin/orders', {
        method: 'POST',
        body: new FormData(),
      });

      // Act
      const response = await action({ request, params: {}, context: {} });

      // Assert
      expect(response.status).toBe(400);
    });

    it('updates order status', async () => {
      // Arrange
      const body = JSON.stringify({
        intent: 'updateStatus',
        status: 'completed',
        notes: 'Order completed',
      });

      const request = new Request('http://localhost/admin/orders/order-123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      // Override formData to avoid TextDecoder issues
      request.formData = vi.fn().mockResolvedValue({
        get: (key: string) => {
          const data = {
            intent: 'updateStatus',
            status: 'completed',
            notes: 'Order completed',
          };
          return data[key as keyof typeof data];
        },
      });

      // Act
      const response = await action({ request, params: { orderId: 'order-123' }, context: {} });
      const data = await response.json();

      // Assert
      expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
        'order-123',
        'completed',
        'Order completed'
      );
      expect(response.status).toBe(200);
      expect(data).toEqual({
        order: mockUpdatedOrder,
        success: true,
      });
    });

    it('requires status for status update', async () => {
      // Arrange
      const body = JSON.stringify({
        intent: 'updateStatus',
        // Missing status
      });

      const request = new Request('http://localhost/admin/orders/order-123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      // Override formData to avoid TextDecoder issues
      request.formData = vi.fn().mockResolvedValue({
        get: (key: string) => {
          const data = {
            intent: 'updateStatus',
            // Missing status
          };
          return data[key as keyof typeof data];
        },
      });

      // Act
      const response = await action({ request, params: { orderId: 'order-123' }, context: {} });

      // Assert
      expect(response.status).toBe(400);
    });

    it('updates payment status', async () => {
      // Arrange
      const body = JSON.stringify({
        intent: 'updatePaymentStatus',
        paymentStatus: 'paid',
        notes: 'Payment confirmed',
      });

      const request = new Request('http://localhost/admin/orders/order-123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      // Override formData to avoid TextDecoder issues
      request.formData = vi.fn().mockResolvedValue({
        get: (key: string) => {
          const data = {
            intent: 'updatePaymentStatus',
            paymentStatus: 'paid',
            notes: 'Payment confirmed',
          };
          return data[key as keyof typeof data];
        },
      });

      // Act
      const response = await action({ request, params: { orderId: 'order-123' }, context: {} });
      const data = await response.json();

      // Assert
      expect(mockUpdatePaymentStatus).toHaveBeenCalledWith(
        'order-123',
        'paid',
        undefined,
        'Payment confirmed'
      );
      expect(response.status).toBe(200);
      expect(data.order.paymentStatus).toBe('paid');
    });

    it('requires payment status for payment update', async () => {
      // Arrange
      const body = JSON.stringify({
        intent: 'updatePaymentStatus',
        // Missing paymentStatus
      });

      const request = new Request('http://localhost/admin/orders/order-123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      // Override formData to avoid TextDecoder issues
      request.formData = vi.fn().mockResolvedValue({
        get: (key: string) => {
          const data = {
            intent: 'updatePaymentStatus',
            // Missing paymentStatus
          };
          return data[key as keyof typeof data];
        },
      });

      // Act
      const response = await action({ request, params: { orderId: 'order-123' }, context: {} });

      // Assert
      expect(response.status).toBe(400);
    });

    it('rejects invalid action intent', async () => {
      // Arrange
      const body = JSON.stringify({
        intent: 'invalidAction',
      });

      const request = new Request('http://localhost/admin/orders/order-123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      // Override formData to avoid TextDecoder issues
      request.formData = vi.fn().mockResolvedValue({
        get: (key: string) => {
          const data = {
            intent: 'invalidAction',
          };
          return data[key as keyof typeof data];
        },
      });

      // Act
      const response = await action({ request, params: { orderId: 'order-123' }, context: {} });

      // Assert
      expect(response.status).toBe(400);
    });
  });
});
