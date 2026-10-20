import axiosClient from "./axiosClient";
import { GetUsersParams, GetUsersResponse, Role } from "../types/user.types";
import { MOCK_CUSTOMERS, MOCK_EMPLOYEES } from "./mockData";

export const userApi = {
  getUsers: async (params: GetUsersParams): Promise<GetUsersResponse> => {
    try {
      const res = await axiosClient.get<GetUsersResponse>("/users", { params });
      return res as unknown as GetUsersResponse;
    } catch (error) {
      console.warn("Backend offline, returning mock users:", error);
      const isEmployee = (params.role && params.role !== Role.CUSTOMER) || (params as any).isEmployee;
      const data = isEmployee ? MOCK_EMPLOYEES : MOCK_CUSTOMERS;
      return {
        data,
        pagination: {
          total: data.length,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      };
    }
  },

  createUser: async (data: any) => {
    try {
      return await axiosClient.post("/users", data);
    } catch (e) {
      return { data: { id: `user-${Date.now()}`, ...data } };
    }
  },

  updateUser: async (id: string, data: any) => {
    try {
      return await axiosClient.patch(`/users/${id}`, data);
    } catch (e) {
      return { data: { id, ...data } };
    }
  },

  deleteUser: async (id: string) => {
    try {
      return await axiosClient.delete(`/users/${id}`);
    } catch (e) {
      return { success: true };
    }
  },

  // Profile endpoints (for logged-in customers)
  getProfile: async () => {
    try {
      return await axiosClient.get("/users/profile");
    } catch (e) {
      return { data: MOCK_CUSTOMERS[0] };
    }
  },

  updateProfile: async (data: { fullName: string }) => {
    return axiosClient.patch("/users/profile", data);
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    return axiosClient.patch("/users/profile/password", data);
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return axiosClient.post("/users/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getOrderHistory: async (page: number = 1, limit: number = 10) => {
    return axiosClient.get("/users/profile/orders", { params: { page, limit } });
  },
};
