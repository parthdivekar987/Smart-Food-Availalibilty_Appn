import { Prisma } from "@prisma/client";
import prisma from "../../shared/config/prisma.client";
import * as notificationService from "../notification/notification.service";
import { redisService } from "../../shared/services/redis.service";
import { regenerateTableQRCode } from "../table/table.service";

export type SessionEventType =
    | "SESSION_STARTED"
    | "CART_ITEM_ADDED"
    | "ORDER_PLACED"
    | "STAFF_ADDED_ITEMS"
    | "BILL_REQUESTED"
    | "PAYMENT_COMPLETED"
    | "SESSION_CLOSED";

export type SessionActor = "GUEST" | "STAFF" | "SYSTEM";

interface LogEventInput {
    tableSessionId: string;
    type: SessionEventType;
    actor: SessionActor;
    actorName?: string | null;
    message: string;
    data?: Prisma.InputJsonValue;
}

/**
 * Record a session event and push it to staff dashboards.
 * Never throws: activity tracking must not break ordering or payment flows.
 */
export const logSessionEvent = async (input: LogEventInput) => {
    try {
        const event = await prisma.tableSessionEvent.create({
            data: {
                tableSessionId: input.tableSessionId,
                type: input.type,
                actor: input.actor,
                actorName: input.actorName ?? null,
                message: input.message.slice(0, 500),
                data: input.data,
            },
            include: { tableSession: { select: { table: { select: { id: true, name: true } } } } },
        });
        const { tableSession, ...rest } = event;
        notificationService.notifySessionActivity({
            ...rest,
            tableId: tableSession.table.id,
            tableName: tableSession.table.name,
        });
        return event;
    } catch (error: any) {
        console.error(`[activity] could not log ${input.type} for ${input.tableSessionId}:`, error.message);
        return null;
    }
};

/** Fire-and-forget variant for hot paths (does not add DB latency to the response) */
export const logSessionEventAsync = (input: LogEventInput) => {
    void logSessionEvent(input);
};

/** Public: lightweight status check so guest devices can detect a closed session (e.g. after reconnecting) */
export const getSessionStatus = async (sessionId: string) => {
    const session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        select: { id: true, status: true, endedAt: true, table: { select: { id: true, name: true } } },
    });
    if (!session) {
        const err: any = new Error("Session not found");
        err.status = 404;
        throw err;
    }
    return {
        id: session.id,
        status: session.status,
        endedAt: session.endedAt,
        tableId: session.table.id,
        tableName: session.table.name,
    };
};

/** Staff: all open table sessions with order summary and recent activity */
export const getLiveSessions = async () => {
    const sessions = await prisma.tableSession.findMany({
        where: { status: "OPEN" },
        orderBy: { startedAt: "asc" },
        include: {
            table: { select: { id: true, name: true, capacity: true } },
            waiter: { select: { id: true, fullName: true } },
            order: {
                select: {
                    id: true,
                    status: true,
                    totalAmount: true,
                    billRequested: true,
                    createdAt: true,
                    items: {
                        where: { status: { not: "CANCELLED" } },
                        select: { id: true, quantity: true, price: true, status: true, menuItem: { select: { name: true } } },
                    },
                },
            },
            events: { orderBy: { createdAt: "desc" }, take: 12 },
        },
    });
    return sessions.map((s) => ({
        id: s.id,
        startedAt: s.startedAt,
        table: s.table,
        waiter: s.waiter,
        order: s.order
            ? {
                ...s.order,
                itemCount: s.order.items.reduce((n, i) => n + i.quantity, 0),
            }
            : null,
        lastActivityAt: s.events[0]?.createdAt ?? s.startedAt,
        events: s.events,
    }));
};

/** Staff: full timeline for one session */
export const getSessionEvents = async (sessionId: string, limit = 200) => {
    return prisma.tableSessionEvent.findMany({
        where: { tableSessionId: sessionId },
        orderBy: { createdAt: "asc" },
        take: Math.min(Math.max(limit, 1), 500),
    });
};

/**
 * Called once a session has been closed by payment/checkout:
 *  - clears the cached guest order
 *  - logs the payment + checkout
 *  - logs every guest device out (socket `session_closed`)
 *  - optionally rotates the table QR so an old photo/link of the code cannot start a new session
 */
export const finalizeClosedSession = async (input: {
    tableSessionId: string;
    reason: "PAID" | "CLOSED_BY_STAFF";
    method?: string | null;
    amountPaid?: number | null;
    closedBy?: string | null;
}) => {
    const session = await prisma.tableSession.findUnique({
        where: { id: input.tableSessionId },
        select: { id: true, table: { select: { id: true, name: true } } },
    });
    if (!session) return;

    await redisService.del(`order:session:${input.tableSessionId}`).catch(() => {});

    if (input.reason === "PAID") {
        await logSessionEvent({
            tableSessionId: input.tableSessionId,
            type: "PAYMENT_COMPLETED",
            actor: input.closedBy ? "STAFF" : "SYSTEM",
            actorName: input.closedBy ?? null,
            message: `Bill paid${input.method ? ` by ${input.method.toLowerCase()}` : ""}${input.amountPaid != null ? ` (${input.amountPaid})` : ""}`,
            data: { method: input.method ?? null, amountPaid: input.amountPaid ?? null },
        });
    }
    await logSessionEvent({
        tableSessionId: input.tableSessionId,
        type: "SESSION_CLOSED",
        actor: "SYSTEM",
        message: `${session.table.name} checked out — guests logged out and table released`,
    });

    notificationService.notifySessionClosed({
        tableSessionId: input.tableSessionId,
        tableId: session.table.id,
        tableName: session.table.name,
        reason: input.reason,
        amountPaid: input.amountPaid ?? null,
        method: input.method ?? null,
    });

    // Optional hardening: invalidate the physical QR after every checkout.
    // Only enable when QR codes are shown on a screen/tablet that refreshes (printed codes would stop working).
    if (process.env.ROTATE_QR_ON_CHECKOUT === "true") {
        try {
            await regenerateTableQRCode(session.table.id);
            console.log(`🔐 Rotated QR code for ${session.table.name} after checkout`);
        } catch (error: any) {
            console.error(`[checkout] QR rotation failed for ${session.table.name}:`, error.message);
        }
    }
};
