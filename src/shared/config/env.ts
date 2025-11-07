import { z } from "zod";
import dotenv from "dotenv";

// Loads environment variables from .env file
dotenv.config();

// Defines schema for environment variables
const envSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("8000"),
  AUTH_PORT: z.string().default("8001"),

  // Database
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters for security"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  JWT_ACCESS_COOKIE_MAX_AGE: z.string().default("900000"), // 15 minutes in ms
  JWT_REFRESH_COOKIE_MAX_AGE: z.string().default("604800000"), // 7 days in ms

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Message Encryption
  MESSAGE_ENCRYPTION_KEY: z
    .string()
    .length(32, "MESSAGE_ENCRYPTION_KEY must be exactly 32 characters long"),
});

// Parses and validates environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment variable validation failed:");
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
      });
      console.error(
        "\n💡 Check your .env file and ensure all required variables are set."
      );
    }
    process.exit(1);
  }
};

// Exports validated environment variables
export const env = parseEnv();

// Exports type for use in other files
export type Env = z.infer<typeof envSchema>;
