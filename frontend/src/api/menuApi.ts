import axiosClient from "./axiosClient";
import { MenuItem, ModifierGroup, ModifierOption } from "../types";
import { 
    GetMenuItemsParams, 
    MenuItemsResponse, 
    CreateMenuItemRequest,
    CreateModifierGroupRequest,
    CreateModifierOptionRequest
} from "../types/menu.types";
import { MOCK_ITEMS, saveLocalMenuItems, loadLocalMenuItems } from "./mockData";

export const menuApi = {
    // 1. Get Menu Items (Filter/Search)
    getMenuItems: async (params?: GetMenuItemsParams): Promise<MenuItemsResponse> => {
        try {
            return (await axiosClient.get<MenuItemsResponse>("/menu", { params })) as unknown as MenuItemsResponse;
        } catch (e) {
            console.warn("Backend offline, returning mock menu items:", e);
            loadLocalMenuItems();

            let items = [...MOCK_ITEMS];

            if (params?.categoryId) {
                items = items.filter(i => i.categoryId === params.categoryId);
            }

            if (params?.search) {
                const q = params.search.toLowerCase().trim();
                items = items.filter(i => 
                    i.name.toLowerCase().includes(q) || 
                    (i.description && i.description.toLowerCase().includes(q))
                );
            }

            if (params?.sortBy) {
                if (params.sortBy === 'price_ASC') {
                    items.sort((a, b) => a.price - b.price);
                } else if (params.sortBy === 'price_DESC') {
                    items.sort((a, b) => b.price - a.price);
                } else if (params.sortBy === 'name_ASC') {
                    items.sort((a, b) => a.name.localeCompare(b.name));
                } else if (params.sortBy === 'name_DESC') {
                    items.sort((a, b) => b.name.localeCompare(a.name));
                }
            }

            return {
                data: items as any,
                pagination: {
                    total: items.length,
                    page: params?.page || 1,
                    limit: params?.limit || 20,
                    totalPages: Math.ceil(items.length / (params?.limit || 20)) || 1,
                },
            };
        }
    },

    // 2. Get Menu Items by Category
    getMenuItemsByCategory: async (categoryId: string): Promise<MenuItem[]> => {
        try {
            return (await axiosClient.get<MenuItem[]>(`/menu/menu-items/category/${categoryId}`)) as unknown as MenuItem[];
        } catch (e) {
            loadLocalMenuItems();
            return MOCK_ITEMS.filter(i => i.categoryId === categoryId);
        }
    },

    // 3. Get Menu Item by ID
    getMenuItemById: async (id: string): Promise<MenuItem> => {
        try {
            return (await axiosClient.get<MenuItem>(`/menu/menu-items/${id}`)) as unknown as MenuItem;
        } catch (e) {
            loadLocalMenuItems();
            return MOCK_ITEMS.find(i => i.id === id) || MOCK_ITEMS[0];
        }
    },

    // 4. Create Menu Item
    createMenuItem: async (data: CreateMenuItemRequest): Promise<MenuItem> => {
        try {
            return (await axiosClient.post<MenuItem>("/menu/menu-items", data)) as unknown as MenuItem;
        } catch (e) {
            console.warn("Backend offline, saving menu item to local store:", e);
            const newItem: MenuItem = {
                id: `item-${Date.now()}`,
                name: data.name,
                price: Number(data.price),
                description: data.description || '',
                categoryId: data.categoryId,
                isChefRecommended: !!data.isChefRecommended,
                status: (data.status as any) || 'AVAILABLE',
                prepTime: data.prepTime ? Number(data.prepTime) : 15,
                photos: [],
                modifierGroups: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as any;

            MOCK_ITEMS.unshift(newItem);
            saveLocalMenuItems();
            return newItem;
        }
    },

    // 5. Update Menu Item
    updateMenuItem: async (id: string, data: Partial<CreateMenuItemRequest>): Promise<MenuItem> => {
        try {
            return (await axiosClient.patch<MenuItem>(`/menu/menu-items/${id}`, data)) as unknown as MenuItem;
        } catch (e) {
            console.warn("Backend offline, updating local item:", id, data);
            const index = MOCK_ITEMS.findIndex(i => i.id === id);
            if (index !== -1) {
                MOCK_ITEMS[index] = { ...MOCK_ITEMS[index], ...data } as any;
                saveLocalMenuItems();
                return MOCK_ITEMS[index];
            }
            return { id, ...data } as any;
        }
    },

    // 6. Delete Menu Item
    deleteMenuItem: async (id: string): Promise<{ message: string }> => {
        try {
            return (await axiosClient.delete<{ message: string }>(`/menu/menu-items/${id}`)) as unknown as { message: string };
        } catch (e) {
            console.warn("Backend offline, deleting local item:", id);
            const index = MOCK_ITEMS.findIndex(i => i.id === id);
            if (index !== -1) {
                MOCK_ITEMS.splice(index, 1);
                saveLocalMenuItems();
            }
            return { message: "Deleted" };
        }
    },

    // 7. Modifiers
    createModifierGroup: (data: CreateModifierGroupRequest) => {
        return axiosClient.post<ModifierGroup>("/menu/modifiers/groups", data) as unknown as Promise<ModifierGroup>;
    },

    updateModifierGroup: (id: string, data: { name?: string; required?: boolean }) => {
        return axiosClient.patch<ModifierGroup>(`/menu/modifiers/groups/${id}`, data) as unknown as Promise<ModifierGroup>;
    },

    deleteModifierGroup: (id: string) => {
        return axiosClient.delete<{ message: string }>(`/menu/modifiers/groups/${id}`) as unknown as Promise<{ message: string }>;
    },

    createModifierOption: (data: CreateModifierOptionRequest) => {
        return axiosClient.post<ModifierOption>("/menu/modifiers/options", data) as unknown as Promise<ModifierOption>;
    },

    updateModifierOption: (id: string, data: Partial<CreateModifierOptionRequest>) => {
        return axiosClient.patch<ModifierOption>(`/menu/modifiers/options/${id}`, data) as unknown as Promise<ModifierOption>;
    },

    deleteModifierOption: (id: string) => {
        return axiosClient.delete<{ message: string }>(`/menu/modifiers/options/${id}`) as unknown as Promise<{ message: string }>;
    },
};
