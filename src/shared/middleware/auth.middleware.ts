import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User, IUser } from "../models";

// JWT payload Interface
interface JwtPayload {
  userId: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
}

// Extends express request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: IUser | null;
    }
  }
}

// Verifies JWT Access Token from cookies
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Accept token from cookie OR Authorization header (Bearer)
  let token = req.cookies?.accessToken as string | undefined;
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (
    !token &&
    typeof authHeader === "string" &&
    authHeader.startsWith("Bearer ")
  ) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ error: "Authentication required. No token provided." });
  }

  try {
    // Verifies token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Finds user based on decoded userId excluding password
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ error: "Authentication failed. User not found." });
    }

    // Checks if user is banned
    if (user.status === "banned") {
      // Checks if ban has expired
      if (user.bannedUntil && user.bannedUntil < new Date()) {
        // Ban has expired reactivate user
        user.status = "active";
        user.bannedReason = undefined;
        user.bannedUntil = undefined;
        await user.save();
      } else {
        // User is still banned
        const banMessage = user.bannedReason
          ? `Account is banned. Reason: ${user.bannedReason}`
          : "Account is banned.";
        const banUntilMessage = user.bannedUntil
          ? ` Banned until: ${user.bannedUntil.toISOString()}`
          : "";
        return res.status(403).json({ error: banMessage + banUntilMessage });
      }
    }

    // Attaches user document to request object
    req.user = user;

    next(); // Proceeds to next middleware or handler
  } catch (error) {
    console.error("JWT Verification Error:", error);
    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .json({ error: "Authentication failed. Token expired." });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res
        .status(401)
        .json({ error: "Authentication failed. Invalid token." });
    }
    // For other errors pass to global error handler
    return next(error);
  }
};

// Middleware to check if the authenticated user is admin

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Forbidden. Admin privileges required." });
  }

  next(); // User is an admin next
};
