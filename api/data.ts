// Serverless entry for main API (TypeScript)
import app from "../src/api-server/app";
import { connectDB } from "../src/shared/db";

connectDB().catch((err) => {
  console.error("Failed to connect to database:", err);
});

export = app;
