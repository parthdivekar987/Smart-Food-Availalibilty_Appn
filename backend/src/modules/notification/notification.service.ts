import { Server as SocketIOServer } from "socket.io";

// Socket.IO instance will be set from app.ts
let io: SocketIOServer | null = null;

// Store connected sockets by role/room
export const rooms = {
  WAITER: 'waiter_room',
  KITCHEN: 'kitchen_room',
  ADMIN: 'admin_room',
};

/**
 * Initialize the notification service with Socket.IO instance
 */
export const initializeNotificationService = (socketIO: SocketIOServer) => {
  io = socketIO;
  console.log('✅ Notification service initialized');
};

/**
 * Notify waiters about a new order
 */
export const notifyNewOrder = (data: {
  orderId: string;
  tableId: string;
  tableName: string;
  tableSessionId: string;
  items: any[];
  totalAmount: number;
}) => {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  console.log('📢 Emitting new_order to waiter room:', data.orderId);
  
  // Notify all waiters
  io.to(rooms.WAITER).emit('new_order', {
    type: 'NEW_ORDER',
    ...data,
    timestamp: new Date().toISOString(),
  });

  // Notify admins too
  io.to(rooms.ADMIN).emit('new_order', {
    type: 'NEW_ORDER',
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Notify kitchen when order is accepted by waiter
 */
export const notifyOrderAccepted = (data: {
  orderId: string;
  tableId: string;
  tableName: string;
  tableSessionId: string;
  items: any[];
}) => {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  console.log('📢 Emitting order_accepted to kitchen room:', data.orderId);
  
  io.to(rooms.KITCHEN).emit('order_accepted', {
    type: 'ORDER_ACCEPTED',
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Notify customer when order is ready
 */
export const notifyOrderReady = (data: {
  orderId: string;
  tableSessionId: string;
  items?: any[];
}) => {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  console.log('📢 Emitting order_ready to session:', data.tableSessionId);
  
  // Notify customer via their session room
  io.to(`session_${data.tableSessionId}`).emit('order_ready', {
    type: 'ORDER_READY',
    ...data,
    timestamp: new Date().toISOString(),
  });

  // Also notify waiters
  io.to(rooms.WAITER).emit('order_ready', {
    type: 'ORDER_READY',
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Notify when order is served
 */
export const notifyOrderServed = (data: {
  orderId: string;
  tableSessionId: string;
}) => {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  console.log('📢 Emitting order_served to session:', data.tableSessionId);
  
  io.to(`session_${data.tableSessionId}`).emit('order_served', {
    type: 'ORDER_SERVED',
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Generic order status update notification
 */
export const notifyOrderStatusChange = (data: {
  orderId: string;
  tableSessionId: string;
  status: string;
  items?: any[];
}) => {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  console.log('📢 Emitting order_status_change:', data.orderId, data.status);
  
  // Notify customer
  io.to(`session_${data.tableSessionId}`).emit('order_status_change', {
    type: 'ORDER_STATUS_CHANGE',
    ...data,
    timestamp: new Date().toISOString(),
  });

  // Notify all staff
  io.to(rooms.WAITER).emit('order_status_change', {
    type: 'ORDER_STATUS_CHANGE',
    ...data,
    timestamp: new Date().toISOString(),
  });

  io.to(rooms.KITCHEN).emit('order_status_change', {
    type: 'ORDER_STATUS_CHANGE',
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Notify customer and staff when estimated prep time is updated
 */
export const notifyOrderEstimateUpdated = (data: {
  orderId: string;
  tableSessionId: string;
  estimatedPrepMinutes: number;
  estimatedReadyAt: string;
  note?: string;
}) => {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  console.log('📢 Emitting order_estimate_updated to session:', data.tableSessionId, `${data.estimatedPrepMinutes}m`);

  io.to(`session_${data.tableSessionId}`).emit('order_estimate_updated', {
    type: 'ORDER_ESTIMATE_UPDATED',
    ...data,
    timestamp: new Date().toISOString(),
  });

  io.to(rooms.WAITER).emit('order_estimate_updated', {
    type: 'ORDER_ESTIMATE_UPDATED',
    ...data,
    timestamp: new Date().toISOString(),
  });

  io.to(rooms.ADMIN).emit('order_estimate_updated', {
    type: 'ORDER_ESTIMATE_UPDATED',
    ...data,
    timestamp: new Date().toISOString(),
  });

  io.to(rooms.KITCHEN).emit('order_estimate_updated', {
    type: 'ORDER_ESTIMATE_UPDATED',
    ...data,
    timestamp: new Date().toISOString(),
  });

};

/** Staff rooms that should see operational events */
const STAFF_ROOMS = () => [rooms.WAITER, rooms.ADMIN];

/**
 * Live activity for the owner/staff dashboards (cart adds, orders, bill requests, checkout...)
 */
export const notifySessionActivity = (event: {
  id: string;
  tableSessionId: string;
  tableId?: string;
  tableName?: string;
  type: string;
  actor: string;
  actorName?: string | null;
  message: string;
  data?: unknown;
  createdAt: Date | string;
}) => {
  if (!io) return;
  io.to(STAFF_ROOMS()).emit('session_activity', event);
};

/**
 * Tell the guest(s) at a table that staff added items to their order
 */
export const notifyItemsAddedByStaff = (data: {
  tableSessionId: string;
  orderId: string;
  addedBy: { name: string; role: string };
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
}) => {
  if (!io) return;
  io.to(`session_${data.tableSessionId}`).emit('order_items_added', {
    type: 'ORDER_ITEMS_ADDED',
    ...data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Bill requested: notify the table (all its devices) and staff only
 */
export const notifyBillRequested = (order: { id: string; tableSessionId: string | null } & Record<string, any>) => {
  if (!io) return;
  const targets = [...STAFF_ROOMS()];
  if (order.tableSessionId) targets.push(`session_${order.tableSessionId}`);
  io.to(targets).emit('bill_requested', order);
};

/**
 * New order for staff screens (full order payload, scoped to staff rooms)
 */
export const notifyStaffNewOrderPayload = (order: unknown) => {
  if (!io) return;
  io.to([rooms.WAITER, rooms.KITCHEN, rooms.ADMIN]).emit('new_order', order);
};

/**
 * Session closed (paid / checked out): log every device at the table out, and update staff views
 */
export const notifySessionClosed = (data: {
  tableSessionId: string;
  tableId: string;
  tableName: string;
  reason: 'PAID' | 'CLOSED_BY_STAFF';
  amountPaid?: number | null;
  method?: string | null;
}) => {
  if (!io) return;
  const payload = { type: 'SESSION_CLOSED', ...data, timestamp: new Date().toISOString() };
  io.to(`session_${data.tableSessionId}`).emit('session_closed', payload);
  io.to([rooms.WAITER, rooms.ADMIN]).emit('table_session_closed', payload);
  // Nobody should keep receiving this table's events
  io.in(`session_${data.tableSessionId}`).socketsLeave(`session_${data.tableSessionId}`);
};

export default {
  initializeNotificationService,
  notifyNewOrder,
  notifyOrderAccepted,
  notifyOrderReady,
  notifyOrderServed,
  notifyOrderStatusChange,
  notifyOrderEstimateUpdated,
  notifySessionActivity,
  notifyItemsAddedByStaff,
  notifyBillRequested,
  notifyStaffNewOrderPayload,
  notifySessionClosed,
};
