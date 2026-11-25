import { Server as SocketIOServer, Socket } from "socket.io";
import prisma from "../../shared/config/prisma.client";
import { verifyAccessToken } from "../../shared/utils/token";
import { rooms } from "../notification/notification.service";
import { logSessionEventAsync } from "../session/session.service";

/** Which account roles may join which staff room */
const ROOM_ACCESS: Record<string, { room: string; roles: string[] }> = {
    WAITER: { room: rooms.WAITER, roles: ["WAITER", "ADMIN", "SUPER_ADMIN"] },
    KITCHEN: { room: rooms.KITCHEN, roles: ["KITCHEN", "ADMIN", "SUPER_ADMIN"] },
    ADMIN: { room: rooms.ADMIN, roles: ["ADMIN", "SUPER_ADMIN"] },
    SUPER_ADMIN: { room: rooms.ADMIN, roles: ["ADMIN", "SUPER_ADMIN"] },
};

const CART_EVENTS_PER_MINUTE = 30;

type Ack = (response: { ok: boolean; message?: string }) => void;

const isNonEmptyString = (v: unknown, max = 100): v is string =>
    typeof v === "string" && v.length > 0 && v.length <= max;

/** Authenticate a staff socket from its access token; returns the account or null */
const authenticateStaff = async (token: unknown) => {
    if (!isNonEmptyString(token, 4096)) return null;
    try {
        const payload = verifyAccessToken(token) as { userId?: string };
        if (!payload?.userId) return null;
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, fullName: true, role: true, isActive: true },
        });
        return user && user.isActive !== false ? user : null;
    } catch {
        return null;
    }
};

export const registerSocketHandlers = (io: SocketIOServer) => {
    io.on("connection", (socket: Socket) => {
        const cartRate = { windowStart: Date.now(), count: 0 };

        /**
         * join_room { role?, token?, tableSessionId? }
         * - Staff rooms require a valid access token whose account has the right role.
         * - Guests join their table's session room only while the session is OPEN;
         *   a closed session immediately receives `session_closed` (handles reconnects after checkout).
         */
        socket.on("join_room", async (data: { role?: string; token?: string; tableSessionId?: string } = {}, ack?: Ack) => {
            const reply = (ok: boolean, message?: string) => typeof ack === "function" && ack({ ok, message });
            try {
                const access = data.role ? ROOM_ACCESS[data.role] : undefined;
                if (access) {
                    const user = await authenticateStaff(data.token);
                    if (!user || !access.roles.includes(user.role)) {
                        socket.emit("room_error", { room: data.role, message: "Not authorised for this live feed. Please sign in again." });
                        return reply(false, "unauthorised");
                    }
                    socket.join(access.room);
                    socket.data.user = { id: user.id, name: user.fullName, role: user.role };
                }

                if (data.tableSessionId) {
                    if (!isNonEmptyString(data.tableSessionId)) return reply(false, "invalid session");
                    const session = await prisma.tableSession.findUnique({
                        where: { id: data.tableSessionId },
                        select: { id: true, status: true, table: { select: { id: true, name: true } } },
                    });
                    if (!session || session.status !== "OPEN") {
                        socket.emit("session_closed", {
                            type: "SESSION_CLOSED",
                            tableSessionId: data.tableSessionId,
                            tableId: session?.table.id ?? null,
                            tableName: session?.table.name ?? null,
                            reason: session ? "CLOSED" : "NOT_FOUND",
                            timestamp: new Date().toISOString(),
                        });
                        return reply(false, "session closed");
                    }
                    socket.join(`session_${session.id}`);
                }
                reply(true);
            } catch (error: any) {
                console.error("[socket] join_room failed:", error.message);
                reply(false, "server error");
            }
        });

        /**
         * cart_activity { tableSessionId, menuItemId, quantity }
         * Guest added something to their cart. Only accepted from sockets that joined the
         * (validated, open) session room. Item name/price are looked up server-side.
         */
        socket.on("cart_activity", async (data: { tableSessionId?: string; menuItemId?: string; quantity?: number } = {}) => {
            try {
                const { tableSessionId, menuItemId, quantity } = data;
                if (!isNonEmptyString(tableSessionId) || !isNonEmptyString(menuItemId)) return;
                if (!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 50) return;
                if (!socket.rooms.has(`session_${tableSessionId}`)) return;

                const now = Date.now();
                if (now - cartRate.windowStart > 60_000) {
                    cartRate.windowStart = now;
                    cartRate.count = 0;
                }
                if (++cartRate.count > CART_EVENTS_PER_MINUTE) return;

                const item = await prisma.menuItem.findUnique({
                    where: { id: menuItemId },
                    select: { id: true, name: true, price: true },
                });
                if (!item) return;

                logSessionEventAsync({
                    tableSessionId,
                    type: "CART_ITEM_ADDED",
                    actor: "GUEST",
                    message: `Added ${quantity} × ${item.name} to cart`,
                    data: { menuItemId: item.id, name: item.name, quantity: quantity as number, unitPrice: item.price },
                });
            } catch (error: any) {
                console.error("[socket] cart_activity failed:", error.message);
            }
        });

        socket.on("leave_room", (room: string) => {
            if (isNonEmptyString(room, 200)) socket.leave(room);
        });
    });
};
