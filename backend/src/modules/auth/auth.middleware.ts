import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import passport from "passport";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Standard Passport JWT verification
  passport.authenticate("jwt", { session: false }, (err: any, user: any) => {
    if (err || !user) {
      return res.status(401).json({ message: "Unauthorized. Please login." });
    }
    req.user = user;
    next();
  })(req, res, next);
};

export const roleGuard =
  (roles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ message: "Forbidden: Insufficient privileges." });
      return;
    }
    next();
  };
