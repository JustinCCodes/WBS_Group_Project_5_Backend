import app from "./app";
import { connectDB } from "./db";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start express server after successful DB connect
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    // Catch errors during startup
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer(); // Start server
