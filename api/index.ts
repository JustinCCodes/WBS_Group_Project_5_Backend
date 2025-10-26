import app from "../src/api-server/app";
import { connectDB } from "../src/shared/db";

// Ensurse database connection before handling requests
connectDB().catch((err) => {
  console.error("Failed to connect to database:", err);
});

// Exports the express app as serverless function for vercel
export default app;
