import { Router } from "express";
import { Role } from "@prisma/client";
import * as sessionController from "./session.controller";
import { authMiddleware, roleGuard } from "../auth/auth.middleware";

const router = Router();
const staff = [Role.WAITER, Role.ADMIN, Role.SUPER_ADMIN];

// Public (guest devices)
router.get("/:sessionId/status", sessionController.getSessionStatus);

// Staff
router.get("/live", authMiddleware, roleGuard(staff), sessionController.getLiveSessions);
router.get("/:sessionId/events", authMiddleware, roleGuard(staff), sessionController.getSessionEvents);

export default router;
