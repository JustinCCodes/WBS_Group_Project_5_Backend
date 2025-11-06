// Serverless entry for auth API (TypeScript)
import app from "../src/auth-server/app";
import { connectDB } from "../src/shared/db";

connectDB().catch((err) => {
  console.error("Failed to connect to database:", err);
});

export = app;
