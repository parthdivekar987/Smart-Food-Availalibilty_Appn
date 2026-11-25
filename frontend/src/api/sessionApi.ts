import axiosClient from './axiosClient';

export interface SessionEvent {
  id: string;
  tableSessionId: string;
  tableId?: string;
  tableName?: string;
  type:
    | 'SESSION_STARTED'
    | 'CART_ITEM_ADDED'
    | 'ORDER_PLACED'
    | 'STAFF_ADDED_ITEMS'
    | 'BILL_REQUESTED'
    | 'PAYMENT_COMPLETED'
    | 'SESSION_CLOSED';
  actor: 'GUEST' | 'STAFF' | 'SYSTEM';
  actorName?: string | null;
  message: string;
  data?: any;
  createdAt: string;
}

export interface LiveSession {
  id: string;
  startedAt: string;
  lastActivityAt: string;
  table: { id: string; name: string; capacity: number };
  waiter: { id: string; fullName: string } | null;
  order: {
    id: string;
    status: string;
    totalAmount: number;
    billRequested: boolean;
    itemCount: number;
    items: { id: string; quantity: number; price: number; status: string; menuItem: { name: string } }[];
  } | null;
  events: SessionEvent[];
}

export const sessionApi = {
  getLiveSessions: () => axiosClient.get('/sessions/live') as unknown as Promise<{ data: LiveSession[] }>,

  getSessionEvents: (sessionId: string) =>
    axiosClient.get(`/sessions/${sessionId}/events`) as unknown as Promise<{ data: SessionEvent[] }>,

  /** Staff adds items to a seated table; the guest is notified in real time */
  addItemsToTable: (sessionId: string, items: { id: string; quantity: number; note?: string }[]) =>
    axiosClient.post(`/orders/session/${sessionId}/items`, { items }),
};
