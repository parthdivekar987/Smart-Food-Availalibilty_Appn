import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { BACKEND_ORIGIN } from '../api/axiosClient';

// Notification types
export interface OrderNotification {
  type: 'NEW_ORDER' | 'ORDER_ACCEPTED' | 'ORDER_READY' | 'ORDER_SERVED' | 'ORDER_STATUS_CHANGE';
  orderId: string;
  tableId?: string;
  tableName?: string;
  tableSessionId?: string;
  status?: string;
  items?: any[];
  totalAmount?: number;
  timestamp: string;
}

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  notifications: OrderNotification[];
  connect: () => void;
  disconnect: () => void;
  /** Join a role room and/or a table-session room. Remembered and re-joined after reconnects. */
  joinRoom: (data: { role: string; tableSessionId?: string }) => void;
  leaveRoom: (room: string) => void;
  /** Stop receiving (and stop re-joining) a table session's events, e.g. after checkout */
  forgetSession: (tableSessionId: string) => void;
  clearNotifications: () => void;
  // Event listener registration
  onNewOrder: (callback: (data: OrderNotification) => void) => () => void;
  onOrderAccepted: (callback: (data: OrderNotification) => void) => () => void;
  onOrderReady: (callback: (data: OrderNotification) => void) => () => void;
  onOrderServed: (callback: (data: OrderNotification) => void) => () => void;
  onOrderStatusChange: (callback: (data: OrderNotification) => void) => () => void;
}

const SOCKET_URL = BACKEND_ORIGIN;

const STAFF_ROLES = ['WAITER', 'KITCHEN', 'ADMIN', 'SUPER_ADMIN'];
type JoinRequest = { role: string; tableSessionId?: string };
/** Rooms this tab wants to be in; re-sent on every (re)connect */
const desiredJoins = new Map<string, JoinRequest>();
const joinKey = (d: JoinRequest) => `${d.role}|${d.tableSessionId || ''}`;

const emitJoin = (socket: Socket, data: JoinRequest) => {
  const token = STAFF_ROLES.includes(data.role) ? localStorage.getItem('accessToken') : undefined;
  socket.emit('join_room', { ...data, token });
};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  notifications: [],

  connect: () => {
    if (get().socket?.connected) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      set({ isConnected: true });
      // Re-join every room after a (re)connect so no notification is silently missed
      desiredJoins.forEach((data) => emitJoin(socket, data));
    });

    let lastRoomError = 0;
    socket.on('room_error', (data: { message?: string }) => {
      if (Date.now() - lastRoomError < 10000) return;
      lastRoomError = Date.now();
      toast.error(data?.message || 'Live updates are unavailable. Please sign in again.');
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
      console.log('❌ Socket disconnected');
    });

    // Default notification handlers - show toast
    socket.on('new_order', (data: OrderNotification) => {
      console.log('📢 New order received:', data);
      set(state => ({
        notifications: [data, ...state.notifications.slice(0, 49)] // Keep last 50
      }));
    });

    socket.on('order_accepted', (data: OrderNotification) => {
      console.log('📢 Order accepted:', data);
      set(state => ({
        notifications: [data, ...state.notifications.slice(0, 49)]
      }));
    });

    socket.on('order_ready', (data: OrderNotification) => {
      console.log('📢 Order ready:', data);
      set(state => ({
        notifications: [data, ...state.notifications.slice(0, 49)]
      }));
    });

    socket.on('order_served', (data: OrderNotification) => {
      console.log('📢 Order served:', data);
      set(state => ({
        notifications: [data, ...state.notifications.slice(0, 49)]
      }));
    });

    socket.on('order_status_change', (data: OrderNotification) => {
      console.log('📢 Order status changed:', data);
      set(state => ({
        notifications: [data, ...state.notifications.slice(0, 49)]
      }));
    });

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, isConnected: false, notifications: [] });
  },

  joinRoom: (data) => {
    desiredJoins.set(joinKey(data), data);
    const socket = get().socket;
    if (socket?.connected) emitJoin(socket, data);
  },

  forgetSession: (tableSessionId) => {
    desiredJoins.forEach((value, key) => {
      if (value.tableSessionId === tableSessionId) desiredJoins.delete(key);
    });
    const socket = get().socket;
    if (socket?.connected) socket.emit('leave_room', `session_${tableSessionId}`);
  },

  leaveRoom: (room) => {
    const socket = get().socket;
    if (socket?.connected) {
      socket.emit('leave_room', room);
      console.log(`🚪 Left room: ${room}`);
    }
  },

  clearNotifications: () => set({ notifications: [] }),

  // Custom event listener registration methods
  // Returns cleanup function
  onNewOrder: (callback) => {
    const socket = get().socket;
    if (socket) {
      socket.on('new_order', callback);
      return () => socket.off('new_order', callback);
    }
    return () => {};
  },

  onOrderAccepted: (callback) => {
    const socket = get().socket;
    if (socket) {
      socket.on('order_accepted', callback);
      return () => socket.off('order_accepted', callback);
    }
    return () => {};
  },

  onOrderReady: (callback) => {
    const socket = get().socket;
    if (socket) {
      socket.on('order_ready', callback);
      return () => socket.off('order_ready', callback);
    }
    return () => {};
  },

  onOrderServed: (callback) => {
    const socket = get().socket;
    if (socket) {
      socket.on('order_served', callback);
      return () => socket.off('order_served', callback);
    }
    return () => {};
  },

  onOrderStatusChange: (callback) => {
    const socket = get().socket;
    if (socket) {
      socket.on('order_status_change', callback);
      return () => socket.off('order_status_change', callback);
    }
    return () => {};
  },
}));

