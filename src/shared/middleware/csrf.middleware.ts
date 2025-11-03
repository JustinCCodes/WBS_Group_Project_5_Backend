import { Request, Response, NextFunction } from "express";

// Middleware to protect against CSRF attacks
export const requireCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // CSRF token expected in cookie
  const csrfCookie = req.cookies?.csrfToken;
  // CSRF token expected in header
  const csrfHeader = req.headers["x-csrf-token"] as string | undefined;

  // For safe methods allow through
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) return next();

  // Check if tokens are present
  if (!csrfCookie || !csrfHeader) {
    return res.status(403).json({ error: "CSRF token missing" });
  }

  // Compare tokens
  if (csrfCookie !== csrfHeader) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  next();
};

export default requireCsrfToken;
