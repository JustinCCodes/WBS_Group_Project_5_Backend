import app from "../dist/api-server/app";
import { connectDB } from "../dist/shared/db";

// Connects to the database when the server starts
connectDB().catch((err) => {
  console.error("Failed to connect to database:", err);
});

export default app;
