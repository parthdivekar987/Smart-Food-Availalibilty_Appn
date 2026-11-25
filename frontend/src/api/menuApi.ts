import axiosClient from "./axiosClient";
import { MenuItem, ModifierGroup, ModifierOption } from "../types";
import {
    GetMenuItemsParams,
    MenuItemsResponse,
    CreateMenuItemRequest,
    CreateModifierGroupRequest,
    CreateModifierOptionRequest
} from "../types/menu.types";

export const menuApi = {
    getMenuItems: (params?: GetMenuItemsParams): Promise<MenuItemsResponse> =>
        axiosClient.get("/menu", { params }) as unknown as Promise<MenuItemsResponse>,

    getMenuItemsByCategory: (categoryId: string): Promise<MenuItem[]> =>
        axiosClient.get(`/menu/menu-items/category/${categoryId}`) as unknown as Promise<MenuItem[]>,

    getMenuItemById: (id: string): Promise<MenuItem> =>
        axiosClient.get(`/menu/menu-items/${id}`) as unknown as Promise<MenuItem>,

    createMenuItem: (data: CreateMenuItemRequest): Promise<MenuItem> =>
        axiosClient.post("/menu/menu-items", data) as unknown as Promise<MenuItem>,

    updateMenuItem: (id: string, data: Partial<CreateMenuItemRequest>): Promise<MenuItem> =>
        axiosClient.patch(`/menu/menu-items/${id}`, data) as unknown as Promise<MenuItem>,

    deleteMenuItem: (id: string): Promise<{ message: string }> =>
        axiosClient.delete(`/menu/menu-items/${id}`) as unknown as Promise<{ message: string }>,

    // Modifiers
    createModifierGroup: (data: CreateModifierGroupRequest) =>
        axiosClient.post("/menu/modifiers/groups", data) as unknown as Promise<ModifierGroup>,

    updateModifierGroup: (id: string, data: { name?: string; required?: boolean }) =>
        axiosClient.patch(`/menu/modifiers/groups/${id}`, data) as unknown as Promise<ModifierGroup>,

    deleteModifierGroup: (id: string) =>
        axiosClient.delete(`/menu/modifiers/groups/${id}`) as unknown as Promise<{ message: string }>,

    createModifierOption: (data: CreateModifierOptionRequest) =>
        axiosClient.post("/menu/modifiers/options", data) as unknown as Promise<ModifierOption>,

    updateModifierOption: (id: string, data: Partial<CreateModifierOptionRequest>) =>
        axiosClient.patch(`/menu/modifiers/options/${id}`, data) as unknown as Promise<ModifierOption>,

    deleteModifierOption: (id: string) =>
        axiosClient.delete(`/menu/modifiers/options/${id}`) as unknown as Promise<{ message: string }>,
};
