import axiosClient from "./axiosClient";

export interface DashboardStats {
    revenue: number;
    orders: number;
    activeGuests: number;
}

export interface RevenueData {
    date: string;
    revenue: number;
}

export interface TopSellingItem {
    name: string;
    quantity: number;
}

export interface UserStats {
    newUsers: number;
    topSpenders: {
        name: string;
        email: string;
        totalSpent: number;
    }[];
}

export interface CategoryData {
    name: string;
    value: number;
}

export interface PaymentData {
    name: string;
    value: number;
}

const get = <T>(url: string, params: Record<string, string | undefined>) =>
    axiosClient.get(url, { params }) as unknown as Promise<T>;

export const reportApi = {
    getDashboardStats: (startDate?: string, endDate?: string) =>
        get<DashboardStats>('/reports/dashboard', { startDate, endDate }),

    getRevenueByDate: (startDate: string, endDate: string) =>
        get<RevenueData[]>('/reports/revenue', { startDate, endDate }),

    getTopSellingItems: (startDate?: string, endDate?: string) =>
        get<TopSellingItem[]>('/reports/top-selling', { startDate, endDate }),

    getUserStats: (startDate: string, endDate: string) =>
        get<UserStats>('/reports/user-stats', { startDate, endDate }),

    getCategoryStats: (startDate: string, endDate: string) =>
        get<CategoryData[]>('/reports/category-stats', { startDate, endDate }),

    getPaymentStats: (startDate: string, endDate: string) =>
        get<PaymentData[]>('/reports/payment-stats', { startDate, endDate }),
};
