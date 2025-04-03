import { describe, it, expect } from 'vitest';
import {
  canPerformOrderAction,
  canViewOrderSensitiveData,
  filterOrderSensitiveData,
  getAccessibleOrderActions,
  type User,
} from '../order-permissions';
import { type Order, OrderStatus, PaymentStatus } from '../../types';

describe('Order Permissions', () => {
  // Mock users for testing
  const adminUser: User = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'admin',
  };

  const staffUser: User = {
    id: 'staff-123',
    email: 'staff@example.com',
    role: 'staff',
  };

  const customerUser: User = {
    id: 'user-123',
    email: 'customer@example.com',
    role: 'customer',
  };

  const differentCustomerUser: User = {
    id: 'user-456',
    email: 'different@example.com',
    role: 'customer',
  };

  const guestUser: User = {
    id: 'guest-123',
    email: 'guest@example.com',
    role: 'guest',
  };

  // Mock order for testing
  const mockOrder: Order = {
    id: 'order-123',
    orderNumber: 'NO-20250315-ABCD',
    userId: 'user-123', // Matches customerUser
    email: 'customer@example.com', // Matches customerUser
    status: 'processing' as OrderStatus,
    paymentStatus: 'pending' as PaymentStatus,
    paymentIntentId: 'pi_123456',
    paymentMethodId: 'pm_123456',
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'US',
      phone: '555-123-4567',
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postalCode: '12345',
      country: 'US',
      phone: '555-123-4567',
    },
    shippingCost: 10.0,
    taxAmount: 8.5,
    subtotalAmount: 100.0,
    totalAmount: 118.5,
    items: [],
    createdAt: '2025-03-15T12:00:00Z',
    updatedAt: '2025-03-15T12:00:00Z',
  };

  // Mock guest order for testing
  const mockGuestOrder: Order = {
    ...mockOrder,
    id: 'order-456',
    orderNumber: 'NO-20250315-EFGH',
    userId: undefined, // No user ID for guest order
    email: 'guest@example.com', // Matches guestUser
  };

  describe('canPerformOrderAction', () => {
    describe('Admin permissions', () => {
      it('allows admin to perform any action', () => {
        // Test all possible actions
        const actions = [
          'view',
          'create',
          'update',
          'delete',
          'updateStatus',
          'updatePayment',
          'export',
          'cancel',
          'refund',
        ];

        actions.forEach(action => {
          expect(canPerformOrderAction(adminUser, action as any, mockOrder)).toBe(true);
        });

        // Admin can also perform actions without an order context
        expect(canPerformOrderAction(adminUser, 'create')).toBe(true);
      });
    });

    describe('Staff permissions', () => {
      it('allows staff to view orders', () => {
        expect(canPerformOrderAction(staffUser, 'view', mockOrder)).toBe(true);
      });

      it('allows staff to update order status', () => {
        expect(canPerformOrderAction(staffUser, 'updateStatus', mockOrder)).toBe(true);
      });

      it('allows staff to export orders', () => {
        expect(canPerformOrderAction(staffUser, 'export', mockOrder)).toBe(true);
      });

      it('allows staff to update orders that are not completed or refunded', () => {
        // Processing order can be updated
        expect(canPerformOrderAction(staffUser, 'update', mockOrder)).toBe(true);

        // Completed order cannot be updated
        const completedOrder = { ...mockOrder, status: 'completed' as OrderStatus };
        expect(canPerformOrderAction(staffUser, 'update', completedOrder)).toBe(false);

        // Refunded order cannot be updated
        const refundedOrder = { ...mockOrder, status: 'refunded' as OrderStatus };
        expect(canPerformOrderAction(staffUser, 'update', refundedOrder)).toBe(false);
      });

      it('allows staff to cancel orders that are pending or processing', () => {
        // Processing order can be canceled
        expect(canPerformOrderAction(staffUser, 'cancel', mockOrder)).toBe(true);

        // Completed order cannot be canceled
        const completedOrder = { ...mockOrder, status: 'completed' as OrderStatus };
        expect(canPerformOrderAction(staffUser, 'cancel', completedOrder)).toBe(false);
      });

      it('allows staff to refund orders that are paid or completed', () => {
        // Processing order with pending payment cannot be refunded
        expect(canPerformOrderAction(staffUser, 'refund', mockOrder)).toBe(false);

        // Paid order can be refunded
        const paidOrder = {
          ...mockOrder,
          status: 'paid' as OrderStatus,
          paymentStatus: 'paid' as PaymentStatus,
        };
        expect(canPerformOrderAction(staffUser, 'refund', paidOrder)).toBe(true);

        // Completed order can be refunded
        const completedOrder = {
          ...mockOrder,
          status: 'completed' as OrderStatus,
          paymentStatus: 'paid' as PaymentStatus,
        };
        expect(canPerformOrderAction(staffUser, 'refund', completedOrder)).toBe(true);
      });

      it('denies staff from creating or deleting orders', () => {
        expect(canPerformOrderAction(staffUser, 'create')).toBe(false);
        expect(canPerformOrderAction(staffUser, 'delete', mockOrder)).toBe(false);
      });
    });

    describe('Customer permissions', () => {
      it('allows customers to view their own orders', () => {
        expect(canPerformOrderAction(customerUser, 'view', mockOrder)).toBe(true);
      });

      it('denies customers from viewing orders they do not own', () => {
        expect(canPerformOrderAction(differentCustomerUser, 'view', mockOrder)).toBe(false);
      });

      it('allows customers to create orders', () => {
        expect(canPerformOrderAction(customerUser, 'create')).toBe(true);
      });

      it('allows customers to cancel their orders if pending or processing', () => {
        // Processing order can be canceled
        expect(canPerformOrderAction(customerUser, 'cancel', mockOrder)).toBe(true);

        // Completed order cannot be canceled
        const completedOrder = { ...mockOrder, status: 'completed' as OrderStatus };
        expect(canPerformOrderAction(customerUser, 'cancel', completedOrder)).toBe(false);
      });

      it('denies customers from performing admin actions', () => {
        expect(canPerformOrderAction(customerUser, 'update', mockOrder)).toBe(false);
        expect(canPerformOrderAction(customerUser, 'delete', mockOrder)).toBe(false);
        expect(canPerformOrderAction(customerUser, 'updateStatus', mockOrder)).toBe(false);
        expect(canPerformOrderAction(customerUser, 'updatePayment', mockOrder)).toBe(false);
        expect(canPerformOrderAction(customerUser, 'export', mockOrder)).toBe(false);
        expect(canPerformOrderAction(customerUser, 'refund', mockOrder)).toBe(false);
      });
    });

    describe('Guest permissions', () => {
      it('allows guests to view orders with matching email', () => {
        expect(canPerformOrderAction(guestUser, 'view', mockGuestOrder)).toBe(true);
      });

      it('denies guests from viewing orders with different email', () => {
        expect(canPerformOrderAction(guestUser, 'view', mockOrder)).toBe(false);
      });

      it('allows guests to create orders', () => {
        expect(canPerformOrderAction(guestUser, 'create')).toBe(true);
      });

      it('allows guests to cancel their orders if pending or processing', () => {
        // Processing order can be canceled
        expect(canPerformOrderAction(guestUser, 'cancel', mockGuestOrder)).toBe(true);

        // Completed order cannot be canceled
        const completedOrder = { ...mockGuestOrder, status: 'completed' as OrderStatus };
        expect(canPerformOrderAction(guestUser, 'cancel', completedOrder)).toBe(false);
      });

      it('denies guests from performing admin actions', () => {
        expect(canPerformOrderAction(guestUser, 'update', mockGuestOrder)).toBe(false);
        expect(canPerformOrderAction(guestUser, 'delete', mockGuestOrder)).toBe(false);
        expect(canPerformOrderAction(guestUser, 'updateStatus', mockGuestOrder)).toBe(false);
        expect(canPerformOrderAction(guestUser, 'updatePayment', mockGuestOrder)).toBe(false);
        expect(canPerformOrderAction(guestUser, 'export', mockGuestOrder)).toBe(false);
        expect(canPerformOrderAction(guestUser, 'refund', mockGuestOrder)).toBe(false);
      });
    });

    describe('Unauthenticated requests', () => {
      it('denies all actions to unauthenticated requests', () => {
        const actions = [
          'view',
          'create',
          'update',
          'delete',
          'updateStatus',
          'updatePayment',
          'export',
          'cancel',
          'refund',
        ];

        actions.forEach(action => {
          expect(canPerformOrderAction(null, action as any, mockOrder)).toBe(false);
        });
      });
    });
  });

  describe('canViewOrderSensitiveData', () => {
    it('allows admin to view sensitive data for any order', () => {
      expect(canViewOrderSensitiveData(adminUser, mockOrder)).toBe(true);
      expect(canViewOrderSensitiveData(adminUser, mockGuestOrder)).toBe(true);
    });

    it('allows staff to view sensitive data for any order', () => {
      expect(canViewOrderSensitiveData(staffUser, mockOrder)).toBe(true);
      expect(canViewOrderSensitiveData(staffUser, mockGuestOrder)).toBe(true);
    });

    it('allows customers to view sensitive data of their own orders', () => {
      expect(canViewOrderSensitiveData(customerUser, mockOrder)).toBe(true);
    });

    it('denies customers from viewing sensitive data of orders they do not own', () => {
      expect(canViewOrderSensitiveData(differentCustomerUser, mockOrder)).toBe(false);
    });

    it('allows guests to view sensitive data of orders with matching email', () => {
      expect(canViewOrderSensitiveData(guestUser, mockGuestOrder)).toBe(true);
    });

    it('denies guests from viewing sensitive data of orders with different email', () => {
      expect(canViewOrderSensitiveData(guestUser, mockOrder)).toBe(false);
    });

    it('denies unauthenticated requests from viewing sensitive data', () => {
      expect(canViewOrderSensitiveData(null, mockOrder)).toBe(false);
    });
  });

  describe('filterOrderSensitiveData', () => {
    it('returns the full order for users who can view sensitive data', () => {
      // Admin should get the full order
      const adminFiltered = filterOrderSensitiveData(adminUser, mockOrder);
      expect(adminFiltered).toEqual(mockOrder);

      // Staff should get the full order
      const staffFiltered = filterOrderSensitiveData(staffUser, mockOrder);
      expect(staffFiltered).toEqual(mockOrder);

      // Customer should get the full order for their own order
      const customerFiltered = filterOrderSensitiveData(customerUser, mockOrder);
      expect(customerFiltered).toEqual(mockOrder);

      // Guest should get the full order for their own order
      const guestFiltered = filterOrderSensitiveData(guestUser, mockGuestOrder);
      expect(guestFiltered).toEqual(mockGuestOrder);
    });

    it('removes sensitive data for users who cannot view it', () => {
      // Different customer should get filtered data
      const filteredOrder = filterOrderSensitiveData(differentCustomerUser, mockOrder);

      // Verify sensitive data is removed or masked
      expect(filteredOrder.paymentIntentId).toBeUndefined();
      expect(filteredOrder.paymentMethodId).toBeUndefined();
      expect(filteredOrder.billingAddress).toBeUndefined();

      // Verify shipping address is partially masked
      expect(filteredOrder.shippingAddress).toBeDefined();
      expect(filteredOrder.shippingAddress?.address1).toBe('***');
      expect(filteredOrder.shippingAddress?.postalCode).toBe('***');
      expect(filteredOrder.shippingAddress?.phone).toBe('***');

      // Verify non-sensitive data is preserved
      expect(filteredOrder.id).toBe(mockOrder.id);
      expect(filteredOrder.orderNumber).toBe(mockOrder.orderNumber);
      expect(filteredOrder.status).toBe(mockOrder.status);
      expect(filteredOrder.totalAmount).toBe(mockOrder.totalAmount);
    });

    it('handles orders without optional fields', () => {
      // Create a minimal order
      const minimalOrder: Order = {
        id: 'order-min',
        orderNumber: 'NO-MIN',
        email: 'minimal@example.com',
        status: 'pending' as OrderStatus,
        paymentStatus: 'pending' as PaymentStatus,
        shippingCost: 0,
        taxAmount: 0,
        subtotalAmount: 50,
        totalAmount: 50,
        items: [],
        createdAt: '2025-03-15T12:00:00Z',
        updatedAt: '2025-03-15T12:00:00Z',
      };

      // Filter it for a user who can't view sensitive data
      const filteredOrder = filterOrderSensitiveData(guestUser, minimalOrder);

      // It should not error on missing fields
      expect(filteredOrder.id).toBe(minimalOrder.id);
      expect(filteredOrder.shippingAddress).toBeUndefined();
      expect(filteredOrder.billingAddress).toBeUndefined();
    });
  });

  describe('getAccessibleOrderActions', () => {
    it('returns all actions for admin users', () => {
      const actions = getAccessibleOrderActions(adminUser, mockOrder);
      expect(actions).toHaveLength(9); // All 9 actions
      expect(actions).toContain('view');
      expect(actions).toContain('create');
      expect(actions).toContain('update');
      expect(actions).toContain('delete');
      expect(actions).toContain('updateStatus');
      expect(actions).toContain('updatePayment');
      expect(actions).toContain('export');
      expect(actions).toContain('cancel');
      expect(actions).toContain('refund');
    });

    it('returns allowed actions for staff users', () => {
      const actions = getAccessibleOrderActions(staffUser, mockOrder);

      // Staff can view, update, updateStatus, export, cancel
      expect(actions).toContain('view');
      expect(actions).toContain('update');
      expect(actions).toContain('updateStatus');
      expect(actions).toContain('updatePayment');
      expect(actions).toContain('export');
      expect(actions).toContain('cancel');

      // Staff cannot create, delete
      expect(actions).not.toContain('create');
      expect(actions).not.toContain('delete');

      // Staff cannot refund this order (not paid yet)
      expect(actions).not.toContain('refund');
    });

    it('returns allowed actions for customer users', () => {
      const actions = getAccessibleOrderActions(customerUser, mockOrder);

      // Customer can view, cancel their own order
      expect(actions).toContain('view');
      expect(actions).toContain('cancel');

      // Customer cannot perform admin actions
      expect(actions).not.toContain('update');
      expect(actions).not.toContain('delete');
      expect(actions).not.toContain('updateStatus');
      expect(actions).not.toContain('updatePayment');
      expect(actions).not.toContain('export');
      expect(actions).not.toContain('refund');
    });

    it('returns allowed actions for guest users', () => {
      const actions = getAccessibleOrderActions(guestUser, mockGuestOrder);

      // Guest can view, cancel their own order
      expect(actions).toContain('view');
      expect(actions).toContain('cancel');

      // Guest cannot perform admin actions
      expect(actions).not.toContain('update');
      expect(actions).not.toContain('delete');
      expect(actions).not.toContain('updateStatus');
      expect(actions).not.toContain('updatePayment');
      expect(actions).not.toContain('export');
      expect(actions).not.toContain('refund');
    });

    it('returns empty array for users with no permissions', () => {
      // Different customer has no permissions on this order
      const actions = getAccessibleOrderActions(differentCustomerUser, mockOrder);
      expect(actions).toEqual([]);
    });

    it('returns empty array for unauthenticated requests', () => {
      const actions = getAccessibleOrderActions(null, mockOrder);
      expect(actions).toEqual([]);
    });
  });
});
