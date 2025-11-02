import express, { Express, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { env } from "@shared/config/env";
import { errorHandler } from "@shared/middleware/errorHandler.middleware";
import { requireAuth, isAdmin } from "@shared/middleware/auth.middleware";
import {
  userRouter,
  categoryRouter,
  productRouter,
  orderRouter,
  adminRouter,
} from "./routes";

const app: Express = express();

const allowedOrigins = [
  env.CORS_ORIGIN, // Shop frontend (e.g., http://localhost:3000)
  env.ADMIN_CORS_ORIGIN, // Admin app (e.g., http://localhost:3002)
  "tauri://localhost", // Tauri desktop app origin
];

// CORS configuration with credentials for cookie support
const corsOptions = {
  // Uses function to check the origin
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // allow requests with no origin (like mobile apps or curl)
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
  // exposedHeaders removed for Set-Cookie (not necessary)
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" })); // Limits request body size to prevent DoS
app.use(cookieParser());

// Test Route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the eCommerce API!" });
});

// Health Check Endpoint (Admin)
app.get("/health", requireAuth, isAdmin, (req: Request, res: Response) => {
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
