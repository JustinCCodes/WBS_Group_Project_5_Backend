import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "@shared/config/env";
import { errorHandler } from "@shared/middleware/errorHandler.middleware";
import {
  userRouter,
  categoryRouter,
  productRouter,
  orderRouter,
  adminRouter,
  healthRouter,
} from "./routes";

const app: Express = express();

const allowedOrigins = [
  env.CORS_ORIGIN, // Shop frontend (e.g., http://localhost:3000)
  "http://localhost:3002", // Admin dashboard (dev mode)
  "tauri://localhost", // Tauri desktop app (production build)
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

// Health Check Routes
app.use("/health", healthRouter);

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
