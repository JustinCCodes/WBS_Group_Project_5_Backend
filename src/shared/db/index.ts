import mongoose from "mongoose";
import { env } from "../config/env";

// Cache the database connection for serverless environments
let cachedConnection: typeof mongoose | null = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  // If we have a cached connection and it's still connected, reuse it
  if (cachedConnection && cachedConnection.connection.readyState === 1) {
    console.log("Using cached MongoDB connection.");
    return cachedConnection;
  }

  try {
    // Connection options optimized for serverless
    const options = {
      bufferCommands: false, // Disables mongoose buffering
      maxPoolSize: 10, // Maximum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // Timeout for initial server selection
      socketTimeoutMS: 45000, // Timeout for socket inactivity
    };

    cachedConnection = await mongoose.connect(env.MONGO_URI, options);
    console.log("MongoDB Connected successfully.");
    return cachedConnection;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    cachedConnection = null; // Resets cache on error
    throw error; // Lets the caller handle the error
  }
};
