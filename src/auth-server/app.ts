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
const corsOptions = { origin: env.CORS_ORIGIN, credentials: true };
authApp.use(cors(corsOptions));
authApp.use(express.json({ limit: "10mb" }));
authApp.use(cookieParser());

// Test Route
authApp.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the Authentication Server!" });
});

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
