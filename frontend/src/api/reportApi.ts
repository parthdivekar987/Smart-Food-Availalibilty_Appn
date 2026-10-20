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

const MOCK_REVENUE_CHART: RevenueData[] = [
    { date: '10:00', revenue: 1200000 },
    { date: '12:00', revenue: 4500000 },
    { date: '14:00', revenue: 2800000 },
    { date: '16:00', revenue: 1900000 },
    { date: '18:00', revenue: 6800000 },
    { date: '20:00', revenue: 8400000 },
    { date: '22:00', revenue: 3200000 },
];

const MOCK_TOP_SELLING: TopSellingItem[] = [
    { name: 'Wagyu Ribeye Truffle Steak', quantity: 42 },
    { name: 'Double Smokehouse Bacon Burger', quantity: 38 },
    { name: 'Black Truffle Burrata Pizza', quantity: 29 },
    { name: 'Dragon Roll Salmon', quantity: 24 },
    { name: 'Citrus Passion Mocktail', quantity: 51 },
];

export const reportApi = {
    getDashboardStats: async (startDate?: string, endDate?: string): Promise<DashboardStats> => {
        try {
            return (await axiosClient.get('/reports/dashboard', { params: { startDate, endDate } })) as unknown as DashboardStats;
        } catch (e) {
            return {
                revenue: 28800000,
                orders: 48,
                activeGuests: 19,
            };
        }
    },

    getRevenueByDate: async (startDate: string, endDate: string): Promise<RevenueData[]> => {
        try {
            return (await axiosClient.get('/reports/revenue', { params: { startDate, endDate } })) as unknown as RevenueData[];
        } catch (e) {
            return MOCK_REVENUE_CHART;
        }
    },

    getTopSellingItems: async (startDate?: string, endDate?: string): Promise<TopSellingItem[]> => {
        try {
            return (await axiosClient.get('/reports/top-selling', { params: { startDate, endDate } })) as unknown as TopSellingItem[];
        } catch (e) {
            return MOCK_TOP_SELLING;
        }
    },

    getUserStats: async (startDate: string, endDate: string): Promise<UserStats> => {
        try {
            return (await axiosClient.get('/reports/user-stats', { params: { startDate, endDate } })) as unknown as UserStats;
        } catch (e) {
            return {
                newUsers: 14,
                topSpenders: [
                    { name: 'Alex Morgan', email: 'alex.morgan@gmail.com', totalSpent: 2850000 },
                    { name: 'David Beck', email: 'david.beck@outlook.com', totalSpent: 2190000 },
                    { name: 'Elena Rostova', email: 'elena.rostova@gmail.com', totalSpent: 1740000 },
                ],
            };
        }
    },

    getCategoryStats: async (startDate: string, endDate: string): Promise<CategoryData[]> => {
        try {
            return (await axiosClient.get('/reports/category-stats', { params: { startDate, endDate } })) as unknown as CategoryData[];
        } catch (e) {
            return [
                { name: 'Chef Specials', value: 38 },
                { name: 'Gourmet Burgers', value: 24 },
                { name: 'Artisan Pizza', value: 18 },
                { name: 'Sushi & Asian', value: 12 },
                { name: 'Drinks', value: 8 },
            ];
        }
    },

    getPaymentStats: async (startDate: string, endDate: string): Promise<PaymentData[]> => {
        try {
            return (await axiosClient.get('/reports/payment-stats', { params: { startDate, endDate } })) as unknown as PaymentData[];
        } catch (e) {
            return [
                { name: 'Credit Card / Stripe', value: 62 },
                { name: 'Mobile / Apple Pay', value: 28 },
                { name: 'Cash', value: 10 },
            ];
        }
    },
};
