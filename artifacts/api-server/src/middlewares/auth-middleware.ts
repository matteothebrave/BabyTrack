import { type RequestHandler } from "express";

const PUBLIC_PATHS = ["/api/healthz", "/api/auth/status", "/api/auth/login", "/api/auth/logout"];

export const authMiddleware: RequestHandler = (req, res, next) => {
  const isPublic = PUBLIC_PATHS.some((p) => req.path === p || req.path.startsWith(p));
  if (isPublic) return next();

  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};
