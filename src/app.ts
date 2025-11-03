import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./shared/config/env";
import { errorHandler } from "./shared/middleware/errorHandler.middleware";
import {
  userRouter,
  categoryRouter,
  productRouter,
  orderRouter,
  adminRouter,
  healthRouter,
} from "./api-server/routes";

const app: Express = express();

// Middleware Setup
const corsOptions = { origin: env.CORS_ORIGIN, credentials: true };
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" })); // Limits request body size to prevent DoS
app.use(cookieParser());

// Health Check Routes
app.use("/health", healthRouter);

// API ROUTES
const apiBasePath = "/api/v1";

// Mount routers
app.use(`${apiBasePath}/users`, userRouter);
app.use(`${apiBasePath}/categories`, categoryRouter);
app.use(`${apiBasePath}/products`, productRouter);
app.use(`${apiBasePath}/orders`, orderRouter);
app.use(`${apiBasePath}/admin`, adminRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
