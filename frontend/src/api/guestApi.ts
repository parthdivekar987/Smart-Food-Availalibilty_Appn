import axiosClient from './axiosClient';

export interface PublicTable {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
  isOccupied: boolean;
  restaurantId: string;
}

export interface WalkInResponse {
  session: { id: string; tableId: string; status: string };
  table: { id: string; name: string; capacity: number };
  isNew: boolean;
}

export const guestApi = {
  /** Start (or resume) a session from a scanned table QR code */
  startSession: (tableId: string, token: string) =>
    axiosClient.post('/guest/session', { tableId, token }),

  /** Seat a walk-in guest without a QR code (first free table if tableId is omitted) */
  startWalkIn: (tableId?: string) =>
    axiosClient.post('/guest/walk-in', { tableId }) as unknown as Promise<WalkInResponse>,

  /** Is this table session still open? (detects checkout that happened while offline) */
  getSessionStatus: (sessionId: string) =>
    axiosClient.get(`/sessions/${sessionId}/status`) as unknown as Promise<{ id: string; status: "OPEN" | "CLOSED"; tableName: string; endedAt: string | null }>,

  getTables: () =>
    axiosClient.get('/guest/tables') as unknown as Promise<{ data: PublicTable[] }>,

  placeOrder: (data: any) => axiosClient.post('/orders', data),

  getCategories: () => axiosClient.get('/guest/categories'),

  getMenuItems: (params: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    isChefRecommended?: boolean;
    sortBy?: string;
  }) => axiosClient.get('/guest/menu-items', { params }),

  getOrderDetails: (tableSessionId: string) =>
    axiosClient.get(`/guest/orders/${tableSessionId}`),

  requestBill: (orderId: string) =>
    axiosClient.post(`/guest/orders/${orderId}/request-bill`),

  getReviews: (menuItemId: string, params: { page: number; limit: number }) =>
    axiosClient.get(`/guest/menu-items/${menuItemId}/reviews`, { params }),

  createReview: (menuItemId: string, data: { rating: number; comment: string; customerName?: string; tableSessionId: string }) =>
    axiosClient.post(`/guest/menu-items/${menuItemId}/reviews`, data),
};
