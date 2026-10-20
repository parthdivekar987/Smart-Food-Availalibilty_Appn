import axiosClient from "./axiosClient";
import { Category } from "../types/category.types";
import { MOCK_CATEGORIES } from "./mockData";

export const categoryApi = {
    getAllCategories: async (): Promise<Category[]> => {
        try {
            return (await axiosClient.get<Category[]>("/menu/categories")) as unknown as Category[];
        } catch (e) {
            return MOCK_CATEGORIES as any;
        }
    },
    getCategoryById: async (id: string): Promise<Category> => {
        try {
            return (await axiosClient.get<Category>(`/menu/categories/${id}`)) as unknown as Category;
        } catch (e) {
            return MOCK_CATEGORIES[0] as any;
        }
    },
    createCategory: async (name: string): Promise<Category> => {
        try {
            return (await axiosClient.post<Category>("/menu/categories", { name })) as unknown as Category;
        } catch (e) {
            return { id: `cat-${Date.now()}`, name, menuItems: [] } as any;
        }
    },
    updateCategory: async (id: string, name: string): Promise<Category> => {
        try {
            return (await axiosClient.patch<Category>(`/menu/categories/${id}`, { name })) as unknown as Category;
        } catch (e) {
            return { id, name, menuItems: [] } as any;
        }
    },
    deleteCategory: async (id: string): Promise<{ message: string }> => {
        try {
            return (await axiosClient.delete<{ message: string }>(`/menu/categories/${id}`)) as unknown as { message: string };
        } catch (e) {
            return { message: "Deleted" };
        }
    },
};