import axiosClient from "./axiosClient";
import { Table } from "../types";

export const tableApi = {
    // 1. Get List of Tables
    getTables: async () => {
        try {
            return await axiosClient.get<{ data: Table[] }>("/tables");
        } catch (e) {
            console.warn("Using mock tables:", e);
            const mockTables: Table[] = [
                { id: 'tbl-1', name: 'Table 01 (VIP Booth)', capacity: 4, isActive: true, restaurantId: 'r1' },
                { id: 'tbl-2', name: 'Table 02 (Window)', capacity: 2, isActive: true, restaurantId: 'r1' },
                { id: 'tbl-3', name: 'Table 03 (Window)', capacity: 2, isActive: false, restaurantId: 'r1' },
                { id: 'tbl-4', name: 'Table 04 (Main Hall)', capacity: 4, isActive: true, restaurantId: 'r1' },
                { id: 'tbl-5', name: 'Table 05 (Family Dining)', capacity: 6, isActive: true, restaurantId: 'r1' },
                { id: 'tbl-6', name: 'Table 06 (Terrace Patio)', capacity: 4, isActive: false, restaurantId: 'r1' },
                { id: 'tbl-7', name: 'Table 07 (Terrace Patio)', capacity: 4, isActive: true, restaurantId: 'r1' },
                { id: 'tbl-8', name: 'Table 08 (Banquet Suite)', capacity: 8, isActive: true, restaurantId: 'r1' },
            ];
            return { data: mockTables } as any;
        }
    },

    // 2. Create Table
    // Response: Table object
    createTable: (name: string, capacity: number) => {
        return axiosClient.post<Table>("/tables", { name, capacity })
    },

    // 3. Update Table (Status, Name, Capacity)
    // Response: Updated Table
    updateTable: (id: string, data: Partial<Table>) => {
        return axiosClient.patch<Table>(`/tables/${id}`, data)
    },

    // 4. Get Table QR Code
    // Response: { data: string (base64/url) }
    getTableQR: (id: string) => {
        return axiosClient.get<{ data: string }>(`/tables/${id}/qr`)
    },

    // 5. Regenerate QR Code for single table
    // Response: { data: string, message: string }
    regenerateTableQR: (id: string) => {
        return axiosClient.post<{ data: string; message: string }>(`/tables/${id}/regenerate-qr`)
    },

    // 6. Regenerate ALL QR Codes
    // Response: { message: string, data: { total, successful, failed, results } }
    regenerateAllQRs: () => {
        return axiosClient.post<{ message: string; data: any }>("/tables/regenerate-all-qr")
    },

    // 6.1 Get ALL QR Images (Base64)
    getAllQRImages: () => {
        return axiosClient.get<{ data: { id: string, name: string, capacity: number, qrDataUrl: string }[] }>("/tables/qrs/all")
    },

    // 7. Delete Table
    // Response: { message: string }
    deleteTable: (id: string) => {
        return axiosClient.delete<{ message: string }>(`/tables/${id}`)
    }
};
