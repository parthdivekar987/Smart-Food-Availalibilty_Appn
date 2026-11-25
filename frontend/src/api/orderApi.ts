import axiosClient from "./axiosClient";
import { Order } from "../types/order.types";

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
  getOrders: (params: GetOrdersParams): Promise<GetOrdersResponse> =>
    axiosClient.get("/orders", { params }) as unknown as Promise<GetOrdersResponse>,

  updateStatus: (id: string, status: string): Promise<Order> =>
    axiosClient.patch(`/orders/${id}/status`, { status }) as unknown as Promise<Order>,

  updateEstimate: (id: string, estimatedMinutes: number, note?: string): Promise<any> =>
    axiosClient.patch(`/orders/${id}/estimate`, { estimatedMinutes, note }),
};
