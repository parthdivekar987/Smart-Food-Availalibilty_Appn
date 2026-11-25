import { Request, Response } from "express";
import * as sessionService from "./session.service";

/** PUBLIC: is this table session still open? Used by guest devices to detect checkout. */
export const getSessionStatus = async (req: Request, res: Response) => {
    try {
        res.json(await sessionService.getSessionStatus(req.params.sessionId));
    } catch (error: any) {
        res.status(error.status || 500).json({ message: error.status ? error.message : "Failed to check session" });
    }
};

/** STAFF: open tables with order summary and recent activity */
export const getLiveSessions = async (_req: Request, res: Response) => {
    try {
        res.json({ data: await sessionService.getLiveSessions() });
    } catch (error: any) {
        console.error("[sessions] live list failed:", error);
        res.status(500).json({ message: "Failed to load live tables" });
    }
};

/** STAFF: full activity timeline for one session */
export const getSessionEvents = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit) || 200;
        res.json({ data: await sessionService.getSessionEvents(req.params.sessionId, limit) });
    } catch (error: any) {
        console.error("[sessions] events failed:", error);
        res.status(500).json({ message: "Failed to load activity" });
    }
};
