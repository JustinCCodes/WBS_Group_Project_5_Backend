import { Request, Response, NextFunction } from "express";

export const requireCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const csrfCookie = req.cookies?.csrfToken;
  const csrfHeader = req.headers["x-csrf-token"] as string | undefined;

  // For safe methods allow through
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) return next();

  if (!csrfCookie || !csrfHeader) {
    return res.status(403).json({ error: "CSRF token missing" });
  }

  if (csrfCookie !== csrfHeader) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  next();
};

export default requireCsrfToken;
