// Export type definitions
export * from './types';

// Export server-side actions
export {
  getOrderById,
  getOrderByOrderNumber,
  getUserOrders,
  getOrdersByEmail,
  updateOrderStatusFromPayment,
} from './api/actions.server';

// Export OrderService for direct use in server-side code
export { getOrderService } from './api/orderService';
