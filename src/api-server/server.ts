import app from "./app";
import { connectDB } from "../shared/db";
import { env } from "../shared/config/env";

const PORT = env.PORT || 8000;

const startServer = async () => {
  try {
    // Connects to database
    await connectDB();

    // Starts express server after successful DB connect
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    // Catches errors during startup
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer(); // Starts server
