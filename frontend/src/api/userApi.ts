import axiosClient from "./axiosClient";
import { GetUsersParams, GetUsersResponse } from "../types/user.types";

export const userApi = {
  getUsers: (params: GetUsersParams): Promise<GetUsersResponse> =>
    axiosClient.get("/users", { params }) as unknown as Promise<GetUsersResponse>,

  createUser: (data: any) => axiosClient.post("/users", data),

  updateUser: (id: string, data: any) => axiosClient.patch(`/users/${id}`, data),

  deleteUser: (id: string) => axiosClient.delete(`/users/${id}`),

  // Profile endpoints (for logged-in customers)
  getProfile: () => axiosClient.get("/users/profile"),

  updateProfile: (data: { fullName: string }) => axiosClient.patch("/users/profile", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    axiosClient.patch("/users/profile/password", data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return axiosClient.post("/users/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getOrderHistory: (page: number = 1, limit: number = 10) =>
    axiosClient.get("/users/profile/orders", { params: { page, limit } }),
};
