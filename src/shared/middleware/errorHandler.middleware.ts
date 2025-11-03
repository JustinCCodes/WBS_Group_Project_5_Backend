import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { env } from "../config/env";

// Defines a custom error type to include status code
interface HttpError extends Error {
  status?: number;
}

export const errorHandler: ErrorRequestHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction // For express to recognize the error handler
) => {
  // Log the error
  console.error("Error:", err.message);
  if (env.NODE_ENV === "development" && err.stack) {
    console.error(err.stack);
  }

  // Determines the status code default to 500
  const statusCode = err.status || 500;

  // Send a generic error response - never expose stack traces to client
  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
  });
};
