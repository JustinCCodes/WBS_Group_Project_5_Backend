import express, { Express, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { env } from "@shared/config/env";
import { errorHandler } from "@shared/middleware/errorHandler.middleware";
import {
  userRouter,
  categoryRouter,
  productRouter,
  orderRouter,
  adminRouter,
} from "./routes";

const app: Express = express();

// Middleware Setup
const corsOptions = { origin: env.CORS_ORIGIN, credentials: true };
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" })); // Limits request body size to prevent DoS
app.use(cookieParser());

// Test Route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the eCommerce API!" });
});

// Health Check Endpoint
app.get("/health", (req: Request, res: Response) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  const statusCode = dbStatus === "connected" ? 200 : 503;

  // Returns minimal info in production to avoid information leakage
  if (env.NODE_ENV === "production") {
    return res.status(statusCode).json({
      status: dbStatus === "connected" ? "ok" : "unhealthy",
    });
  }

  // Detailed info for development/testing
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    database: dbStatus,
  };

  res.status(statusCode).json(health);
});

// API ROUTES
const apiBasePath = "/api/v1";

app.use(`${apiBasePath}/users`, userRouter);
app.use(`${apiBasePath}/categories`, categoryRouter);
app.use(`${apiBasePath}/products`, productRouter);
app.use(`${apiBasePath}/orders`, orderRouter);
app.use(`${apiBasePath}/admin`, adminRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
