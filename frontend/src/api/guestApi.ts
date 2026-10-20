import axiosClient from './axiosClient';
import { MOCK_CATEGORIES, MOCK_ITEMS } from './mockData';

export const guestApi = {
  startSession: async (tableId: string, token: string) => {
    try {
      return await axiosClient.post('/guest/session', { tableId, token });
    } catch (err) {
      console.warn("Backend unavailable, using demo guest session:", err);
      return {
        session: { id: 'demo-session-' + Date.now(), tableId, status: 'OPEN' }
      };
    }
  },
  placeOrder: async (data: any) => {
    try {
      return await axiosClient.post('/orders', data);
    } catch (err) {
      console.warn("Backend unavailable, using demo order simulation:", err);
      return {
        success: true,
        order: {
          id: 'demo-order-' + Math.floor(Math.random() * 10000),
          status: 'RECEIVED',
          totalAmount: data.totalAmount || 150000,
          items: data.items || [],
          createdAt: new Date().toISOString()
        }
      };
    }
  },

  getCategories: async () => {
    try {
      const res = await axiosClient.get('/guest/categories');
      if (res && (res as any).data && (res as any).data.length > 0) {
        return res;
      }
      return { data: MOCK_CATEGORIES };
    } catch (err) {
      return { data: MOCK_CATEGORIES };
    }
  },

  getMenuItems: async (params: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    isChefRecommended?: boolean;
    sortBy?: string;
  }) => {
    try {
      const res = await axiosClient.get('/guest/menu-items', { params });
      if (res && (res as any).data && (res as any).data.length > 0) {
        return res;
      }
      // Filter mock items
      let filtered = [...MOCK_ITEMS];
      if (params.categoryId && params.categoryId !== 'all') {
        filtered = filtered.filter(i => i.categoryId === params.categoryId);
      }
      if (params.isChefRecommended) {
        filtered = filtered.filter(i => i.isChefRecommended);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
      }
      return {
        data: filtered,
        pagination: { totalPages: 1, page: 1, limit: params.limit, total: filtered.length }
      };
    } catch (err) {
      let filtered = [...MOCK_ITEMS];
      if (params.categoryId && params.categoryId !== 'all') {
        filtered = filtered.filter(i => i.categoryId === params.categoryId);
      }
      if (params.isChefRecommended) {
        filtered = filtered.filter(i => i.isChefRecommended);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
      }
      return {
        data: filtered,
        pagination: { totalPages: 1, page: 1, limit: params.limit, total: filtered.length }
      };
    }
  },

  getOrderDetails: (tableSessionId: string) => axiosClient.get(`/guest/orders/${tableSessionId}`),
  requestBill: (orderId: string) => axiosClient.post(`/guest/orders/${orderId}/request-bill`),

  getReviews: (menuItemId: string, params: { page: number; limit: number }) =>
    axiosClient.get(`/guest/menu-items/${menuItemId}/reviews`, { params }).catch(() => ({ data: [], hasMore: false })),
  createReview: (menuItemId: string, data: { rating: number; comment: string; customerName?: string; tableSessionId: string }) =>
    axiosClient.post(`/guest/menu-items/${menuItemId}/reviews`, data),
};

