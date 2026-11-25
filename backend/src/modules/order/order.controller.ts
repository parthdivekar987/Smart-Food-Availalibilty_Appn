import { Request, Response } from "express";
import * as orderService from "./order.service";
import * as notificationService from "../notification/notification.service";
import { OrderStatus } from "@prisma/client";
import jwt from "jsonwebtoken";

/**
 * Get all orders (Admin/Staff)
 */
export const getOrders = async (req: Request, res: Response) => {
    try {
        const { page, limit, status, sortBy, sortOrder } = req.query as any;

        const result = await orderService.getOrders({
            page,
            limit,
            status: status as OrderStatus,
            sortBy,
            sortOrder,
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};


/**
 * Update order items status (Waiter checks items)
 */
export const updateOrderItems = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { items } = req.body; // Expects [{itemId, status}]

        const updatedOrder = await orderService.updateOrderItems(id, items);

        res.json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update order items" });
    }
};

/**
 * Update order status (Approve/Reject/Ready/Completed)
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedOrder = await orderService.updateOrderStatus(id, status as OrderStatus);

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: "Failed to update order status" });
    }
};

/**
 * Update dynamic estimated preparation time (Super Admin or Waiter)
 */
export const updateOrderEstimate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { estimatedMinutes, note } = req.body;

        if (estimatedMinutes === undefined || isNaN(Number(estimatedMinutes))) {
            return res.status(400).json({ error: "estimatedMinutes is required and must be a number" });
        }

        const updatedOrder = await orderService.updateOrderEstimate(id, Number(estimatedMinutes), note);
        res.json(updatedOrder);
    } catch (error: any) {
        console.error("Error updating order estimate:", error);
        res.status(500).json({ error: error.message || "Failed to update order estimate" });
    }
};


/**
 * Create a new order (Guest creates from cart)
 */
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { tableSessionId, items } = req.body;
        let userId: string | undefined;

        // Try to get user from token if available
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any;
                userId = decoded.userId; // JWT uses 'userId' not 'id'
            } catch (err) {
                // Ignore invalid token, proceed as guest
            }
        }

        const order = await orderService.createOrder({ tableSessionId, items, userId });

        // Realtime: staff screens only (never broadcast orders to other guests)
        notificationService.notifyStaffNewOrderPayload(order);

        res.status(201).json(order);
    } catch (error: any) {
        console.error(error);
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        res.status(500).json({ message: "Failed to place order. Please try again." });
    }
};

/**
 * Get order by table session ID
 */
export const getOrderBySession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        const order = await orderService.getOrderByTableSession(sessionId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch order" });
    }
};

/**
 * Complete order and close session (Waiter confirms payment received)
 */
export const completeOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await orderService.completeOrderAndCloseSession(id);


        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || "Failed to complete order" });
    }
};

/**
 * Staff (waiter/admin) adds items to a seated table's order on the guest's behalf.
 * Prices are always taken from the menu; the guest's devices are notified in real time.
 * POST /orders/session/:sessionId/items  { items: [{ id, quantity, selectedModifiers? , note? }] }
 */
export const addItemsByStaff = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const { items } = req.body || {};
        const staff = req.user as any;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Select at least one item to add" });
        }
        if (items.length > 30) {
            return res.status(400).json({ message: "Too many different items in one request" });
        }
        const order = await orderService.createOrder({
            tableSessionId: sessionId,
            items: items.map((i: any) => ({
                id: String(i.id || ""),
                quantity: Number(i.quantity),
                price: 0, // replaced by the server-side menu price
                note: typeof i.note === "string" ? i.note.slice(0, 200) : undefined,
                selectedModifiers: i.selectedModifiers,
            })),
            addedBy: { id: staff.id, name: staff.fullName || "Staff", role: staff.role },
        });
        notificationService.notifyStaffNewOrderPayload(order);
        res.status(201).json(order);
    } catch (error: any) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        console.error("[orders] staff add items failed:", error);
        res.status(500).json({ message: "Failed to add items. Please try again." });
    }
};
