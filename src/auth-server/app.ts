import express, { Express, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { env } from "@shared/config/env";
import { errorHandler } from "@shared/middleware/errorHandler.middleware";
import { requireAuth, isAdmin } from "@shared/middleware/auth.middleware";
import authRouter from "./routes/auth.routes";

const authApp: Express = express();

// Middleware Setup
// CORS configuration with credentials for cookie support
const allowedOrigins = [
  env.CORS_ORIGIN, // Shop frontend
  "http://localhost:3002", // Admin dashboard (dev mode)
  "tauri://localhost", // Tauri desktop app
];

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true); // Origin is allowed
    } else {
      callback(new Error("Not allowed by CORS")); // Origin is not allowed
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-CSRF-Token"],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200,
};
authApp.use(cors(corsOptions));
authApp.use(express.json({ limit: "10mb" }));
authApp.use(cookieParser());

// Health Check Endpoint (Admin)
authApp.get("/health", requireAuth, isAdmin, (req: Request, res: Response) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  const statusCode = dbStatus === "connected" ? 200 : 503;

  if (env.NODE_ENV === "production") {
    return res.status(statusCode).json({
      status: dbStatus === "connected" ? "ok" : "unhealthy",
      service: "authentication",
    });
  }

  const health = {
    status: "ok",
    service: "authentication",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    database: dbStatus,
  };

  res.status(statusCode).json(health);
});

// Authentication Routes
const apiBasePath = "/api/v1";
authApp.use(`${apiBasePath}/auth`, authRouter);

// Global Error Handler
authApp.use(errorHandler);

export default authApp;
