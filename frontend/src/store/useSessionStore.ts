// Lưu Table Session, Cart History, Active Placed Order & Bill State (sync with localStorage)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartHistoryItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedModifiers?: any;
  totalPrice: number;
  orderedAt: string;
}

export interface PlacedOrderRecord {
  id: string;
  placedAt: string;
  items: CartHistoryItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  status: string;
}

interface SessionState {
  tableId: string | null;
  tableName: string | null;
  sessionId: string | null;
  activeOrderId: string | null;
  lastOrder: any | null;
  billRequested: boolean;
  billRequestedAt: string | null;
  cartHistory: CartHistoryItem[];
  orderHistory: PlacedOrderRecord[];

  setSession: (tableId: string, sessionId: string, tableName?: string) => void;
  setActiveOrder: (order: any) => void;
  updateActiveOrderStatus: (status: string, estimatedPrepMinutes?: number, estimatedReadyAt?: string) => void;
  setBillRequested: (requested: boolean) => void;
  addOrderToHistory: (order: any, rawCartItems?: any[]) => void;
  clearActiveOrder: () => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      tableId: null,
      tableName: null,
      sessionId: null,
      activeOrderId: null,
      lastOrder: null,
      billRequested: false,
      billRequestedAt: null,
      cartHistory: [],
      orderHistory: [],

      setSession: (tableId, sessionId, tableName) => set((state) => ({
        tableId,
        sessionId,
        tableName: tableName || state.tableName || (tableId.includes('demo') ? 'Table 04' : 'Table Active'),
      })),

      setActiveOrder: (order) => set((state) => ({
        activeOrderId: order?.id || null,
        lastOrder: order || null,
        billRequested: order?.billRequested ?? state.billRequested,
      })),

      updateActiveOrderStatus: (status, estimatedPrepMinutes, estimatedReadyAt) => set((state) => {
        if (!state.lastOrder) return state;
        return {
          lastOrder: {
            ...state.lastOrder,
            status,
            estimatedPrepMinutes: estimatedPrepMinutes !== undefined ? estimatedPrepMinutes : state.lastOrder.estimatedPrepMinutes,
            estimatedReadyAt: estimatedReadyAt || state.lastOrder.estimatedReadyAt,
          }
        };
      }),

      setBillRequested: (requested) => set((state) => ({
        billRequested: requested,
        billRequestedAt: requested ? new Date().toISOString() : null,
        lastOrder: state.lastOrder ? { ...state.lastOrder, billRequested: requested } : null,
      })),

      addOrderToHistory: (order, rawCartItems = []) => set((state) => {
        const timestamp = new Date().toISOString();
        
        // Convert cart items to history format
        const newHistoryItems: CartHistoryItem[] = rawCartItems.map((item: any) => ({
          id: item.id || item.cartItemId || ('hist-' + Math.random()),
          name: item.name || 'Gourmet Dish',
          price: item.price || 0,
          quantity: item.quantity || 1,
          selectedModifiers: item.selectedModifiers || {},
          totalPrice: item.totalPrice || ((item.price || 0) * (item.quantity || 1)),
          orderedAt: timestamp,
        }));

        const subtotal = newHistoryItems.reduce((acc, i) => acc + (i.totalPrice || (i.price * i.quantity)), 0);
        const tax = subtotal * 0.05; // 5% GST
        const grandTotal = subtotal + tax;

        const newRecord: PlacedOrderRecord = {
          id: order?.id || ('ord-' + Date.now()),
          placedAt: timestamp,
          items: newHistoryItems,
          subtotal,
          tax,
          grandTotal,
          status: order?.status || 'RECEIVED',
        };

        // Combine with existing cartHistory, avoiding exact duplicate items
        const combinedHistory = [...state.cartHistory, ...newHistoryItems];

        return {
          activeOrderId: order?.id || state.activeOrderId,
          lastOrder: order || state.lastOrder,
          cartHistory: combinedHistory,
          orderHistory: [...state.orderHistory, newRecord],
        };
      }),

      clearActiveOrder: () => set({
        activeOrderId: null,
        lastOrder: null,
        billRequested: false,
        billRequestedAt: null,
      }),

      resetSession: () => set({
        tableId: null,
        tableName: null,
        sessionId: null,
        activeOrderId: null,
        lastOrder: null,
        billRequested: false,
        billRequestedAt: null,
        cartHistory: [],
        orderHistory: [],
      }),
    }),
    { name: 'restaurant-session' } // Persist in localStorage so refreshing never loses order tracking or bill history
  )
);