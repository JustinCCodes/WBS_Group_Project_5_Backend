import app from "../src/api-server/app";
import { connectDB } from "../src/shared/db";
import { Request, Response } from "express";

// Start the database connection promise once
const db = connectDB().catch((err) => {
  console.error("Failed to connect to database on startup:", err);
  throw new Error("Database connection failed.");
});

// Export async handler for Vercel
export default async (req: Request, res: Response) => {
  try {
    // Wait for single database connection promise to resolve
    await db;

    // Once connection is ready pass request to express app
    return app(req, res);
  } catch (err) {
    // This catches errors from db promise
    console.error("Database connection error during request:", err);
    res
      .status(503)
      .json({ error: "Service Unavailable: Database connection failed." });
  }
};
