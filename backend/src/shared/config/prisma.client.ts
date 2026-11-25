import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
    // Remote/serverless databases (e.g. Neon) add per-query latency; the 5s default
    // is too tight for multi-step transactions such as placing an order.
    transactionOptions: {
      maxWait: Number(process.env.DB_TX_MAX_WAIT_MS || 10000),
      timeout: Number(process.env.DB_TX_TIMEOUT_MS || 20000),
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
