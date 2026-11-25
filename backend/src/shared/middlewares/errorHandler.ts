import { Request, Response, NextFunction } from "express";

/**
 * Central error handler. Never leaks stack traces or internals in production.
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = Number(err.status || err.statusCode) || 500;
  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  }
  const isProd = process.env.NODE_ENV === "production";
  res.status(status).json({
    message: status >= 500 && isProd ? "Internal Server Error" : err.message || "Internal Server Error",
    ...(isProd ? {} : { stack: err.stack }),
  });
}
