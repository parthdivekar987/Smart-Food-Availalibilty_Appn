// Lưu Table Session và Active Placed Order (sync with localStorage & Redis)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
  tableId: string | null;
  sessionId: string | null;
  activeOrderId: string | null;
  lastOrder: any | null;
  setSession: (tableId: string, sessionId: string) => void;
  setActiveOrder: (order: any) => void;
  updateActiveOrderStatus: (status: string, estimatedPrepMinutes?: number, estimatedReadyAt?: string) => void;
  clearActiveOrder: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      tableId: null,
      sessionId: null,
      activeOrderId: null,
      lastOrder: null,
      setSession: (tableId, sessionId) => set({ tableId, sessionId }),
      setActiveOrder: (order) => set({
        activeOrderId: order?.id || null,
        lastOrder: order || null,
      }),
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
      clearActiveOrder: () => set({ activeOrderId: null, lastOrder: null }),
    }),
    { name: 'restaurant-session' } // Persist in localStorage so refreshing never loses order tracking
  )
);