import axiosClient from "./axiosClient";
import { Order } from "../types/order.types";
import { MOCK_ORDERS } from "./mockData";

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface GetOrdersResponse {
  data: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const orderApi = {
  getOrders: async (params: GetOrdersParams): Promise<GetOrdersResponse> => {
    try {
      const res = await axiosClient.get<GetOrdersResponse>("/orders", { params });
      return res as unknown as GetOrdersResponse;
    } catch (e) {
      console.warn("Backend offline, returning mock orders:", e);
      return {
        data: MOCK_ORDERS as any,
        pagination: {
          total: MOCK_ORDERS.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };
    }
  },

  updateStatus: async (id: string, status: string): Promise<Order> => {
    try {
      return (await axiosClient.patch<Order>(`/orders/${id}/status`, { status })) as unknown as Order;
    } catch (e) {
      return { id, status } as any;
    }
  },
};
