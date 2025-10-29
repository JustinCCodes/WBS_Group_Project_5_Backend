import { z } from "zod";
import mongoose from "mongoose";

// Reusable schema for MongoDB ObjectId validation
export const objectIdSchema = z
  .string()
  .min(1, "ID is required")
  .refine(
    (val) => {
      return mongoose.Types.ObjectId.isValid(val);
    },
    {
      message: "Invalid ObjectId format",
    }
  );

// Reusable schema for request parameters with ID
export const paramsWithIdSchema = z.object({
  id: objectIdSchema,
});

// Reusable schema for pagination
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .refine((val) => parseInt(val) > 0, {
      message: "Page must be a positive number",
    })
    .transform((val) => parseInt(val)),
  limit: z
    .string()
    .optional()
    .default("10")
    .refine((val) => parseInt(val) > 0, {
      message: "Limit must be a positive number",
    })
    .transform((val) => parseInt(val)),
  // Maybe add sort here later
});
