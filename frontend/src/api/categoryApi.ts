import axiosClient from "./axiosClient";
import { Category } from "../types/category.types";

export const categoryApi = {
    getAllCategories: (): Promise<Category[]> =>
        axiosClient.get("/menu/categories") as unknown as Promise<Category[]>,

    getCategoryById: (id: string): Promise<Category> =>
        axiosClient.get(`/menu/categories/${id}`) as unknown as Promise<Category>,

    createCategory: (name: string): Promise<Category> =>
        axiosClient.post("/menu/categories", { name }) as unknown as Promise<Category>,

    updateCategory: (id: string, name: string): Promise<Category> =>
        axiosClient.patch(`/menu/categories/${id}`, { name }) as unknown as Promise<Category>,

    deleteCategory: (id: string): Promise<{ message: string }> =>
        axiosClient.delete(`/menu/categories/${id}`) as unknown as Promise<{ message: string }>,
};
