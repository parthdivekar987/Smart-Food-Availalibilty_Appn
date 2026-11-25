import express from "express";
import path from "path";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import session from "express-session";
import passport from "./shared/config/passport";
import cors from "cors";
import { json, urlencoded } from "body-parser";
import { errorHandler } from "./shared/middlewares/errorHandler";
import router from "./modules/registerRoutes";
import { initializeNotificationService } from "./modules/notification/notification.service";
import prisma from "./shared/config/prisma.client";
import { registerSocketHandlers } from "./modules/realtime/socket.handlers";

const app = express();

import { stripeWebhook } from './modules/payment/payment.controller';
// Dùng express.raw cho route webhook cụ thể
app.post('/api/v1/payment/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
const server = http.createServer(app);
// Socket.IO được gắn vào HTTP server để hỗ trợ realtime (websockets).
// Allowed browser origins: FRONTEND_URL plus optional comma-separated CORS_ORIGINS.
const allowedOrigins = [process.env.FRONTEND_URL, ...(process.env.CORS_ORIGINS || "").split(",")]
  .map((o) => (o || "").trim().replace(/\/$/, ""))
  .filter(Boolean);
const corsOrigin = allowedOrigins.length > 0 ? allowedOrigins : true;

const io = new SocketIOServer(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  }
});

// Initialize notification service with Socket.IO
initializeNotificationService(io);
registerSocketHandlers(io);

// Middleware 
app.disable("x-powered-by");
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Phục vụ thư mục ảnh tĩnh để Frontend có thể hiển thị ảnh
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check (used by Docker / load balancers)
app.get("/api/v1/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "up", uptime: Math.round(process.uptime()) });
  } catch {
    res.status(503).json({ status: "degraded", database: "down" });
  }
});

// Routes
app.use("/api/v1", router);

// Unknown API routes -> JSON 404
app.use("/api", (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

export { app, server, io };

