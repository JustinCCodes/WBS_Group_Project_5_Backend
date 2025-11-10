import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "../shared/config/env";
import { errorHandler } from "../shared/middleware/errorHandler.middleware";
import {
  userRouter,
  categoryRouter,
  productRouter,
  orderRouter,
  adminRouter,
  healthRouter,
  contactRouter,
  addressRouter,
} from "./routes";
import { authRouter } from "../auth-server/routes";

const app: Express = express();

// Trust proxy to 1 to trust first proxy (Vercel)
// Required for express-rate-limit to work correctly on Vercel
app.set("trust proxy", 1);

const allowedOrigins = [
  env.CORS_ORIGIN, // Shop frontend
  "http://localhost:3002", // Admin dashboard (dev mode)
  "tauri://localhost", // Tauri desktop app (production build)
  "https://ecommerce-project-justinccodes-frontend.vercel.app", // Frontend URL
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
      // If in development also allow the default Vercel frontend URL
      if (
        env.NODE_ENV !== "production" &&
        origin.includes("ecommerce-project-justinccodes-frontend")
      ) {
        return callback(null, true);
      }
      callback(new Error(`Not allowed by CORS: ${origin}`)); // Origin is not allowed
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-CSRF-Token"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" })); // Limits request body size to prevent DoS
app.use(cookieParser());

// Health Check Routes
app.use("/health", healthRouter);

// API ROUTES
const apiBasePath = "/api/v1";

// Mount routers
app.use(`${apiBasePath}/auth`, authRouter);
app.use(`${apiBasePath}/users`, userRouter);
app.use(`${apiBasePath}/categories`, categoryRouter);
app.use(`${apiBasePath}/products`, productRouter);
app.use(`${apiBasePath}/orders`, orderRouter);
app.use(`${apiBasePath}/admin`, adminRouter);
app.use(`${apiBasePath}/contact`, contactRouter);
app.use(`${apiBasePath}/addresses`, addressRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
