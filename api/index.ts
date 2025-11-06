import app from "../src/api-server/app";
import { connectDB } from "../src/shared/db";

// Ensure database connection before handling requests
connectDB().catch((err) => {
  console.error("Failed to connect to database:", err);
});

export default app;
