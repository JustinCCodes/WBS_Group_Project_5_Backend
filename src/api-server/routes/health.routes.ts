import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { env } from "../../shared/config/env";
import { requireAuth, isAdmin } from "../../shared/middleware";

const router = Router();

// Public health check endpoint
// Minimal response for load balancers and monitoring services
router.get("/", (req: Request, res: Response) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  const statusCode = dbStatus === "connected" ? 200 : 503;

  res.status(statusCode).json({
    status: dbStatus === "connected" ? "ok" : "unhealthy",
  });
});

// Admin only detailed health check endpoint
// Provides system information for internal monitoring
router.get("/detailed", requireAuth, isAdmin, (req: Request, res: Response) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  const statusCode = dbStatus === "connected" ? 200 : 503;

  const health = {
    status: dbStatus === "connected" ? "ok" : "unhealthy",
    service: "api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    database: dbStatus,
    memory: {
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
    },
  };

  res.status(statusCode).json(health);
});

export default router;
