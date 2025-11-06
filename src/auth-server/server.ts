import authApp from "./app";
import { connectDB } from "../shared/db";
import { env } from "../shared/config/env";

const AUTH_PORT = env.AUTH_PORT || 8001;

const startAuthServer = async () => {
  try {
    // Connects to database (shared with main app)
    await connectDB();

    // Starts authentication server
    authApp.listen(AUTH_PORT, () => {
      console.log(
        `Authentication Server is running on http://localhost:${AUTH_PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start authentication server:", error);
    process.exit(1);
  }
};

startAuthServer();
